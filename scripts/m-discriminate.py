# M-DISCRIMINATE analysis (frozen plan docs/M_DISCRIMINATE_PLAN_V1.md).
# READ-ONLY: python3 stdlib only. No engine imports, no worlds, no seeds,
# no writes anywhere (archive members are stream-read, never extracted).
# Run: python3 scripts/m-discriminate.py
import glob
import json
import os
import statistics

PAIRS = [('A:current', 'A:reset'), ('B:current', 'B:reset'),
         ('transfer:current', 'transfer:reset')]
THOLDS = [0.1, 0.5, 1.0, 5.0]

recs = []  # (bank, config, history, family, current, reset)


def val(probe):
    if isinstance(probe, dict) and 'value' in probe:
        return probe['value']
    if isinstance(probe, (int, float)):
        return probe
    raise ValueError('unknown probe shape: %s' % type(probe))


def add(bank, config, history, probes):
    for cur, res in PAIRS:
        if cur in probes and res in probes:
            fam = cur.split(':')[0]
            recs.append({'bank': bank, 'config': config, 'history': history,
                         'family': fam, 'd': abs(val(probes[cur]) - val(probes[res])),
                         'cur': val(probes[cur]), 'res': val(probes[res])})


# V2: direct + directP pairs
for f in glob.glob('evidence/body-transfer/v2/attempt-01/rows/*.json'):
    r = json.load(open(f))
    h = r.get('history', f)
    if isinstance(h, dict):
        h = h.get('seed', f)
    for key in ('direct', 'directP'):
        if key in r and isinstance(r[key], dict):
            add('v2-qual', key, h, r[key])

# V3-dev: LIVE at evidence/body-transfer/v3-dev (plan V1 assumed archived —
# corrected; no archive touched at all). Standard 12-key rows, config=lambda.
for f in glob.glob('evidence/body-transfer/v3-dev/attempt-01/rows/*.json'):
    r = json.load(open(f))
    if not isinstance(r.get('probes'), dict):
        continue
    h = r['history']['seed'] if isinstance(r.get('history'), dict) else r.get('history', f)
    add('v3-dev', r.get('lambda', r.get('tag', '?')), h, r['probes'])

# Live dev banks: standard rows
for base, bank in [('evidence/motor-anchor-dev/attempt-01', 'm-actor'),
                   ('evidence/mgate-d/attempt-01', 'm-gate'),
                   ('evidence/symmetric-gated-dev/attempt-01', 's-gate')]:
    d = base + '/rows'
    if not os.path.isdir(d):
        continue
    for f in os.listdir(d):
        if not f.endswith('.json'):
            continue
        r = json.load(open(d + '/' + f))
        if not isinstance(r.get('probes'), dict):
            continue
        h = r['history']['seed'] if isinstance(r.get('history'), dict) else r.get('history', f)
        cfg = r.get('tag', r.get('lambda', '?'))
        if bank == 'm-gate' and cfg == 'tau-0.2':
            cfg = 'tau-0'  # bit-identical runs: one config for replication
        add(bank, cfg, h, r['probes'])

ds = [r['d'] for r in recs]
frac = {t: sum(1 for d in ds if d >= t) / len(ds) if ds else 0.0 for t in THOLDS}
by_bank, by_fam = {}, {}
for r in recs:
    by_bank.setdefault(r['bank'], []).append(r['d'])
    by_fam.setdefault(r['family'], []).append(r['d'])

# Q3: replication across distinct configs within shared histories
repl = []
seen = {}
for r in recs:
    if r['bank'] in ('m-gate', 's-gate'):
        key = (r['bank'], r['history'], r['family'])
        seen.setdefault(key, {})[r['config']] = (r['d'] >= 1.0)
for key, m in seen.items():
    if len(m) >= 2:
        vals = list(m.values())
        repl.append({'key': [str(k) for k in key], 'configs': m,
                     'agree': all(v == vals[0] for v in vals)})

top = [r for r in recs if r['d'] >= 1.0]
out = {
    'n_pairs': len(recs),
    'fractions': frac,
    'max_d': max(ds) if ds else 0.0,
    'gate': ('OPEN' if frac[1.0] > 0.10 else 'CLOSED' if frac[1.0] < 0.02 else 'MARGINAL'),
    'per_bank': {b: {'n': len(v), 'frac_ge_1': sum(1 for d in v if d >= 1.0) / len(v)} for b, v in by_bank.items()},
    'per_family': {f: {'n': len(v), 'frac_ge_1': sum(1 for d in v if d >= 1.0) / len(v),
                       'max': max(v)} for f, v in by_fam.items()},
    'q3_n_shared': len(repl),
    'q3_all_agree': all(x['agree'] for x in repl),
    'q3_disagreements': [x for x in repl if not x['agree']],
    'top_contexts': [{'bank': r['bank'], 'config': r['config'], 'history': r['history'],
                      'family': r['family'], 'd': r['d']} for r in sorted(top, key=lambda x: -x['d'])[:20]],
    'v3_rows_read': 'live-dir',
}
print(json.dumps(out, indent=1))
