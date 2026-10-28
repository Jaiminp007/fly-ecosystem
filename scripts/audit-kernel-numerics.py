"""Independent batch/chronological oracle for captured JS kernel learners."""
import hashlib
import json
import math
import sys
import warnings
from collections import Counter
from pathlib import Path
import numpy as np
from scipy.linalg import solve
from threadpoolctl import threadpool_limits

threadpool_limits(1)
path = Path(sys.argv[1] if len(sys.argv) > 1 else 'evidence/forecast-capacity/kernel-prototype/oracle-input.json').resolve()
data = json.loads(path.read_text())
warnings_seen = Counter()
def warning(message, category, filename, lineno, file=None, line=None):
    warnings_seen[(str(message), category.__name__)] += 1
warnings.showwarning = warning
warnings.simplefilter('always', RuntimeWarning)

def kernel(program, x, y):
    name = program['kernel']
    dot = sum(a * b for a, b in zip(x, y))
    if name == 'linear':
        return dot
    if name == 'laplacian':
        return math.exp(-sum(abs(a - b) for a, b in zip(x, y)))
    if name == 'quadratic':
        return ((1 + dot / len(x)) / 2) ** 2
    rbf = math.exp(-sum((a - b) ** 2 for a, b in zip(x, y)))
    if name == 'rbf':
        return rbf
    if name == 'sum':
        return (rbf + dot / len(x)) / 2
    if name == 'product':
        return rbf * (1 + dot / len(x)) / 2
    raise ValueError('Unknown audited kernel')

checks = []
evaluations = data['rows'] if 'rows' in data else [data['candidate'], data['incumbent']]
for evaluation in evaluations:
    for row in evaluation['rows']:
        for agent in row['perAgent']:
            for key in ['oldState', 'finalState']:
                if key not in agent:
                    continue
                state = agent[key]
                records = state['records']; program = state['program']
                assert state['seen'] <= state['capacity'], 'This oracle requires complete retained history, not post-eviction SGD'
                if program['update'] == 'ridge':
                    gram = np.array([[kernel(program, a['input'], b['input']) for b in records] for a in records])
                    system = gram + state['regularization'] * np.eye(len(records))
                    inverse = solve(system, np.eye(len(records)), assume_a='pos')
                    coefficients = np.einsum('ij,j->i', inverse, np.array([r['target'] for r in records]), optimize=False)
                    inverse_error = float(np.max(np.abs(inverse - np.array(state['inverse']))))
                    residual = float(np.max(np.abs(np.einsum('ij,jk->ik', np.array(state['inverse']), system, optimize=False) - np.eye(len(records)))))
                    assert inverse_error < 1e-7 and residual < 1e-7
                else:
                    coefficients = []
                    for i, record in enumerate(records):
                        prediction = max(-1, min(1, sum(coefficients[j] * kernel(program, records[j]['input'], record['input']) for j in range(i))))
                        coefficients.append(state['stepSize'] * (record['target'] - prediction) / max(1, kernel(program, record['input'], record['input'])))
                    coefficients = np.array(coefficients)
                    inverse_error = None; residual = None
                error = float(np.max(np.abs(coefficients - np.array(state['coefficients']))))
                assert np.all(np.isfinite(coefficients)) and error < 1e-7
                checks.append({'seed': row['seed'], 'agentId': agent['agentId'], 'state': key, 'program': program, 'records': len(records), 'maxCoefficientDifference': error, 'maxInverseDifference': inverse_error, 'maxInverseResidual': residual})
result = {'inputSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'auditorSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'checks': checks, 'numericWarnings': [{'message': k[0], 'category': k[1], 'count': v} for k, v in warnings_seen.items()], 'scope': 'Independent SciPy batch solve for ridge and direct chronological Python arithmetic for SGD. Only captured complete-history states, not every world or causal policy effect.'}
target = path.with_name(path.stem + '-numeric-audit.json')
target.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'audit': str(target), 'statesChecked': len(checks), 'maxCoefficientDifference': max(r['maxCoefficientDifference'] for r in checks), 'numericWarnings': result['numericWarnings']}))
