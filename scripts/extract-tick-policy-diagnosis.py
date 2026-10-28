"""Fixed post-hoc extraction from the already failed tick development tapes.

No new simulation, labels supplied to learners, fitted model or acceptance test.
"""
import gzip
import hashlib
import json
import sys
from pathlib import Path


def sha(path):
    out = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            out.update(chunk)
    return out.hexdigest()


def family(tick):
    return 'A' if tick <= 512 else 'B' if tick <= 1024 else 'C' if tick <= 1536 else 'return-A'


def extract(directory):
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    folder = directory/'development'
    result = json.loads((folder/'results.json').read_text(encoding='utf8'))
    assert result['promising'] is False and not (directory/'confirmation').exists()
    for name in ['physical-audit.json', 'numeric-audit.json']:
        audit = json.loads((folder/name).read_text(encoding='utf8'))
        assert audit['passed'] and audit['protocolSha256'] == sha(directory/'protocol.json') and audit['resultsSha256'] == sha(folder/'results.json')
    histories = []
    for index, h in enumerate(p['developmentHistories']):
        path = folder/'rows'/f"{h['seed']}.json"
        assert sha(path) == result['rowSha256'][index]
        row = json.loads(path.read_text(encoding='utf8'))
        trace = folder/'numerics'/f"{h['seed']}.jsonl.gz"
        assert sha(trace) == row['numericsSha256']
        raw_hash = hashlib.sha256()
        first, last, decisions, cells, transitions = {}, {}, {}, {}, {}
        initial, final, at_c, codebook, ids, saved = None, None, None, None, None, None
        for phase in ['A', 'B', 'C', 'return-A']:
            cells[phase] = [dict(label=label, action=action, decisions=0, beneficialReceipts=0, harmfulReceipts=0,
                beneficialEaten=0., harmfulEaten=0., toxinDamage=0., physicalCosts=0.) for label in [-1, 0, 1] for action in range(4)]
            transitions[phase] = dict(count=0, reward=0., absoluteReward=0., delta=0., absoluteDelta=0., positiveDelta=0, negativeDelta=0, terminal=0)
        with gzip.open(trace, 'rb') as stream:
            for line in stream:
                raw_hash.update(line)
                if line.startswith(b'{"type":"main-start","arm":"candidate",'):
                    state = json.loads(line)['checkpoint']['state']
                    initial, codebook, ids = state['learners'], state['codebook'], state['founderIds']
                elif line.startswith(b'{"type":"main-end","arm":"candidate",'):
                    cp = json.loads(line)['checkpoint']
                    final, saved, at_c = cp['state']['learners'], cp['state']['savedModels'], cp['atC']
                elif line.startswith(b'{"role":"main:candidate",'):
                    e = json.loads(line)['event']
                    if e['type'] == 'decision':
                        own = e['own']
                        phase, agent_id = family(own['tick']), own['agentId']
                        pool = codebook['A' if phase == 'return-A' else phase]
                        match = next((v for v in pool if v['bits'] == e['sourceCue']), None)
                        assert match is not None or e['sourceCue'] == [0, 0, 0, 0], 'unknown source odor'
                        label = match['valence'] if match else 0
                        cell = next(v for v in cells[phase] if v['label'] == label and v['action'] == e['choice'])
                        cell['decisions'] += 1
                        decisions[agent_id] = (own['tick'], phase, cell)
                        context = dict(agentId=agent_id, phase=phase, tick=own['tick'], raw=own['raw'], observation=own['observation'], sourceCue=e['sourceCue'])
                        key = (phase, agent_id)
                        first.setdefault(key, context)
                        last[key] = context
                    elif e['type'] == 'physical':
                        tick, phase, cell = decisions.pop(e['agentId'])
                        assert tick == e['tick']
                        for key in ['beneficialEaten', 'harmfulEaten', 'toxinDamage']:
                            cell[key] += e[key]
                        cell['physicalCosts'] += e['cost']
                        cell['beneficialReceipts'] += e['beneficialEaten'] > 0
                        cell['harmfulReceipts'] += e['harmfulEaten'] > 0
                    elif e['type'] == 'transition':
                        state = transitions[family(e['tick'])]
                        state['count'] += 1
                        state['reward'] += e['reward']
                        state['absoluteReward'] += abs(e['reward'])
                        state['delta'] += e['delta']
                        state['absoluteDelta'] += abs(e['delta'])
                        state['positiveDelta'] += e['delta'] > 0
                        state['negativeDelta'] += e['delta'] < 0
                        state['terminal'] += e['terminal']
        assert not decisions and raw_hash.hexdigest() == row['uncompressedSha256']
        assert at_c is not None, 'This extraction expects the observed end-C checkpoints; no missing-model imputation'
        models = dict(initial={key: s['weights'] for key, s in initial.items()}, A=saved['A'], B=saved['B'],
                      C={key: s['weights'] for key, s in at_c['state']['learners'].items()}, final={key: s['weights'] for key, s in final.items()})
        assert all(set(v) == {str(i) for i in ids} for v in models.values())
        contexts = []
        missing = []
        for phase in ['A', 'B', 'C', 'return-A']:
            for agent_id in ids:
                key = (phase, agent_id)
                if key not in first:
                    missing.append(dict(phase=phase, agentId=agent_id))
                    continue
                contexts.append(dict(edge='first', **first[key]))
                if last[key]['tick'] != first[key]['tick']:
                    contexts.append(dict(edge='last', **last[key]))
        assert sum(v['decisions'] for cell in cells.values() for v in cell) == row['arms']['candidate']['activity']['decisions']
        assert sum(v['count'] for v in transitions.values()) == row['arms']['candidate']['activity']['updates']
        histories.append(dict(seed=h['seed'], rowSha256=sha(path), compressedSha256=row['numericsSha256'], uncompressedSha256=row['uncompressedSha256'],
                              founderIds=ids, codebook=codebook, models=models, contexts=contexts, missingContexts=missing,
                              cueIntakeCells=cells, transitionSummaries=transitions))
    return dict(schema=1, kind='tick-policy-diagnosis-input', protocolSha256=sha(directory/'protocol.json'), resultsSha256=sha(folder/'results.json'),
                extractorSha256=sha(Path(__file__)), histories=histories,
                rule='Every original founder: first and last recorded own decision per phase, unique if identical; absent contexts explicit. Every initialized/saved-A/saved-B/end-C/final weight state retained, including dead founders. No fitted selection.',
                scope='Post-hoc descriptive policy and cue/outcome diagnosis of an immutable failed bank, not fresh performance or a causal explanation of its failure.')


if __name__ == '__main__':
    result = extract(Path(sys.argv[1]).resolve())
    with Path(sys.argv[2]).open('x', encoding='utf8') as stream:
        json.dump(result, stream, separators=(',', ':'))
        stream.write('\n')
    print(json.dumps(dict(histories=len(result['histories']), contexts=sum(len(v['contexts']) for v in result['histories']), scope=result['scope'])))
