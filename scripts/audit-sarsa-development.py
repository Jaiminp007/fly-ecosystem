"""Independent local-tile/linear factual arithmetic and developmental gates."""
import hashlib
import json
import math
from pathlib import Path
import runpy
import sys
import warnings
from scipy.stats import t

helper = runpy.run_path(str(Path(__file__).with_name('audit-sarsa-screen.py')))
close, sha = helper['close'], helper['sha']


def effect(row, c, program='tile'):
    source = row['programs'][program]
    value = source['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder']
    if c.get('external') == 'linear':
        return value - row['programs']['linear']['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder']
    if c.get('external') == 'reflex':
        return value - row['reflex']['endpoint']['budgetAdjustedEnergyPerFounder']
    if 'main' in c:
        return value - row['programs']['tile']['arms'][c['main']]['endpoint']['budgetAdjustedEnergyPerFounder']
    probes = {v['family'] + ':' + v['version']: v['value'] for v in source['probes']}
    return sum(probes[key] * weight for key, weight in c['terms'])


def audit_reflex(path, seed):
    counts = {}
    end = None
    with path.open(encoding='utf8') as stream:
        for line in stream:
            e = json.loads(line)
            if e.get('program') != 'reflex':
                continue
            if e['type'] == 'start':
                assert e['seed'] == seed
            elif e['type'] == 'decision':
                assert e['choice'] == (-1 if e['observation'][13] > 0 else 1)
                counts[e['agentId']] = counts.get(e['agentId'], 0) + 1
            elif e['type'] == 'end':
                end = e['learners']
            else:
                raise AssertionError(e['type'])
    assert end is not None
    for s in end.values():
        assert s['kind'] == 'fixed-feeding-reflex' and not s['acquisition']
        assert s['decisions'] == s['work']['scalarOperations'] == counts[s['agentId']]
        assert s['transitions'] == 0 and not s['weights'] and not s['recent']
        c = s['charge']
        close(c['incurredEnergy'] - c['paidEnergy'], c['outstandingEnergy'], 'reflex charge ledger')
    return sum(counts.values())


def audit(directory, phase):
    p = json.loads((directory / 'protocol.json').read_text(encoding='utf8'))
    folder = directory / phase
    result = json.loads((folder / 'results.json').read_text(encoding='utf8'))
    assert result['protocolSha256'] == sha(directory / 'protocol.json')
    histories = p['developmentHistories' if phase == 'development' else 'confirmationHistories']
    assert len(histories) == (8 if phase == 'development' else 16)
    assert len(p['contrasts']) == 12 and sum(not c.get('optional', False) for c in p['contrasts']) == 11
    all_seeds = [s for h in p['developmentHistories'] + p['confirmationHistories'] for s in [h['seed']] + h['resourceSeeds'] + list(h['probeSeeds'].values())]
    assert len(all_seeds) == len(set(all_seeds)) == 192 and not set(all_seeds).intersection(p['excludedSeeds'])
    for name, expected in p['sourceSha256'].items():
        assert sha(directory / 'sources' / name) == expected
    totals = {'factualTransitions': 0, 'decisions': 0, 'learnerBodies': 0, 'reflexDecisions': 0}
    rows = []
    for h in histories:
        r = json.loads((folder / 'rows' / f"{h['seed']}.json").read_text(encoding='utf8'))
        assert r['seed'] == h['seed'] and r['resourceSeeds'] == h['resourceSeeds'] and r['probeSeeds'] == h['probeSeeds'] and r['phase'] == phase
        assert r['protocolSha256'] == sha(directory / 'protocol.json')
        assert list(r['programs']) == ['tile', 'linear']
        trace = folder / 'numerics' / f"{h['seed']}.jsonl"
        assert sha(trace) == r['numericsSha256']
        for name in ['tile', 'linear']:
            q = r['programs'][name]
            assert list(q['arms']) == (p['arms'] if name == 'tile' else ['candidate'])
            assert [(v['family'], v['version']) for v in q['probes']] == ([] if name == 'linear' and phase == 'confirmation' else [(v['family'], v['version']) for v in p['probes']])
            for v in q['probes']:
                assert v['resourceSeed'] == h['probeSeeds'][v['family']] and v['founders'] == 24
            count = helper['audit_trace'](trace, h['seed'], name)
            for key, value in count.items():
                totals[key] += value
            for a in q['arms'].values():
                ep = a['endpoint']
                assert ep['founders'] == 24
                close(ep['survival'], ep['survivors'] / 24, 'all-founder survival')
                close(ep['budgetAdjustedEnergyPerFounder'], ep['grossEnergyPerFounder'] - ep['outstandingEnergy'] / 24, 'debt endpoint')
        totals['reflexDecisions'] += audit_reflex(trace, h['seed'])
        rows.append(r)
        print(json.dumps({'numericHistory': h['seed'], 'phase': phase}), flush=True)
    n = len(rows)
    critical = float(t.ppf(1 - .05 / 12, n - 1))
    close(p['critical'][phase], critical, 'critical t')
    developmental = []
    confirmatory = []
    for c, reported in zip(p['contrasts'], result['comparisons'], strict=True):
        assert c['id'] == reported['id']
        xs = [effect(row, c) for row in rows]
        m = sum(xs) / n
        se = math.sqrt(sum((v - m) ** 2 for v in xs) / (n - 1) / n)
        lower = m - critical * se
        observed = sum(xs)
        probability = sum(sum(v if mask & (1 << i) else -v for i, v in enumerate(xs)) >= observed - 1e-12 for mask in range(1 << n)) / (1 << n)
        close(reported['effects'], xs, 'linear contrast')
        close([reported['mean'], reported['standardError'], reported['simultaneousLower'], reported['pOneSided']], [m, se, lower, probability], 'inference')
        assert reported['developmentalPositive'] == (m > 0)
        assert reported['confirmatoryPass'] == (lower > 0 and probability <= .05 / 12)
        if not c.get('optional', False):
            developmental.append(m > 0)
            confirmatory.append(lower > 0 and probability <= .05 / 12)
    survival = []
    for reported in result['survival']:
        control = reported['control']
        xs = []
        for r in rows:
            old = r['programs']['linear']['arms']['candidate']['endpoint'] if control == 'linear' else r['reflex']['endpoint'] if control == 'reflex' else r['programs']['tile']['arms'][control]['endpoint']
            xs.append(r['programs']['tile']['arms']['candidate']['endpoint']['survival'] - old['survival'])
        m = sum(xs) / n
        se = math.sqrt(sum((v - m) ** 2 for v in xs) / (n - 1) / n)
        close(reported['effects'], xs, 'survival effects')
        close(reported['mean'], m, 'survival mean')
        close(reported['descriptiveCi95'], [m - t.ppf(.975, n - 1) * se, m + t.ppf(.975, n - 1) * se], 'survival uncertainty')
        assert reported['passed'] == (m >= 0)
        survival.append(m >= 0)
    assert result['qualified'] == (phase == 'confirmation' and all(confirmatory) and all(survival))
    if phase == 'development':
        assert result['promising'] == (all(developmental) and all(survival))
        for c, reported in zip([c for c in p['contrasts'] if not c.get('optional') and not c.get('external')], result['linearReferenceComparisons'], strict=True):
            assert c['id'] == reported['id']
            close(reported['effects'], [effect(r, c, 'linear') for r in rows], 'old-linear descriptive reference')
    return {'schema': 1, 'passed': True, 'phase': phase, 'protocolSha256': sha(directory / 'protocol.json'), 'resultsSha256': sha(folder / 'results.json'),
            'histories': n, **totals, 'comparisons': 12, 'scope': 'Independent hashed sparse features, factual updates/choices/traces/reservoir/replay/scalar work, fixed reflex, endpoints and all development/confirmation inference. Cold physical replay is separate.'}


if __name__ == '__main__':
    directory, phase, output = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    with warnings.catch_warnings(record=True) as captured:
        warnings.simplefilter('always')
        report = audit(directory, phase)
    report['warnings'] = [str(w.message) for w in captured]
    assert not captured, report['warnings']
    with output.open('x', encoding='utf8', newline='\n') as f:
        json.dump(report, f, indent=2)
        f.write('\n')
    print(json.dumps(report))
