#!/usr/bin/env python3
"""GRANDMOTHER_CHECK_V1: do old survivors help (grandmother) or just persist (lingering)?

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json endpoint summaries:
  survivors = total flies alive at run end (founders + newborns; founder-specific
              survival NOT logged — same lineage-logging gap as PERSISTER_CHECK)
  births, generations.byGeneration.2 (gen-2 count)

Patterns:
  grandmother-like = high survivors predicts HIGH gen-2 (help)
  lingering-like   = high survivors predicts LOW gen-2 (competition), or nothing
Confound control: births drive both (numbers game, PERSISTER_CHECK) — the
controlled test restricts to births 4..8 and rank-correlates survivors/gen-2.
"""
import json, glob

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2

def spearman(xs, ys):
    n = len(xs)
    if n < 3:
        return None
    rx = [sorted(xs).index(x) + 1 for x in xs]
    ry = [sorted(ys).index(y) + 1 for y in ys]
    mx, my = sum(rx) / n, sum(ry) / n
    den = (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5
    return sum((a - mx) * (b - my) for a, b in zip(rx, ry)) / den if den else 0.0

rows = []
for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
    r = json.load(open(p))
    e = r.get("endpoint") or {}
    if e.get("survivors") is None:
        continue
    by = ((r.get("generations") or {}).get("byGeneration")) or {}
    rows.append({"surv": e["survivors"], "births": r.get("births") or 0,
                 "gen2": int(by.get("2", 0) or 0),
                 "bank": p.replace("\\", "/").split("/")[1],
                 "arm": r.get("arm")})
print(f"rows: {len(rows)}")
ss = sorted(x["surv"] for x in rows)
q1, q3 = ss[len(ss) // 4], ss[3 * len(ss) // 4]
print(f"survivor quartiles: q1={q1} q3={q3}")
for name, grp in [("low-surv", [x for x in rows if x["surv"] <= q1]),
                  ("mid-surv", [x for x in rows if q1 < x["surv"] < q3]),
                  ("high-surv", [x for x in rows if x["surv"] >= q3])]:
    print(f"{name}: n={len(grp)} medGen2={med([x['gen2'] for x in grp])} "
          f"medBirths={med([x['births'] for x in grp])} "
          f"fracGen2ge1={sum(1 for x in grp if x['gen2'] >= 1)}/{len(grp)}")
band = [x for x in rows if 4 <= (x["births"] or 0) <= 8]
print(f"\ncontrolled band births 4..8: n={len(band)} "
      f"spearman(surv,gen2)={spearman([x['surv'] for x in band], [x['gen2'] for x in band])}")
print(f"uncontrolled all rows: spearman(surv,gen2)="
      f"{spearman([x['surv'] for x in rows], [x['gen2'] for x in rows])}, "
      f"spearman(surv,births)={spearman([x['surv'] for x in rows], [x['births'] for x in rows])}")
