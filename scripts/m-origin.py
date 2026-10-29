# M-ORIGIN analysis (frozen plan docs/M_ORIGIN_PLAN_V1.md).
# READ-ONLY: python3 stdlib only. No engine imports, no worlds, no seeds,
# no writes to evidence/. Run: python3 scripts/m-origin.py
import json
import os
import statistics

OP_E = 5e-6  # BT_PRICING.operationEnergy, same constant all runs
FOUNDERS = 24

MG = 'evidence/mgate-d/attempt-01'
SG = 'evidence/symmetric-gated-dev/attempt-01'


def rows(base):
    out = {}
    d = base + '/rows'
    for f in os.listdir(d):
        if f.endswith('.json'):
            r = json.load(open(d + '/' + f))
            out[(r['tag'], r['history']['seed'])] = r
    return out


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


histories = []
for base, tag, seeds in [(MG, 'tau-null', [382001, 382010, 382019, 382028]),
                         (SG, 'tau-null', [383001, 383010, 383019, 383028])]:
    rs = rows(base)
    for s in seeds:
        histories.append(rs[(tag, s)])

q1, q2 = [], []
for r in histories:
    e = {a: r['arms'][a]['endpoint'] for a in ('unlearned', 'reset', 'candidate')}
    T = e['reset']['budgetAdjustedEnergyPerFounder'] - e['unlearned']['budgetAdjustedEnergyPerFounder']
    dops = e['unlearned']['scalarOperations'] - e['reset']['scalarOperations']
    billed = dops * OP_E / FOUNDERS
    q1.append({'T': T, 'dops': dops, 'billed': billed,
               'share': billed / T if T != 0 else float('nan')})
    du = {k: e['unlearned'][k] - e['reset'][k] for k in
          ('physicalEnergy', 'outstandingEnergy', 'paidEnergy', 'incurredEnergy', 'survivors')}
    du['foodU'] = e['unlearned']['totals'].get('foodEaten', 0) - e['reset']['totals'].get('foodEaten', 0)
    du['survU'] = e['unlearned']['survivors']
    du['survR'] = e['reset']['survivors']
    du['opsU'] = e['unlearned']['scalarOperations']
    du['opsR'] = e['reset']['scalarOperations']
    q2.append(du)

Ts = [q['T'] for q in q1]
shares = [q['share'] for q in q1]
billed_share_mean = statistics.mean(shares)

death_hist = sum(1 for d in q2 if d['survU'] < d['survR'])
eat_less = sum(1 for d in q2 if d['foodU'] < 0)

opsU = [d['opsU'] for d in q2]
opsR = [d['opsR'] for d in q2]

out = {
    'q1': {'n': len(Ts), 'T_mean': statistics.mean(Ts), 'T_sd': statistics.pstdev(Ts),
           'billed_share_mean': billed_share_mean,
           'billed_share_each': shares, 'T_each': Ts},
    'q2': {'death_histories_unlearned_fewer': death_hist,
           'eat_less_histories': eat_less,
           'surv_each': [[d['survU'], d['survR']] for d in q2],
           'food_gap_each': [d['foodU'] for d in q2],
           'phys_each': [d['physicalEnergy'] for d in q2],
           'outst_each': [d['outstandingEnergy'] for d in q2]},
    'q3': {'tax_vs_opsU_pearson': pearson(Ts, opsU), 'tax_vs_opsU_spearman': spearman(Ts, opsU),
           'tax_vs_opsR_pearson': pearson(Ts, opsR), 'tax_vs_opsR_spearman': spearman(Ts, opsR)},
}
print(json.dumps(out, indent=1))
