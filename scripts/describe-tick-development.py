"""Descriptive exposure/credit accounting from an already failed bank only.

No new worlds, fitted models, gate changes or scientific success tests.
"""
import collections
import gzip
import hashlib
import json
import math
import sys
from pathlib import Path


def describe(directory):
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    folder = directory/'development'
    result = json.loads((folder/'results.json').read_text(encoding='utf8'))
    assert result['promising'] is False, 'Descriptive failure diagnosis only'
    histories = []
    for h in p['developmentHistories']:
        row = json.loads((folder/'rows'/f"{h['seed']}.json").read_text(encoding='utf8'))
        phases = {}
        for name in ['A', 'B', 'C', 'return-A']:
            phases[name] = dict(decisions=0, actions=[0, 0, 0, 0], cueDecisions=0, distinctCues=[],
                physicalReceipts=0, beneficialEaten=0., harmfulEaten=0., toxinDamage=0., physicalCosts=0.,
                foodReceipts=0, mixedReceipts=0, transitions=0, rewardSum=0., absoluteReward=0.,
                positiveRewards=0, negativeRewards=0, zeroRewards=0, terminalTransitions=0, terminalAbsoluteReward=0.)
        cues = {key: set() for key in phases}
        end_models, saved, initial = None, None, None
        digest = hashlib.sha256()
        with gzip.open(folder/'numerics'/f"{h['seed']}.jsonl.gz", 'rb') as stream:
            for line in stream:
                digest.update(line)
                if line.startswith(b'{"type":"main-start","arm":"candidate",'):
                    initial = json.loads(line)['checkpoint']['state']['learners']
                elif line.startswith(b'{"type":"main-end","arm":"candidate",'):
                    state = json.loads(line)['checkpoint']['state']
                    end_models, saved = state['learners'], state['savedModels']
                elif line.startswith(b'{"role":"main:candidate",'):
                    e = json.loads(line)['event']
                    kind = e['type']
                    if kind not in ('decision', 'physical', 'transition'):
                        continue
                    tick = e['own']['tick'] if kind == 'decision' else e['tick']
                    family = 'A' if tick <= 512 else 'B' if tick <= 1024 else 'C' if tick <= 1536 else 'return-A'
                    phase = phases[family]
                    if kind == 'decision':
                        phase['decisions'] += 1
                        phase['actions'][e['choice']] += 1
                        if any(e['sourceCue']):
                            phase['cueDecisions'] += 1
                            cues[family].add(tuple(e['sourceCue']))
                    elif kind == 'physical':
                        phase['physicalReceipts'] += 1
                        for field in ['beneficialEaten', 'harmfulEaten', 'toxinDamage']:
                            phase[field] += e[field]
                        phase['physicalCosts'] += e['cost']
                        phase['foodReceipts'] += e['beneficialEaten'] > 0 or e['harmfulEaten'] > 0
                        phase['mixedReceipts'] += e['beneficialEaten'] > 0 and e['harmfulEaten'] > 0
                    else:
                        phase['transitions'] += 1
                        reward = e['reward']
                        assert math.isfinite(reward)
                        phase['rewardSum'] += reward
                        phase['absoluteReward'] += abs(reward)
                        phase['positiveRewards' if reward > 0 else 'negativeRewards' if reward < 0 else 'zeroRewards'] += 1
                        if e['terminal']:
                            phase['terminalTransitions'] += 1
                            phase['terminalAbsoluteReward'] += abs(reward)
        assert digest.hexdigest() == row['uncompressedSha256']
        assert sum(v['decisions'] for v in phases.values()) == row['arms']['candidate']['activity']['decisions']
        assert sum(v['transitions'] for v in phases.values()) == row['arms']['candidate']['activity']['updates']
        totals = row['arms']['candidate']['endpoint']['totals']
        for field in ['beneficialEaten', 'harmfulEaten', 'toxinDamage']:
            actual = sum(v[field] for v in phases.values())
            assert math.isclose(actual, totals[field], rel_tol=1e-10, abs_tol=1e-10), field
        for family, phase in phases.items():
            assert phase['decisions'] == phase['physicalReceipts'] == sum(phase['actions'])
            phase['distinctCues'] = [list(v) for v in sorted(cues[family])]
        weight_changes = {}
        for version, weights in [('A', saved['A']), ('B', saved['B']), ('final', {key: state['weights'] for key, state in end_models.items()})]:
            differences = [abs(v-initial[key]['weights'][index]) for key, values in weights.items() for index, v in enumerate(values)]
            weight_changes[version] = dict(l1=sum(differences), maxAbsolute=max(differences))
        histories.append(dict(seed=h['seed'], phases=phases, weightChangesFromInitialization=weight_changes))
    return dict(schema=1, kind='post-hoc-tick-exposure-credit-description', histories=histories,
        protocolSha256=hashlib.sha256((directory/'protocol.json').read_bytes()).hexdigest(),
        resultsSha256=hashlib.sha256((folder/'results.json').read_bytes()).hexdigest(),
        scope='Descriptive arithmetic of existing failed candidate traces only. Not failure-cause identification, fresh evidence, parameter selection or qualification. The bank and reserve remain closed.')


if __name__ == '__main__':
    directory, output = Path(sys.argv[1]).resolve(), Path(sys.argv[2])
    result = describe(directory)
    with output.open('x', encoding='utf8') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print(json.dumps(dict(passed=True, histories=len(result['histories']), scope=result['scope'])))
