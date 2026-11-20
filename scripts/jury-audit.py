#!/usr/bin/env python3
"""JURY_AUDIT_V1: Condorcet jury audit of mating-arc verdicts with bank-dependence accounting.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json (generations.byGeneration).

Jury framing (R113): each history is a juror voting CONVERT (gen2>=1) or NOT.
Condorcet's theorem needs independent jurors with p>0.5. Shared banks violate
independence two ways: (a) floor unanimity (all jurors vote NOT because nothing
can happen — one floor observed 6 times, not 6 votes); (b) instrument-forced
agreement. Audit per (bank, arm): vote tally, observed vs chance agreement,
Cohen-style kappa, and effective jury N_eff = N/(1+(N-1)*k) as descriptive
dependence discount (kappa as ICC proxy — approximate, flagged).
Verdict mapping: restate each published mating-arc majority as a jury vote and
classify INFORMATIVE (jurors vary, majority emerges) / FLOOR (unanimous zeros —
not evidence for null, absence of trial) / SPLIT (genuine disagreement).
"""
import json, glob
from collections import defaultdict

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2

rows = []
for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
    r = json.load(open(p))
    by = ((r.get("generations") or {}).get("byGeneration")) or {}
    g2 = int(by.get("2", 0) or 0)
    rows.append({"bank": p.replace("\\", "/").split("/")[1],
                 "attempt": p.replace("\\", "/").split("/")[2],
                 "arm": r.get("arm"), "seed": (r.get("history") or {}).get("seed"),
                 "gen2": g2, "vote": 1 if g2 >= 1 else 0})

groups = defaultdict(list)
for x in rows:
    groups[(x["bank"], x["attempt"], x["arm"])].append(x)

print(f"rows: {len(rows)}, groups: {len(groups)}")
print("\nbank/attempt/arm | n | votesCONVERT | Po | Pe | kappa | N_eff | class")
tot = defaultdict(int)
for (bank, att, arm) in sorted(groups):
    g = groups[(bank, att, arm)]
    n = len(g)
    v = sum(x["vote"] for x in g)
    p1 = v / n
    Po = (v / n) ** 2 + ((n - v) / n) ** 2 if n else 0  # pairwise agreement prob
    # chance agreement under independence with same marginal: same formula on pooled base rate
    Pe = Po  # single-group: kappa vs 0.5-coin instead
    Pe_coin = 0.5
    kappa = (Po - Pe_coin) / (1 - Pe_coin) if Pe_coin < 1 else 0.0
    neff = n / (1 + (n - 1) * max(0.0, kappa))
    if v == 0:
        cls = "FLOOR"
    elif v == n:
        cls = "CEILING"
    elif n % 2 == 0 and v == n // 2:
        cls = "TIE-max-variance"
    elif v > n / 2:
        cls = "INFORMATIVE-majority"
    else:
        cls = "SPLIT-minority"
    tot[cls] += 1
    print(f"{bank}/{att}/{arm} | {n} | {v} | {Po:.3f} | {Pe_coin} | {kappa:+.3f} | {neff:.2f} | {cls}")
print("\ngroup classes:", dict(tot))
kappas = []
for (bank, att, arm) in groups:
    g = groups[(bank, att, arm)]
    n = len(g)
    v = sum(x["vote"] for x in g)
    Po = (v / n) ** 2 + ((n - v) / n) ** 2
    kappas.append((Po - 0.5) / 0.5)
print(f"median kappa: {med(kappas)} (positive = jurors agree beyond coin; negative = jurors vary)")
