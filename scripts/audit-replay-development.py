"""Independent factual arithmetic and inference for bounded replay development."""
import json
import math
from pathlib import Path
import runpy
import sys
import warnings

from scipy.stats import t

helper = runpy.run_path(str(Path(__file__).with_name('audit-sarsa-screen.py')))
close, sha = helper['close'], helper['sha']
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
        assert list(row['programs']) == ['candidate', 'oneStep', 'linear']
        trace = folder / 'numerics' / f"{h['seed']}.jsonl"
        assert sha(trace) == row['numericsSha256']
        for role in ['candidate', 'oneStep', 'linear']:
            source = row['programs'][role]
            assert list(source['arms']) == (p['arms'] if role == 'candidate' else ['candidate'])
            expected_probes = p['probes'] if role == 'candidate' or (role == 'oneStep' and phase == 'development') else []
            assert [(v['family'], v['version']) for v in source['probes']] == [(v['family'], v['version']) for v in expected_probes]
            for probe in source['probes']:
                assert probe['resourceSeed'] == h['probeSeeds'][probe['family']] and probe['founders'] == 24
            count = helper['audit_trace'](trace, h['seed'], role)
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

    expected_survival_controls = ['incumbent', 'fast', 'slow', 'frozen', 'reset', 'lambda0', 'oneStep', 'linear', 'reflex']
    assert [v['control'] for v in result['survival']] == expected_survival_controls
    survival_passes = []
    for reported in result['survival']:
        control = reported['control']
        xs = []
        for row in rows:
            candidate = row['programs']['candidate']['arms']['candidate']['endpoint']
            if control == 'reflex':
                other = row['reflex']['endpoint']
            elif control in ('oneStep', 'linear'):
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
    for row, reported in zip(rows, result['replayActivity'], strict=True):
        diagnostics = [s['replayDiagnostics'] for s in row['programs']['candidate']['arms']['candidate']['learners']]
        updates = sum(d['updates'] for d in diagnostics)
        terms = sum(d['terms'] for d in diagnostics)
        multi = sum(d['multiStepUpdates'] for d in diagnostics)
        fraction, mean_steps = (multi / updates, terms / updates) if updates else (0, 0)
        max_steps = max(d['maxSteps'] for d in diagnostics)
        assert [reported['seed'], reported['updates'], reported['terms'], reported['multiStepUpdates'], reported['fraction'], reported['meanSteps'], reported['maxSteps'], reported['passed']] == [row['seed'], updates, terms, multi, fraction, mean_steps, max_steps, updates > 0 and fraction >= p['minimumMultiStepFraction']]
        assert max_steps <= 16
        activity.append(updates > 0 and fraction >= p['minimumMultiStepFraction'])

    common = all(survival_passes) and all(activity)
    expected_promising = phase == 'development' and all(required) and common
    expected_qualified = phase == 'confirmation' and all(required) and common
    assert result['promising'] == (expected_promising if phase == 'development' else None)
    assert result['qualified'] == expected_qualified
    if phase == 'development':
        for contrast, reported in zip([c for c in p['contrasts'] if not c.get('optional') and not c.get('external')], result['oneStepReferenceComparisons'], strict=True):
            xs = [effect(row, contrast, 'oneStep') for row in rows]
            close(reported['effects'], xs, 'one-step reference contrast')
            close(reported['mean'], sum(xs) / n, 'one-step reference mean')
    return {'schema': 1, 'passed': True, 'phase': phase, 'protocolSha256': sha(directory / 'protocol.json'), 'resultsSha256': sha(folder / 'results.json'),
            'histories': n, **totals, 'comparisons': 13, 'multiStepHistoriesPassed': sum(activity), 'survivalGuardsPassed': sum(survival_passes),
            'scope': 'Independent Expected SARSA features, choices, logged nominal behavior probabilities, bounded contiguous clipped-ratio replay, replay activity, online traces/reservoir/RNG/work, reflex, endpoint/debt and inference. Physical cold replay is separate.'}


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
