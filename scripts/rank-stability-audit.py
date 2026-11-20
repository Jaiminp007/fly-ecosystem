#!/usr/bin/env python3
"""RANK_STABILITY_AUDIT_V1: do correctness gaps track energetics (linear or log)?

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/turn-gated-dev/attempt-*/dev-results.json
per-seed transGaps + rows endpoints (transferred vs unlearned,
matched histories).
Two findings: (1) analytic — rank-stability under monotone
rescaling is AUTOMATIC (log is monotone; ranks can't change),
so the queued R220 question dissolves as posed; (2) empirical —
the real question (do gaps track energetics at all?) answered
by correlation across test seeds. Either way: NO gate change
(pre-registered in R220).
"""
import json, glob, math
from collections import defaultdict

def main():
    pts = []  # (bank, seed, gap, E_trans, E_unlearn)
    for att in sorted(glob.glob("evidence/turn-gated-dev/attempt-*/dev-results.json")):
        bank = att.replace("\\", "/").split("/")[-2]
        d = json.load(open(att))
        gaps = {g["seed"]: g["gap"] for g in (d.get("transGaps") or []) if isinstance(g, dict)}
        if not gaps:
            continue
        en = defaultdict(dict)
        for p in sorted(glob.glob(f"evidence/turn-gated-dev/{bank}/rows/*.json")):
            r = json.load(open(p))
            s = (r.get("history") or {}).get("seed")
            if s in gaps:
                en[s][r.get("tag")] = ((r.get("endpoint") or {})
                                       .get("budgetAdjustedEnergyPerFounder"))
        for s, g in gaps.items():
            et, eu = en.get(s, {}).get("transferred"), en.get(s, {}).get("unlearned")
            if et is None or eu is None:
                continue
            if not (math.isfinite(et) and math.isfinite(eu)):
                continue
            pts.append((bank, s, g, et, eu))
    print(f"n test-seeds with matched energies: {len(pts)}")
    if len(pts) < 5:
        print("INSUFFICIENT — audit void");
        return
    for b, s, g, et, eu in pts:
        print(f"{b} s={s} gap={g:.3f} E_trans={et:.1f} E_unlearn={eu:.1f} "
              f"dE={et-eu:+.1f}")
    xs = [g for _, _, g, _, _ in pts]
    ys = [et - eu for _, _, _, et, eu in pts]
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    den = (sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys)) ** 0.5
    r = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / den if den else 0
    print(f"corr(gap, energy-improvement) = {r:+.3f} (n={n})")
    # linear vs log fit (log of spent-ratio; both energies negative => ratio>0)
    # spent proxy: use |E| (energy deficit magnitude) — descriptive only
    lr = []
    for _, _, g, et, eu in pts:
        if abs(et) > 0 and abs(eu) > 0:
            lr.append((g, math.log10(abs(et) / abs(eu))))
    if len(lr) >= 5:
        x2 = [g for g, _ in lr]
        y2 = [l for _, l in lr]
        mx2, my2 = sum(x2) / len(x2), sum(y2) / len(y2)
        den2 = (sum((x - mx2) ** 2 for x in x2) * sum((y - my2) ** 2 for y in y2)) ** 0.5
        r2 = sum((x - mx2) * (y - my2) for x, y in zip(x2, y2)) / den2 if den2 else 0
        print(f"corr(gap, log|E_trans/E_unlearn|) = {r2:+.3f} (n={len(lr)})")

if __name__ == "__main__":
    main()
