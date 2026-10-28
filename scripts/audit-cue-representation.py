"""Exact rational rank of recorded binary activity matrices; no numeric tolerance."""
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sys


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rank(rows):
    a = [[Fraction(v) for v in row] for row in rows]
    r = 0
    for j in range(len(a[0])):
        pivot = next((i for i in range(r, len(a)) if a[i][j]), None)
        if pivot is None:
            continue
        a[r], a[pivot] = a[pivot], a[r]
        divisor = a[r][j]
        a[r] = [v/divisor for v in a[r]]
        for i in range(r+1, len(a)):
            factor = a[i][j]
            if factor:
                a[i] = [v-factor*w for v, w in zip(a[i], a[r])]
        r += 1
        if r == len(a):
            break
    return r


directory = Path(sys.argv[1]).resolve()
p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
data = json.loads((directory/'representations.json').read_text(encoding='utf8'))
assert data['protocolSha256'] == sha(directory/'protocol.json')
for file, expected in p['sourceSha256'].items():
    assert sha(directory/'sources'/file) == expected
results = []
for c in data['contexts']:
    assert len(c['patterns']) == 16
    for i, pattern in enumerate(c['patterns']):
        assert pattern['bits'] == [1 if i >> j & 1 else -1 for j in range(4)]
        assert len(pattern['active']) == len(set(pattern['active'])) == 8
    groups = {}
    for i, pattern in enumerate(c['patterns']):
        groups.setdefault(tuple(pattern['active']), []).append(i)
    assert c['distinctActiveSets'] == len(groups) and c['collisions'] == [g for g in groups.values() if len(g) > 1]
    matrix = [[int(j in pattern['active']) for j in range(64)] for pattern in c['patterns']]
    results.append({**{k: v for k, v in c.items() if k not in ['patterns']}, 'exactRank': rank(matrix)})
assert len(results) == 243
out = {'schema': 1, 'passed': True, 'protocolSha256': sha(directory/'protocol.json'), 'representationsSha256': sha(directory/'representations.json'),
       'contexts': 243, 'featureEvaluations': 3888, 'contextsWithCollisions': sum(bool(c['collisions']) for c in results),
       'contextsBelowFullRank': sum(c['exactRank'] < 16 for c in results), 'minimumRank': min(c['exactRank'] for c in results),
       'contextsDetailed': results, 'scope': 'Exact rational rank and duplicate verification of recorded activity matrices; no worlds, fitted policy, causal explanation or learning qualification.'}
with (directory/'exact-rank-audit.json').open('x', encoding='utf8', newline='\n') as f:
    json.dump(out, f, indent=2)
    f.write('\n')
print(json.dumps({k: v for k, v in out.items() if k != 'contextsDetailed'}))
