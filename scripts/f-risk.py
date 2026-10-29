# F-RISK analysis (frozen plan docs/F_RISK_PLAN_V1.md).
# READ-ONLY: python3 stdlib only. No engine imports, no worlds, no seeds,
# no writes to evidence/. Run: python3 scripts/f-risk.py
import json
import os
import statistics

BASES = [('evidence/mgate-d/attempt-01', 'tau-null'),
         ('evidence/symmetric-gated-dev/attempt-01', 'tau-null')]
ARMS = ['candidate', 'unlearned', 'frozen', 'reset']


def rows(base, tag):
    out = {}
    d = base + '/rows'
    for f in os.listdir(d):
        if f.endswith('-%s.json' % tag):
            r = json.load(open(d + '/' + f))
            out[r['history']['seed']] = r
    return out


recs = []
for base, tag in BASES:
    for seed, r in rows(base, tag).items():
        e = {a: r['arms'][a]['endpoint'] for a in ARMS}
        recs.append({'bank': base.split('/')[1], 'seed': seed,
                     'totals': {a: e[a]['totals'] for a in ARMS},
                     'surv': {a: e[a]['survivors'] for a in ARMS},
                     'foodInv': {a: e[a]['foodInventory'] for a in ARMS}})

q1, q2, q3 = [], [], []
for r in recs:
    t = r['totals']
    # Q1: energy share of deaths per arm
    q1.append({a: (t[a]['deathCauses']['energy'] / t[a]['deaths'] if t[a]['deaths'] else None) for a in ARMS})
    # Q2: harmful share per arm
    hs = {}
    for a in ARMS:
        h, b = t[a]['harmfulEaten'], t[a]['beneficialEaten']
        hs[a] = h / (h + b) if (h + b) else None
    q2.append(hs)
    # Q3: per-death intensities
    inten = {}
    for a in ARMS:
        d = t[a]['deaths']
        inten[a] = {'diss': t[a]['dissipated'] / d if d else None,
                    'food': t[a]['foodEaten'] / d if d else None,
                    'tox': t[a].get('toxinDamage', 0) / d if d else None}
    q3.append(inten)

# Rules
n = len(recs)
age_anomaly = [(r['bank'], r['seed'], a)
               for r, q in zip(recs, q1) for a in ARMS if q[a] is not None and q[a] < 1.0]
u_minus_r_harm = [q['unlearned'] - q['reset'] for q in q2]
choice_licensed = sum(1 for d in u_minus_r_harm if d >= 0.15)
choice_killed = all(abs(q['unlearned'] - q[a]) <= 0.05 for q in q2 for a in ('reset', 'candidate'))
diss_ratio = []
for inten in q3:
    iu, ir = inten['unlearned']['diss'], inten['reset']['diss']
    diss_ratio.append(iu / ir if iu is not None and ir else None)
thrash = sum(1 for x in diss_ratio if x is not None and x >= 1.5)

out = {
    'n_histories': n,
    'q1_energy_share': q1,
    'q1_age_anomaly': age_anomaly,
    'q2_harmful_share': q2,
    'q2_unlearned_minus_reset': u_minus_r_harm,
    'q2_choice_licensed_count': choice_licensed,
    'q2_choice_killed': choice_killed,
    'q3_diss_ratio_u_over_r': diss_ratio,
    'q3_thrash_count': thrash,
    'q4_survivors': [r['surv'] for r in recs],
    'decision': ('LICENSE-CUE-DISCRIMINATION' if choice_licensed >= 6 else
                 'CLOSE-FORAGING' if (choice_killed and not age_anomaly) else
                 'REPORT-MIXED-NO-FOLLOWUP'),
}
print(json.dumps(out, indent=1))
