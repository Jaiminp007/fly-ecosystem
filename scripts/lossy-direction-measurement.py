"""Lossy-direction measurement V1 (analytic, zero new worlds).

Reads FROZEN V1j rows (evidence/turn-gated-dev/attempt-10/rows/*.json),
splits flipped cues by direction (BH = train-beneficial->test-harmful,
must ACQUIRE avoidance; HB = train-harmful->test-beneficial, must
EXTINGUISH avoidance = unlearning), contact-weighted, per arm
(exact vs lossy), pooled across 3 pairs.

Post-hoc (V1j gates did not pre-register direction-split):
hypothesis-generating ONLY. A V1k line would test it.
Never rescores V1j (verdict untouched).
"""
import json, os

ATT = 'evidence/turn-gated-dev/attempt-10/rows'
PAIRS = [('418001', '418010'), ('418019', '418028'), ('418037', '418046')]

def load(tag):
    with open(os.path.join(ATT, tag + '.json')) as f:
        return json.load(f)

def dir_correctness(train_cues, te_cues, direction):
    """direction 'BH': train beneficial, test harmful; 'HB': reverse.
    Correctness: turn rate when test harmful, cruise rate when beneficial."""
    s = n = 0
    cues = 0
    for cue, te in te_cues.items():
        if cue not in train_cues:
            continue
        tr = train_cues[cue]
        if direction == 'BH' and not (tr['label'] == 'beneficial' and te['label'] == 'harmful'):
            continue
        if direction == 'HB' and not (tr['label'] == 'harmful' and te['label'] == 'beneficial'):
            continue
        c = te['contact'] or 0
        if not c:
            continue
        t = te['turn']
        cues += 1
        n += c
        s += c * (t / c if te['label'] == 'harmful' else 1 - t / c)
    return (s / n if n else None, cues, n)

print('# Lossy-direction measurement V1 (V1j frozen rows, analytic)')
print()
print('| pair | arm | BH corr (cues, contact) | HB corr (cues, contact) |')
print('|------|-----|-------------------------|-------------------------|')
results = {}
for tr_seed, te_seed in PAIRS:
    tr = load(f'{tr_seed}-train')['summary']['cues']
    for arm in ['transferred', 'transferred-lossy']:
        te = load(f'{te_seed}-{arm}')['summary']['cues']
        bh = dir_correctness(tr, te, 'BH')
        hb = dir_correctness(tr, te, 'HB')
        results[(te_seed, arm)] = (bh, hb)
        print(f'| {tr_seed}->{te_seed} | {arm} | {bh[0]:.4f} ({bh[1]}, {bh[2]}) | {hb[0]:.4f} ({hb[1]}, {hb[2]}) |')
print()
# pooled (contact-weighted across pairs)
for arm in ['transferred', 'transferred-lossy']:
    for d in ['BH', 'HB']:
        s = n = cu = 0
        for tr_seed, te_seed in PAIRS:
            tr = load(f'{tr_seed}-train')['summary']['cues']
            te = load(f'{te_seed}-{arm}')['summary']['cues']
            # recompute raw sums
            for cue, t in te.items():
                if cue not in tr:
                    continue
                r = tr[cue]
                if d == 'BH' and not (r['label'] == 'beneficial' and t['label'] == 'harmful'):
                    continue
                if d == 'HB' and not (r['label'] == 'harmful' and t['label'] == 'beneficial'):
                    continue
                c = t['contact'] or 0
                if not c:
                    continue
                cu += 1
                n += c
                s += c * (t['turn'] / c if t['label'] == 'harmful' else 1 - t['turn'] / c)
        print(f'pooled {arm} {d}: {s/n:.4f} (cues={cu}, contact={n})')
