"""Post-hoc descriptive exposure/preference audit; no simulation or learning.

Evaluator-only codebooks label recorded cues for diagnosis. They never return
to a learner. This is not a causal explanation or a new scientific gate.
"""
import json
from pathlib import Path
import runpy
import sys

authority = runpy.run_path(str(Path(__file__).with_name('audit-cue-authority.py')))


def analyze(directory):
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    result = {'schema': 1, 'scope': 'Post-hoc description only; no new worlds, fitting, gate changes or counterfactual outcomes.', 'histories': []}
    for h in p['developmentHistories']:
        book = authority['codebook'](h['cueSeed'])
        groups = {phase: {'completed': 0, 'approach': 0, 'noCue': 0, 'foodContact': 0, 'good': 0., 'harm': 0., 'beneficial': [], 'harmful': []} for phase in ['A', 'B', 'C', 'return-A']}
        own, ledgers = {}, {}
        with (directory/'development/numerics'/f"{h['seed']}.jsonl").open(encoding='utf8') as stream:
            for line in stream:
                e = json.loads(line)
                if e['arm'] != 'candidate':
                    continue
                if e['type'] == 'own':
                    own[(e['agentId'], e['tick'])] = e['observation']
                elif e['type'] == 'ledger':
                    ledgers[(e['agentId'], e['tick'])] = e
                elif e['type'] == 'experience':
                    for tr in e['transitions']:
                        phase = 'A' if tr['tick'] <= 512 else 'B' if tr['tick'] <= 1024 else 'C' if tr['tick'] <= 1536 else 'return-A'
                        group = groups[phase]
                        obs = own[(e['agentId'], tr['tick'])]
                        bits = [obs[0], 2*obs[1]-1, 2*obs[2]-1, 2*obs[3]-1]
                        item = next((v for v in book['A' if phase == 'return-A' else phase] if v['bits'] == bits), None)
                        receipt = ledgers[(e['agentId'], tr['tick'])]
                        group['completed'] += 1
                        group['approach'] += int(tr['action'] > 0)
                        group['foodContact'] += int(receipt['beneficialEaten']+receipt['harmfulEaten'] > 0)
                        group['good'] += receipt['beneficialEaten']
                        group['harm'] += receipt['harmfulEaten']
                        if item:
                            group['beneficial' if item['valence'] > 0 else 'harmful'].append(tr['probability'])
                        else:
                            group['noCue'] += 1
        phases = []
        for phase, group in groups.items():
            means = {key: sum(group[key])/len(group[key]) if group[key] else None for key in ['beneficial', 'harmful']}
            phases.append({'phase': phase, **{k: v for k, v in group.items() if k not in means},
                           'positiveCueDecisions': len(group['beneficial']), 'negativeCueDecisions': len(group['harmful']),
                           'meanApproachProbabilityPositiveCue': means['beneficial'], 'meanApproachProbabilityNegativeCue': means['harmful'],
                           'descriptiveDiscrimination': means['beneficial']-means['harmful'] if all(v is not None for v in means.values()) else None})
        result['histories'].append({'seed': h['seed'], 'phases': phases})
    return result


if __name__ == '__main__':
    directory = Path(sys.argv[1]).resolve()
    result = analyze(directory)
    target = directory/'posthoc-exposure.json'
    with target.open('x', encoding='utf8', newline='\n') as f:
        json.dump(result, f, indent=2)
        f.write('\n')
    print(json.dumps({'histories': len(result['histories']), 'output': str(target)}))
