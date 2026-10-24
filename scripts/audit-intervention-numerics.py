"""Independent NumPy/SciPy check of archived fits, policy values and inference."""
import hashlib
import json
import pathlib
import sys
import warnings
import numpy as np
from scipy.linalg import solve
from scipy.stats import t

directory = pathlib.Path(sys.argv[1])
protocol = json.loads((directory / 'protocol.json').read_text())
models = json.loads((directory / 'models.json').read_text())
locked = json.loads((directory / 'locked-selection.json').read_text())
results = json.loads((directory / 'results.json').read_text())
heldout = [json.loads(p.read_text()) for p in sorted((directory / 'heldout').glob('*.json'))]
expected_identities = {(seed, environment) for seed in protocol['heldoutSeeds'] for environment in protocol['reference']['environments']}
assert len(heldout) == len(expected_identities)
assert {(row['seed'], row['environment']) for row in heldout} == expected_identities
for row in heldout:
    assert [(c['seed'], c['environment'], c['tick'], c['agentId']) for c in row['cases']] == [(row['seed'], row['environment'], tick, agent) for tick in protocol['checkpointTicks'] for agent in protocol['agents']]
channels = [0, 1, 2, 3, 4, 10, 11, 12, 13]
max_coefficient_error = 0.0
max_inverse_error = 0.0
max_dr_target_error = 0.0
warning_messages = []
def capture_warning(message, category, filename, lineno, file=None, line=None):
    warning_messages.append({'category': category.__name__, 'message': str(message), 'filename': filename, 'line': lineno})
warnings.showwarning = capture_warning
warnings.simplefilter('always')
for name, model in models.items():
    assert model['labels'] <= protocol['capacity']
    for state in [model['estimator']] + ([model['nuisance']] if model['nuisance'] else []):
        if not state['records']:
            continue
        x = np.array([r['input'] for r in state['records']])
        targets = np.array([r['target'] for r in state['records']])
        weights = np.array([r['weight'] for r in state['records']])
        gram = np.exp(-np.abs(x[:, None, :] - x[None, :, :]).sum(axis=2))
        gram += np.diag(state['regularization'] / weights)
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter('always')
            beta = solve(gram, targets, assume_a='pos')
        warning_messages.extend(str(w.message) for w in caught)
        max_coefficient_error = max(max_coefficient_error, float(np.max(np.abs(beta - state['coefficients']))))
        assert np.isfinite(gram).all() and np.isfinite(beta).all()
        inverse_product = np.einsum('ij,jk->ik', np.array(state['inverse']), gram, optimize=False)
        assert np.isfinite(inverse_product).all()
        max_inverse_error = max(max_inverse_error, float(np.max(np.abs(inverse_product - np.eye(len(targets))))))
        assert np.allclose(beta, state['coefficients'], atol=1e-8, rtol=1e-8), name
        assert max_inverse_error < 1e-7

def inputs(case, representation):
    x = [1] + [case['observation'][i] for i in channels]
    if representation == 'history':
        for previous in case['history']:
            x += [previous['observation'][i] / 3 for i in channels] + [previous['choice'] / 3]
    return np.array(x)

def predict(state, x):
    if not state['records']:
        return 0.0
    training = np.array([r['input'] for r in state['records']])
    return float(np.clip(np.sum(np.exp(-np.abs(training - x).sum(axis=1)) * np.array(state['coefficients'])), -1, 1))

def action_input(x, action):
    return np.concatenate([x, [action], x[1:] * action])

def effect(model, case):
    x = inputs(case, model['representation'])
    if model['mode'].endswith('contrast'):
        return predict(model['estimator'], x) * model['scale']
    return predict(model['estimator'], action_input(x, 1)) - predict(model['estimator'], action_input(x, -1))

# Independently reconstruct delayed nuisance information and DR pseudo-targets
# from the factual labels, not just from already stored pseudo-targets.
development = [json.loads(p.read_text()) for p in (directory / 'development').glob('*.json')]
case_index = {(c['seed'], c['environment'], c['tick'], c['agentId']): c for row in development for c in row['cases']}
training_order = {seed: i for i, seed in enumerate(protocol['trainingSeeds'])}
for name, model in models.items():
    if not model['nuisance']:
        continue
    all_records = model['nuisance']['records']
    for record in model['estimator']['records']:
        e = record['evidence']
        available = [r for r in all_records if training_order[r['evidence']['seed']] < training_order[e['seed']] or (r['evidence']['seed'] == e['seed'] and r['evidence']['completionTick'] <= e['tick'])]
        assert len(available) == e['nuisanceBeforeLabels'], name
        case = case_index[(e['seed'], e['environment'], e['tick'], e['agentId'])]
        x = inputs(case, model['representation'])
        slow = fast = 0.0
        if available:
            training = np.array([r['input'] for r in available])
            target = np.array([r['target'] for r in available])
            gram = np.exp(-np.abs(training[:, None, :] - training[None, :, :]).sum(axis=2)) + np.eye(len(available)) * model['nuisance']['regularization']
            beta = solve(gram, target, assume_a='pos')
            slow = float(np.clip(np.sum(np.exp(-np.abs(training - action_input(x, -1)).sum(axis=1)) * beta), -1, 1))
            fast = float(np.clip(np.sum(np.exp(-np.abs(training - action_input(x, 1)).sum(axis=1)) * beta), -1, 1))
        choice = e['choice']
        observed = case['arms']['fast' if choice > 0 else 'slow'][str(e['horizon'])]['energyChange'] / 120
        probability = case['policy']['chosenProbability']
        contrast = fast - slow + choice * (observed - (fast if choice > 0 else slow)) / probability
        error = abs(contrast / model['scale'] - record['target'])
        max_dr_target_error = max(max_dr_target_error, error)
        assert error < 1e-8, name

def value(case, difference, horizon):
    if case['alreadyDead']:
        return 0.0
    a = case['arms']['slow'][str(horizon)]['energyChange']
    b = case['arms']['fast'][str(horizon)]['energyChange']
    return b if difference > 0 else a if difference < 0 else (a + b) / 2

def score(model, rows, horizon):
    return np.array([np.mean([0 if c['alreadyDead'] else value(c, effect(model, c), horizon) for c in r['cases']]) for r in rows])

alpha = protocol['alphaPerTest']
critical = float(t.ppf(1 - alpha, len(protocol['heldoutSeeds']) - 1))
assert abs(critical - protocol['critical']['simultaneous']) < 1e-12
signs = 2 * ((np.arange(2 ** 16, dtype=np.uint32)[:, None] >> np.arange(16, dtype=np.uint32)) & 1).astype(float) - 1
checked_tests = {}
for environment in protocol['reference']['environments']:
    rows = sorted([r for r in heldout if r['environment'] == environment], key=lambda r: protocol['heldoutSeeds'].index(r['seed']))
    h = protocol['primaryHorizon']
    selected = locked['selected']
    key = f"{environment}:{h}:{selected['representation']}"
    chosen = score(models[f"{key}:{selected['mode']}"], rows, h)
    uniform = score(models[f'{key}:uniform'], rows, h)
    observational = score(models[f'{key}:observational'], rows, h)
    effects = {}
    for control in ['incumbent', 'slow', 'fast']:
        controls = np.array([np.mean([value(c, c.get('incumbentDifference', 0) if control == 'incumbent' else -1 if control == 'slow' else 1, h) for c in r['cases']]) for r in rows])
        effects[f'{environment}:action:{control}'] = chosen - controls
    effects[f'{environment}:mechanism:uniform-over-observational'] = uniform - observational
    effects[f'{environment}:mechanism:selected-over-observational'] = chosen - observational
    effects[f'{environment}:mechanism:selected-vs-uniform'] = chosen - uniform
    for name, values in effects.items():
        expected = results['tests'][name]
        average = float(values.mean())
        se = float(values.std(ddof=1) / np.sqrt(len(values)))
        lower = average - critical * se
        shifted = values + expected['margin']
        assert np.isfinite(shifted).all()
        signed_sums = np.sum(signs * shifted[None, :], axis=1)
        assert np.isfinite(signed_sums).all()
        p = float(np.mean(signed_sums >= shifted.sum() - 1e-12))
        passed = lower > -expected['margin'] and p <= alpha
        assert abs(average - expected['mean']) < 1e-10, name
        assert abs(se - expected['se']) < 1e-10, name
        assert abs(lower - expected['lower']) < 1e-9, name
        assert p == expected['pOneSided'] and passed == expected['passed'], name
        checked_tests[name] = {'mean': average, 'lower': lower, 'pOneSided': p, 'passed': passed}
action = all(v['passed'] for k, v in checked_tests.items() if ':action:' in k)
mechanism = all(v['passed'] for k, v in checked_tests.items() if ':mechanism:' in k)
assert action == results['actionPassed'] and mechanism == results['mechanismPassed']
assert results['advanceWeighting'] == (action and mechanism and locked['selected']['mode'] in ['ipw', 'ipw-contrast', 'dr-contrast'])
for row in heldout:
    for case in row['cases']:
        raw = f"{protocol['assignmentSeed']}:{row['seed']}:{row['environment']}:{case['tick']}:{case['agentId']}"
        choice = -1 if int(hashlib.sha256(raw.encode()).hexdigest()[:8], 16) < 2 ** 31 else 1
        assert choice == case['uniformChoice']
report = {'modelsChecked': len(models), 'comparisonsChecked': len(checked_tests), 'maxCoefficientDifference': max_coefficient_error,
          'maximumInverseResidual': max_inverse_error, 'maximumDelayedDRTargetDifference': max_dr_target_error, 'warningMessages': warning_messages, 'warningFree': not warning_messages, 'allNumericalAndStatisticalChecksPassed': True,
          'scope': 'Independent batch linear algebra and held-out policy/statistical arithmetic. Physical reproducibility is checked separately in audit.json.'}
output_path = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else directory / 'numeric-audit.json'
with output_path.open('x') as output:
    json.dump(report, output, indent=2)
    output.write('\n')
print(json.dumps(report, indent=2))
