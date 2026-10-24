"""Independent factual Expected-SARSA/replay arithmetic and screen inference.

Does not import JavaScript scores or invoke its scoring implementation.
Physical provenance is established separately by the full cold Node audit.
"""
import hashlib
import json
import math
from pathlib import Path
import sys
import warnings

import numpy as np
from scipy.stats import t as student_t


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def close(a, b, label):
    assert np.allclose(a, b, rtol=1e-9, atol=1e-10), label


def rng(value):
    value ^= (value << 13) & 0xffffffff
    value ^= value >> 17
    value ^= (value << 5) & 0xffffffff
    return value & 0xffffffff


def draw(s, key):
    s[key] = rng(s[key])
    return s[key] / 4294967296


def features(s, obs):
    if s.get('tile'):
        history = s['history']
        old = history[-1] if history else None
        average = lambda channel: sum(h['observation'][channel] for h in history) / len(history) if history else obs[channel]
        groups = [[(obs[0] + 1) / 2, obs[3], obs[4], obs[13]], [obs[1], obs[2], obs[10], obs[11]],
                  [obs[3], average(3), (obs[3] - (old['observation'][3] if old else obs[3]) + 1) / 2, ((old['choice'] if old else 0) + 1) / 2],
                  [obs[4], average(4), average(13), obs[12]]]
        s['operations'] += 3 * (len(history) + 1) + 12
        counts = {}
        for g, group in enumerate(groups):
            for tiling in range(4):
                cells = [math.floor(v * 4 + (tiling * (2 * d + 1) % 4) / 4) for d, v in enumerate(group)]
                s['operations'] += 16
                key = str(g) + ':' + str(tiling) + ':' + ','.join(str(v) for v in cells)
                hashed = 2166136261
                for char in key:
                    hashed = ((hashed ^ ord(char)) * 16777619) & 0xffffffff
                    s['operations'] += 3
                index = hashed % 256
                counts[index] = counts.get(index, 0) + 1
                s['operations'] += 2
        norm = math.sqrt(sum(v * v for _, v in sorted(counts.items())))
        s['operations'] += len(counts) * 3 + 1
        return [[i, v / norm] for i, v in sorted(counts.items())]
    channels = [0, 1, 2, 3, 4, 10, 11, 12, 13]
    raw = [1] + [obs[i] for i in channels] + [0] * (10 * (3 - len(s['history'])))
    for h in s['history']:
        raw += [h['observation'][i] / 3 for i in channels] + [h['choice'] / 3]
    norm = max(1, math.sqrt(sum(v * v for v in raw)))
    s['operations'] += 160
    return np.array([v / norm for v in raw])


def values(s, phi):
    if s.get('tile'):
        s['operations'] += len(phi) * 4
        return [sum(float(row[i]) * float(v) for i, v in phi) for row in s['weights']]
    s['operations'] += 160
    return [sum(float(w) * float(x) for w, x in zip(row, phi)) for row in s['weights']]


def target(s, tr):
    if tr['terminal']:
        return tr['reward']
    q = values(s, tr['nextPhi'])
    return tr['reward'] + math.exp(-tr['duration'] / 256) * (.9 * max(q) + .1 * sum(q) / 2)


def update(s, tr):
    assert tr['experience'] == s['transitions'] + 1
    assert tr['agentId'] == s['agentId'] and s['acquisition']
    close(tr['reward'], (tr['finalEnergy'] - tr['initialEnergy']) / 120, 'reward/energy')
    a = int(tr['action'] > 0)
    predicted = values(s, tr['phi'])[a]
    delta = target(s, tr) - predicted
    s['eligibility'] *= math.exp(-tr['duration'] / 256) * s['config']['lambda']
    dense = np.zeros(256) if s.get('tile') else np.array(tr['phi'])
    if s.get('tile'):
        for i, v in tr['phi']:
            dense[i] = v
    s['eligibility'][a] += dense
    s['weights'] += s['config']['updateRate'] * delta * s['eligibility']
    s['operations'] += 2560 if s.get('tile') else 400
    s['transitions'] += 1
    s['recent'].append(tr)
    if len(s['recent']) > 16:
        displaced = s['recent'].pop(0)
        s['olderSeen'] += 1
        if len(s['older']) < 48:
            s['older'].append(displaced)
        else:
            i = math.floor(draw(s, 'retentionRngState') * s['olderSeen'])
            if i < 48:
                s['older'][i] = displaced
    memory = s['older'] + s['recent']
    selected = memory[math.floor(draw(s, 'replayRngState') * len(memory))]
    a = int(selected['action'] > 0)
    error = target(s, selected) - values(s, selected['phi'])[a]
    if s.get('tile'):
        for i, v in selected['phi']:
            s['weights'][a][i] += s['config']['replayRate'] * error * v
        s['operations'] += len(selected['phi']) * 3
    else:
        s['weights'][a] += s['config']['replayRate'] * error * np.array(selected['phi'])
        s['operations'] += 120
    if tr['terminal']:
        s['eligibility'].fill(0)


def audit_trace(path, seed, program=None):
    states = {}
    transitions = decisions = bodies = 0
    with path.open(encoding='utf8') as stream:
        for line in stream:
            e = json.loads(line)
            if program is not None and e.get('program') != program:
                continue
            arm = e['arm']
            if e['type'] == 'start':
                assert e['seed'] == seed
                states[arm] = {}
                for original in e['learners']:
                    s = dict(original)
                    s['tile'] = s['config'].get('representation') == 'local-tiles-v1'
                    size = 256 if s['tile'] else 40
                    s.update(weights=np.zeros((2, size)), eligibility=np.zeros((2, size)), history=[], recent=[], older=[], operations=0)
                    expected = (seed ^ ((s['agentId'] * 2654435761) & 0xffffffff)) & 0xffffffff or 1
                    assert s['rngState'] == expected
                    assert s['retentionRngState'] == ((expected ^ 0x9e3779b9) or 1)
                    assert s['replayRngState'] == ((expected ^ 0xa511e9b3) or 1)
                    close(original['weights'], s['weights'], 'initial weights')
                    states[arm][s['agentId']] = s
            elif e['type'] == 'intervention':
                for s in states[arm].values():
                    s['eligibility'].fill(0)
                    if e['action'] == 'freeze':
                        s['acquisition'] = False
                    else:
                        s['weights'].fill(0)
                        s['history'], s['recent'], s['older'], s['olderSeen'] = [], [], [], 0
            elif e['type'] == 'experience':
                s = states[arm][e['agentId']]
                decision = e['decision']
                records = e.get('transitions', [e['transition']] if e.get('transition') else [])
                phi = features(s, decision['observation']) if decision else None
                before = [tr for tr in records if not decision or tr['tick'] < e['tick']]
                after = [tr for tr in records if decision and tr['tick'] == e['tick']]
                for tr in before:
                    assert 0 < tr['duration'] <= 8
                    close(tr['nextPhi'], ([] if s['tile'] else np.zeros(40)) if tr['terminal'] else phi, 'next-history features')
                    if s.get('lastDecisionPhi') is not None:
                        close(tr['phi'], s['lastDecisionPhi'], 'factual prior features')
                    update(s, tr)
                    transitions += 1
                if decision:
                    q = values(s, phi)
                    first, second = draw(s, 'rngState'), draw(s, 'rngState')
                    selected = (-1 if second < .5 else 1) if first < .1 or q[0] == q[1] else (1 if q[1] > q[0] else -1)
                    assert selected == decision['choice'], 'independent policy choice'
                    s['lastDecisionPhi'] = phi
                    s['history'] = (s['history'] + [decision])[-3:]
                    s['decisions'] += 1
                    decisions += 1
                for tr in after:
                    assert tr['terminal'] and tr['duration'] == 1
                    close(tr['phi'], phi, 'terminal decision features')
                    close(tr['nextPhi'], [] if s['tile'] else np.zeros(40), 'terminal zero bootstrap')
                    update(s, tr)
                    transitions += 1
            elif e['type'] == 'end':
                for original in e['learners']:
                    s = states[arm][original['agentId']]
                    close(original['weights'], s['weights'], 'final weights')
                    close(original['eligibility'], s['eligibility'], 'final eligibility')
                    for key in ['rngState', 'retentionRngState', 'replayRngState', 'olderSeen', 'decisions', 'transitions', 'acquisition']:
                        assert original[key] == s[key], (arm, key)
                    assert original['work']['scalarOperations'] == s['operations']
                    assert original['work']['liveUpdates'] == original['work']['replayUpdates'] == s['transitions']
                    assert original['recentExperiences'] == [v['experience'] for v in s['recent']]
                    assert original['olderExperiences'] == [v['experience'] for v in s['older']]
                    charge = original['charge']
                    assert charge['outstandingEnergy'] >= 0
                    close(charge['incurredEnergy'] - charge['paidEnergy'], charge['outstandingEnergy'], 'paid/debt ledger')
                    bodies += 1
            else:
                raise AssertionError(e['type'])
    return {'factualTransitions': transitions, 'decisions': decisions, 'learnerBodies': bodies}


def effect(row, c):
    if 'main' in c:
        return row['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder'] - row['arms'][c['main']]['endpoint']['budgetAdjustedEnergyPerFounder']
    probes = {v['family'] + ':' + v['version']: v['value'] for v in row['probes']}
    return sum(probes[k] * w for k, w in c['terms'])


def audit(directory):
    p = json.loads((directory / 'protocol.json').read_text(encoding='utf8'))
    results = json.loads((directory / 'results.json').read_text(encoding='utf8'))
    close(p['critical'], student_t.ppf(1 - .05 / 10, 15), 'critical t')
    assert results['protocolSha256'] == sha(directory / 'protocol.json')
    totals = {'factualTransitions': 0, 'decisions': 0, 'learnerBodies': 0}
    rows = []
    all_seeds = []
    for h in p['histories']:
        seed = h['seed']
        all_seeds += [seed] + h['resourceSeeds'] + list(h['probeSeeds'].values())
        path = directory / 'rows' / f'{seed}.json'
        row = json.loads(path.read_text(encoding='utf8'))
        assert row['seed'] == seed and row['resourceSeeds'] == h['resourceSeeds'] and row['probeSeeds'] == h['probeSeeds']
        assert list(row['arms']) == p['arms']
        assert [(v['family'], v['version']) for v in row['probes']] == [(v['family'], v['version']) for v in p['probes']]
        assert row['protocolSha256'] == sha(directory / 'protocol.json')
        trace = directory / 'numerics' / f'{seed}.jsonl'
        assert row['numericsSha256'] == sha(trace)
        supplement_path = directory / 'supplemental/audit.json'
        if supplement_path.exists():
            supplement = json.loads(supplement_path.read_text(encoding='utf8'))
            assert supplement['protocolSha256'] == sha(directory / 'protocol.json')
            corrected = supplement['histories'][str(seed)]
            assert corrected['originalNumericsSha256'] == row['numericsSha256']
            trace = directory / 'supplemental/numerics' / f'{seed}.jsonl'
            assert sha(trace) == corrected['correctedNumericsSha256']
        count = audit_trace(trace, seed)
        for k, v in count.items():
            totals[k] += v
        for arm, v in row['arms'].items():
            ep = v['endpoint']
            assert ep['founders'] == 24
            close(ep['survival'], ep['survivors'] / 24, 'all-founder survival')
            close(ep['budgetAdjustedEnergyPerFounder'], ep['grossEnergyPerFounder'] - ep['outstandingEnergy'] / 24, 'debt endpoint')
            assert abs(ep['accountingResidual']) < 1e-6
        rows.append(row)
        print(json.dumps({'numericHistory': seed, **count}), flush=True)
    assert len(all_seeds) == len(set(all_seeds)) == 128
    assert not set(all_seeds).intersection(p['excludedSeeds'])
    passed = []
    for c, reported in zip(p['contrasts'], results['comparisons'], strict=True):
        assert reported['id'] == c['id']
        xs = [effect(r, c) for r in rows]
        m = sum(xs) / 16
        se = math.sqrt(sum((x - m) ** 2 for x in xs) / 15 / 16)
        lower = m - float(student_t.ppf(.995, 15)) * se
        observed = sum(xs)
        extremes = sum(sum(x if mask & (1 << i) else -x for i, x in enumerate(xs)) >= observed - 1e-12 for mask in range(1 << 16))
        probability = extremes / (1 << 16)
        ok = lower > 0 and probability <= .005
        close(reported['effects'], xs, c['id'])
        close([reported['mean'], reported['standardError'], reported['simultaneousLower'], reported['pOneSided']], [m, se, lower, probability], c['id'])
        assert reported['passed'] == ok
        if not c.get('optional', False):
            passed.append(ok)
    survival = []
    for r in results['survival']:
        xs = [v['arms']['candidate']['endpoint']['survival'] - v['arms'][r['control']]['endpoint']['survival'] for v in rows]
        m = sum(xs) / 16
        se = math.sqrt(sum((x - m) ** 2 for x in xs) / 15 / 16)
        close(r['effects'], xs, 'survival effects')
        close(r['descriptiveCi95'], [m - student_t.ppf(.975, 15) * se, m + student_t.ppf(.975, 15) * se], 'survival interval')
        assert r['passed'] == (m >= 0)
        survival.append(m >= 0)
    assert results['qualified'] == (all(passed) and all(survival))
    return {'schema': 1, 'passed': True, 'protocolSha256': sha(directory / 'protocol.json'), 'resultsSha256': sha(directory / 'results.json'),
            'recaptureAuditSha256': sha(directory / 'supplemental/audit.json') if (directory / 'supplemental/audit.json').exists() else None,
            'histories': len(rows), **totals, 'comparisons': len(p['contrasts']), 'scope': 'Independent factual features, policy RNG/choices, online/replay updates, traces, reservoir, scalar work, debt arithmetic, all-founder endpoints and all statistical gates. Physical replay is separate.'}


if __name__ == '__main__':
    directory, output = Path(sys.argv[1]), Path(sys.argv[2])
    with warnings.catch_warnings(record=True) as captured:
        warnings.simplefilter('always')
        report = audit(directory)
    report['warnings'] = [str(w.message) for w in captured]
    assert not captured, report['warnings']
    with output.open('x', encoding='utf8') as f:
        json.dump(report, f, indent=2)
        f.write('\n')
    print(json.dumps(report))
