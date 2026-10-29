# WHAT-RETAINS analysis (frozen plan docs/WHAT_RETAINS_PLAN_V1.md).
# READ-ONLY: python3 stdlib only. No engine imports, no worlds, no seeds,
# no writes to evidence/. Run: python3 scripts/what-retains.py
import json, math, os, statistics

def load(base):
    rows = {}
    d = base + '/rows'
    for f in os.listdir(d):
        if f.endswith('.json'):
            r = json.load(open(d + '/' + f))
            rows[(r['tag'], r['history']['seed'])] = r
    return rows

def anchor(base, tag, seed, which):
    a = json.load(open(f'{base}/anchors/{tag}/{seed}-{which}.json'))
    return a['state']['learners']

MG, SG = 'evidence/mgate-d/attempt-01', 'evidence/symmetric-gated-dev/attempt-01'
mg, sg = load(MG), load(SG)

def aret(r):
    p = r['probes']
    return p['A:current']['value'] - 0.95 * p['A:A']['value'] - 0.05 * p['A:reset']['value']

def bret(r):
    p = r['probes']
    return p['B:current']['value'] - 0.95 * p['B:B']['value'] - 0.05 * p['B:reset']['value']

def level(r):
    e = r['arms']
    return e['candidate']['endpoint']['budgetAdjustedEnergyPerFounder'] - e['unlearned']['endpoint']['budgetAdjustedEnergyPerFounder']

def pearson(xs, ys):
    return statistics.correlation(xs, ys)

def spearman(xs, ys):
    def ranks(v):
        s = sorted(range(len(v)), key=lambda i: v[i])
        r = [0] * len(v)
        for pos, i in enumerate(s):
            r[i] = pos
        return r
    return statistics.correlation(ranks(xs), ranks(ys))

out = {'q1': {}, 'q2': {}, 'q3': {}, 'q4': {}}

# Q1: arm-decomposition per study x gated config
for name, rows, tags in [('mgate', mg, ['tau-null', 'tau-0', 'tau-0.2']), ('sgate', sg, ['tau-null', 'tau-0', 'tau-0.3'])]:
    out['q1'][name] = {}
    for tag in tags:
        rs = [r for (t, _), r in rows.items() if t == tag]
        armvals = {}
        for arm in ['candidate', 'unlearned', 'frozen', 'reset', 'acceptCruise', 'acceptStationary']:
            vs = [r['arms'][arm]['endpoint']['budgetAdjustedEnergyPerFounder'] for r in rs]
            armvals[arm] = {'mean': statistics.mean(vs), 'sd': statistics.pstdev(vs)}
        arets = [aret(r) for r in rs]
        brets = [bret(r) for r in rs]
        lvls = [level(r) for r in rs]
        curA = [r['probes']['A:current']['value'] for r in rs]
        uptoA = [r['probes']['A:A']['value'] for r in rs]
        gaps = [c - a for c, a in zip(curA, uptoA)]
        out['q1'][name][tag] = {'arms': armvals,
            'aret': {'mean': statistics.mean(arets), 'sd': statistics.pstdev(arets)},
            'bret': {'mean': statistics.mean(brets), 'sd': statistics.pstdev(brets)},
            'level': {'mean': statistics.mean(lvls), 'sd': statistics.pstdev(lvls)},
            'Acur_minus_AA': {'mean': statistics.mean(gaps), 'sd': statistics.pstdev(gaps), 'values': gaps}}

# Q2: dose-response on control histories (N=8)
dists, rets = [], []
for base, seed in [(MG, s) for s in [382001, 382010, 382019, 382028]] + [(SG, s) for s in [383001, 383010, 383019, 383028]]:
    tag = 'tau-null'
    C = anchor(base, tag, seed, 'C')
    A = anchor(base, tag, seed, 'A')
    sq, n = 0, 0
    for i, l in C.items():
        if l.get('dead'):
            continue
        wC, wA = l['weights']['taste'], A[i]['weights']['taste']
        for x, y in zip(wC, wA):
            sq += (x - y) ** 2
            n += 1
    dists.append(math.sqrt(sq / n))
    r = load(base)[(tag, seed)]
    rets.append(aret(r))
out['q2'] = {'n': len(dists), 'distances': dists, 'retentions': rets,
             'pearson': pearson(dists, rets), 'spearman': spearman(dists, rets)}

# Q3: alignment-vs-retention scatter (N=24)
xs, ys = [], []
for rows, tags in [(mg, ['tau-null', 'tau-0', 'tau-0.2']), (sg, ['tau-null', 'tau-0', 'tau-0.3'])]:
    for (t, _), r in rows.items():
        if t in tags and r.get('alignment') and r.get('probes'):
            xs.append(r['alignment']['cos'])
            ys.append(aret(r))
out['q3'] = {'n': len(xs), 'pearson': pearson(xs, ys), 'spearman': spearman(xs, ys),
             'xmean': statistics.mean(xs), 'ymean': statistics.mean(ys)}

# Q4: calibration stability across banks
def calib(rows):
    pool = []
    for (t, _), r in rows.items():
        if t == 'tau-null' and r.get('relevance'):
            pool += r['relevance']['recs']
    pool.sort(key=lambda e: e['margin'])
    k = len(pool) // 10
    dec = []
    for d in range(10):
        sl = pool[d * k:(d + 1) * k] if d < 9 else pool[d * k:]
        dec.append({'cut': sl[-1]['margin'], 'rate': sum(e['hit'] for e in sl) / len(sl), 'n': len(sl)})
    return dec
cm, cs = calib(mg), calib(sg)
out['q4'] = {'mgate': cm, 'sgate': cs,
             'max_abs_decile_diff': max(abs(a['rate'] - b['rate']) for a, b in zip(cm, cs))}

print(json.dumps(out, indent=1))
