"""Post-hoc model-capacity/chronology diagnostic; never a qualification run."""
import hashlib
import json
import sys
import uuid
import warnings
from collections import Counter
from pathlib import Path
from datetime import datetime, timezone

import numpy as np
from sklearn.kernel_ridge import KernelRidge
from sklearn.linear_model import Ridge
from sklearn.preprocessing import PolynomialFeatures
from sklearn.kernel_approximation import RBFSampler
from threadpoolctl import threadpool_limits

threadpool_limits(1)
numeric_warnings = Counter()
def record_warning(message, category, filename, lineno, file=None, line=None):
    numeric_warnings[(str(message), category.__name__)] += 1
warnings.showwarning = record_warning
warnings.simplefilter('always', RuntimeWarning)
reference = Path(sys.argv[1] if len(sys.argv) > 1 else 'evidence/self-modification/a5f74db8-2b02-4ae5-a8dd-17c8c416c2d3').resolve()
directory = Path(sys.argv[2] if len(sys.argv) > 2 else f'evidence/forecast-capacity/{uuid.uuid4()}').resolve()
directory.mkdir(parents=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
load = lambda path: json.loads(path.read_text())
source = Path(__file__).read_bytes()
result_bytes = (reference / 'results.json').read_bytes()
previous = json.loads(result_bytes)
worlds = load(reference / 'development.json')
for name, digest in previous['bankHashes'].items():
    data = (reference / 'banks' / f'{name}.json').read_bytes()
    assert sha(data) == digest
    worlds.extend(json.loads(data))
protocol = {
    'at': datetime.now(timezone.utc).isoformat(), 'experiment': 'post-hoc-forecast-capacity-and-chronology',
    'reference': str(reference), 'referenceSha256': sha(result_bytes), 'sourceSha256': sha(source),
    'splitTick': previous['protocol']['splitTick'], 'observedAgents': previous['protocol']['observedAgents'],
    'models': ['zero', 'training-mean', 'online-initial', 'ridge-linear-1', 'ridge-quadratic-1', 'rbf-ridge-0.1', 'rff-ridge-1'],
    'interpretation': 'Exploratory use of ALL prior study banks. No new held-out qualification, algorithm adoption or RSI claim. Fits use only each founder\'s completed A/B training windows. A tests are read-only. Richer models have different storage/compute costs. Continuing online B additionally learns the preceding B test labels after forecasting, unlike the frozen-window endpoint; these protocols are deliberately distinct. No hyperparameter selection or seed extension.'}
(directory / 'protocol.json').write_text(json.dumps(protocol, indent=2) + '\n')
(directory / 'source.py').write_bytes(source)
channels = [0, 1, 2, 3, 4, 10, 11, 12, 13]
discount = np.power(.99, np.arange(8))

def examples(world, agent, training):
    windows = [w for w in world['windows'] if w['agentId'] == agent and (w['tick'] + 7 < protocol['splitTick'] if training else w['tick'] >= protocol['splitTick'])]
    x, y = [], []
    for window in windows:
        assert len(window['rewards']) == 8 and len(window['observation']) == 17
        sensed = np.array(window['observation'])[channels]
        choice = window['choice']
        x.append(np.concatenate(([1], sensed, [choice], sensed * choice)))
        y.append(np.dot(window['rewards'], discount) / discount.sum())
    return np.array(x), np.array(y)

def online(x, y, initial=None):
    w = np.zeros(x.shape[1]) if initial is None else initial.copy()
    errors = []
    for inputs, target in zip(x, y):
        predicted = np.clip(np.dot(w, inputs), -1, 1)
        errors.append(float((target - predicted) ** 2))
        delta = .2 * (target - predicted) * inputs / max(1, np.dot(inputs, inputs))
        w = np.clip(w + np.clip(delta, -.5, .5), -4, 4)
    return w, errors

def mse(predictions, targets):
    return float(np.mean((np.clip(predictions, -1, 1) - targets) ** 2))

rows = []
for seed in sorted(set(w['seed'] for w in worlds)):
    a = next(w for w in worlds if w['seed'] == seed and w['environment'] == 'fixed')
    b = next(w for w in worlds if w['seed'] == seed and w['environment'] == 'relocation')
    for agent in protocol['observedAgents']:
        xa, ya = examples(a, agent, True); xat, yat = examples(a, agent, False)
        xb, yb = examples(b, agent, True); xbt, ybt = examples(b, agent, False)
        xab, yab = np.concatenate([xa, xb]), np.concatenate([ya, yb])
        after_a, _ = online(xa, ya); after_b, _ = online(xb, yb, after_a)
        continued, chronological_errors = online(xbt, ybt, after_b)
        metrics = {
            'zero': {'a': mse(np.zeros(len(yat)), yat), 'b': mse(np.zeros(len(ybt)), ybt)},
            'training-mean': {'a': mse(np.full(len(yat), yab.mean()), yat), 'b': mse(np.full(len(ybt), yab.mean()), ybt)},
            'online-initial': {'a': mse(xat @ after_b, yat), 'b': mse(xbt @ after_b, ybt)},
        }
        for name, model, transform in [
            ('ridge-linear-1', Ridge(alpha=1, fit_intercept=False), None),
            ('ridge-quadratic-1', Ridge(alpha=1, fit_intercept=False), PolynomialFeatures(2, include_bias=False)),
            ('rbf-ridge-0.1', KernelRidge(alpha=.1, kernel='rbf', gamma=1), None),
            ('rff-ridge-1', Ridge(alpha=1, fit_intercept=False), RBFSampler(gamma=1, n_components=64, random_state=(seed ^ agent) & 0xffffffff)),
        ]:
            transformed = transform.fit_transform(xab) if transform else xab
            model.fit(transformed, yab)
            a_query = transform.transform(xat) if transform else xat
            b_query = transform.transform(xbt) if transform else xbt
            metrics[name] = {'a': mse(model.predict(a_query), yat), 'b': mse(model.predict(b_query), ybt), 'fit': mse(model.predict(transformed), yab)}
        # Diagnostic only: allowing the ongoing learner to acquire each label
        # after forecasting it is different from an all-future frozen probe.
        chronological = {'bPrequential': float(np.mean(chronological_errors)), 'aAfterAllB': mse(xat @ continued, yat), 'aBeforeB': mse(xat @ after_a, yat)}
        target_shift = {'aEarlyMean': float(ya.mean()), 'aLateMean': float(yat.mean()), 'bEarlyMean': float(yb.mean()), 'bLateMean': float(ybt.mean()), 'aEarlyVariance': float(ya.var()), 'aLateVariance': float(yat.var()), 'bEarlyVariance': float(yb.var()), 'bLateVariance': float(ybt.var())}
        assert all(np.isfinite(value) for values in metrics.values() for value in values.values())
        assert all(np.isfinite(value) for value in chronological.values())
        rows.append({'seed': seed, 'agentId': agent, 'metrics': metrics, 'chronological': chronological, 'targetShift': target_shift})

seed_rows = []
for seed in sorted(set(r['seed'] for r in rows)):
    selected = [r for r in rows if r['seed'] == seed]
    seed_rows.append({'seed': seed, 'metrics': {name: {env: float(np.mean([r['metrics'][name][env] for r in selected])) for env in ['a', 'b']} for name in protocol['models']}, 'chronological': {key: float(np.mean([r['chronological'][key] for r in selected])) for key in selected[0]['chronological']}, 'targetShift': {key: float(np.mean([r['targetShift'][key] for r in selected])) for key in selected[0]['targetShift']}})
summary = {name: {env: float(np.mean([r['metrics'][name][env] for r in seed_rows])) for env in ['a', 'b']} for name in protocol['models']}
summary['chronological'] = {key: float(np.mean([r['chronological'][key] for r in seed_rows])) for key in seed_rows[0]['chronological']}
summary['targetShift'] = {key: float(np.mean([r['targetShift'][key] for r in seed_rows])) for key in seed_rows[0]['targetShift']}
baseline = next(value for name, value in summary.items() if name == 'online-initial')
contrasts = {name: {env: float(np.mean([r['metrics']['online-initial'][env] - r['metrics'][name][env] for r in seed_rows])) for env in ['a', 'b']} for name in protocol['models'] if name != 'online-initial'}
result = {'protocol': protocol, 'worlds': len(worlds), 'independentSeeds': len(seed_rows), 'rows': rows, 'seedRows': seed_rows, 'summary': summary, 'baselineMinusAlternative': contrasts, 'numericWarnings': [{'message': key[0], 'category': key[1], 'count': count} for key, count in numeric_warnings.items()], 'qualification': False}
(directory / 'results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'directory': str(directory), 'worlds': result['worlds'], 'independentSeeds': result['independentSeeds'], 'summary': summary, 'baselineMinusAlternative': contrasts}, indent=2))
