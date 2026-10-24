"""Independent factual arithmetic and inference for mushroom policy development."""
import json
import math
from pathlib import Path
import runpy
import sys
import warnings

from scipy.stats import t

helper = runpy.run_path(str(Path(__file__).with_name('audit-sarsa-screen.py')))
close, sha = helper['close'], helper['sha']
mb_helper = runpy.run_path(str(Path(__file__).with_name('audit-mushroom-body.py')))

dev_helper = runpy.run_path(str(Path(__file__).with_name('audit-sarsa-development.py')))


def effect(row, contrast, role='candidate'):
    source = row['programs'][role]
    value = source['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder']
    if contrast.get('external'):
        other = contrast['external']
        target = row['reflex']['endpoint'] if other == 'reflex' else row['programs'][other]['arms']['candidate']['endpoint']
        return value - target['budgetAdjustedEnergyPerFounder']
    if 'main' in contrast:
        return value - row['programs']['candidate']['arms'][contrast['main']]['endpoint']['budgetAdjustedEnergyPerFounder']
    probes = {v['family'] + ':' + v['version']: v['value'] for v in source['probes']}
    return sum(probes[key] * weight for key, weight in contrast['terms'])


def audit(directory, phase):
    p = json.loads((directory / 'protocol.json').read_text(encoding='utf8'))
    folder = directory / phase
    result = json.loads((folder / 'results.json').read_text(encoding='utf8'))
    assert result['protocolSha256'] == sha(directory / 'protocol.json')
    histories = p['developmentHistories' if phase == 'development' else 'confirmationHistories']
    assert len(histories) == (8 if phase == 'development' else 16)
    assert len(p['contrasts']) == 13 and sum(not c.get('optional', False) for c in p['contrasts']) == 12
    all_seeds = [s for h in p['developmentHistories'] + p['confirmationHistories'] for s in [h['seed']] + h['resourceSeeds'] + list(h['probeSeeds'].values())]
    assert len(all_seeds) == len(set(all_seeds)) == 192 and not set(all_seeds).intersection(p['excludedSeeds'])
    for name, expected in p['sourceSha256'].items():
        assert sha(directory / 'sources' / name) == expected, name
    totals = {'factualTransitions': 0, 'decisions': 0, 'learnerBodies': 0, 'reflexDecisions': 0}
    rows = []
    for h in histories:
        row = json.loads((folder / 'rows' / f"{h['seed']}.json").read_text(encoding='utf8'))
        assert row['seed'] == h['seed'] and row['phase'] == phase
        assert row['resourceSeeds'] == h['resourceSeeds'] and row['probeSeeds'] == h['probeSeeds']
        assert row['protocolSha256'] == sha(directory / 'protocol.json')
        assert list(row['programs']) == ['candidate', 'fastOnly', 'linear']
        trace = folder / 'numerics' / f"{h['seed']}.jsonl"
        assert sha(trace) == row['numericsSha256']
        for role in ['candidate', 'fastOnly', 'linear']:
            source = row['programs'][role]
            assert list(source['arms']) == (p['arms'] if role == 'candidate' else ['candidate'])
            expected_probes = p['probes'] if role == 'candidate' or (role == 'fastOnly' and phase == 'development') else []
            assert [(v['family'], v['version']) for v in source['probes']] == [(v['family'], v['version']) for v in expected_probes]
            for probe in source['probes']:
                assert probe['resourceSeed'] == h['probeSeeds'][probe['family']] and probe['founders'] == 24
            count = (helper if role == 'linear' else mb_helper)['audit_trace'](trace, h['seed'], role)
            assert count['learnerBodies'] == 24 * (4 if role == 'candidate' else 1)
            for key, value in count.items():
                totals[key] += value
            for arm in source['arms'].values():
                endpoint = arm['endpoint']
                assert endpoint['founders'] == 24
                close(endpoint['survival'], endpoint['survivors'] / 24, 'all-founder survival')
                close(endpoint['budgetAdjustedEnergyPerFounder'], endpoint['grossEnergyPerFounder'] - endpoint['outstandingEnergy'] / 24, 'debt endpoint')
        totals['reflexDecisions'] += dev_helper['audit_reflex'](trace, h['seed'])
        rows.append(row)
        print(json.dumps({'numericHistory': h['seed'], 'phase': phase}), flush=True)

    n = len(rows)
    critical = float(t.ppf(1 - p['alphaPerTest'], n - 1))
    close(p['critical'][phase], critical, 'simultaneous critical value')
    required = []
    for contrast, reported in zip(p['contrasts'], result['comparisons'], strict=True):
        assert contrast['id'] == reported['id']
        xs = [effect(row, contrast) for row in rows]
        mean = sum(xs) / n
        se = math.sqrt(sum((v - mean) ** 2 for v in xs) / (n - 1) / n)
        lower = mean - critical * se
        observed = sum(xs)
        pvalue = sum(sum(v if mask & (1 << i) else -v for i, v in enumerate(xs)) >= observed - 1e-12 for mask in range(1 << n)) / (1 << n)
        close(reported['effects'], xs, 'contrast effects')
        close([reported['mean'], reported['standardError'], reported['simultaneousLower'], reported['pOneSided']], [mean, se, lower, pvalue], 'contrast inference')
        assert reported['developmentalPositive'] == (mean > 0)
        assert reported['confirmatoryPass'] == (lower > 0 and pvalue <= p['alphaPerTest'])
        if not contrast.get('optional', False):
            required.append(mean > 0 if phase == 'development' else lower > 0 and pvalue <= p['alphaPerTest'])

    expected_survival_controls = ['incumbent', 'fast', 'slow', 'frozen', 'reset', 'lambda0', 'fastOnly', 'linear', 'reflex']
    assert [v['control'] for v in result['survival']] == expected_survival_controls
    survival_passes = []
    for reported in result['survival']:
        control = reported['control']
        xs = []
        for row in rows:
            candidate = row['programs']['candidate']['arms']['candidate']['endpoint']
            if control == 'reflex':
                other = row['reflex']['endpoint']
            elif control in ('fastOnly', 'linear'):
                other = row['programs'][control]['arms']['candidate']['endpoint']
            else:
                other = row['programs']['candidate']['arms'][control]['endpoint']
            xs.append(candidate['survival'] - other['survival'])
        m = sum(xs) / n
        se = math.sqrt(sum((v - m) ** 2 for v in xs) / (n - 1) / n)
        close(reported['effects'], xs, 'survival effects')
        close([reported['mean'], *reported['descriptiveCi95']], [m, m - p['descriptiveCritical'][phase] * se, m + p['descriptiveCritical'][phase] * se], 'survival interval')
        assert reported['passed'] == (m >= 0)
        survival_passes.append(m >= 0)

    activity = []
    for row, reported in zip(rows, result['plasticityActivity'], strict=True):
        ds = [s['plasticityDiagnostics'] for s in row['programs']['candidate']['arms']['candidate']['learners']]
        updates = sum(d['updates'] for d in ds)
        nonzero = sum(d['nonzeroDopamine'] for d in ds)
        transfers = sum(d['transfers'] for d in ds)
        absolute = sum(d['absoluteTransfer'] for d in ds)
        fraction = nonzero / updates if updates else 0
        passed = updates > 0 and fraction >= p['minimumDopamineFraction'] and transfers > 0 and absolute > 0
        assert [reported['seed'], reported['updates'], reported['nonzeroDopamine'], reported['transfers'], reported['passed']] == [row['seed'], updates, nonzero, transfers, passed]
        close([reported['absoluteTransfer'], reported['fraction']], [absolute, fraction], 'plasticity activity')
        activity.append(passed)

    common = all(survival_passes) and all(activity)
    expected_promising = phase == 'development' and all(required) and common
    expected_qualified = phase == 'confirmation' and all(required) and common
    assert result['promising'] == (expected_promising if phase == 'development' else None)
    assert result['qualified'] == expected_qualified
    if phase == 'development':
        for contrast, reported in zip([c for c in p['contrasts'] if not c.get('optional') and not c.get('external')], result['fastOnlyReferenceComparisons'], strict=True):
            xs = [effect(row, contrast, 'fastOnly') for row in rows]
            close(reported['effects'], xs, 'one-step reference contrast')
            close(reported['mean'], sum(xs) / n, 'one-step reference mean')
    return {'schema': 1, 'passed': True, 'phase': phase, 'protocolSha256': sha(directory / 'protocol.json'), 'resultsSha256': sha(folder / 'results.json'),
            'histories': n, **totals, 'comparisons': 13, 'plasticityHistoriesPassed': sum(activity), 'survivalGuardsPassed': sum(survival_passes),
            'scope': 'Independent sparse sensory projection, winner selection, stochastic policy/score gradient, dopamine/baseline/fast decay/slow consolidation, traces/RNG/work; old linear learner, fixed reflex, debt/endpoints and all inference. Physical replay is separate.'}


if __name__ == '__main__':
    directory, phase, output = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    with warnings.catch_warnings(record=True) as captured:
        warnings.simplefilter('always')
        report = audit(directory, phase)
    report['warnings'] = [str(w.message) for w in captured]
    assert not captured, report['warnings']
    with output.open('x', encoding='utf8', newline='\n') as stream:
        json.dump(report, stream, indent=2)
        stream.write('\n')
    print(json.dumps(report))
