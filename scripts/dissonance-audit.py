#!/usr/bin/env python3
"""DISSONANCE_AUDIT_V1: does verdict confidence track cost beyond evidence?

Analytic-only. Zero new worlds. Data: 33 published verdict docs (mains from
ledger lines; hedge-hits via fixed lexicon grep — proxy, transparent, in doc).
Dissonance (effort-justification) predicts: expensive verdicts carry FEWER
hedges than their evidence warrants (confidence ~ cost, not strength).
Honest-reporting predicts: hedges track evidence thinness (margins, floors,
single-seed concentrations, voids), not cost.
"""
import math

# (verdict, mains, hedge_hits, class)
V = [
    ("MATE-ACT NOGO", 8, 7, "NOGO"), ("MATE-DENSE NOGO", 8, 3, "NOGO"),
    ("MATE-ENERGY GO", 8, 2, "GO"), ("MATE-INHERIT V1 NOGO", 12, 7, "NOGO"),
    ("BALDWIN CLOSED", 12, 15, "VOID"), ("MATE-FOOD GO", 12, 2, "GO"),
    ("MATE-INHERIT V1b GO-V1B", 12, 7, "GO"), ("MATE-INHERIT V1c NOGO", 12, 7, "NOGO"),
    ("MATE-SOCIAL V1 NOGO", 12, 7, "NOGO"), ("MATE-SOCIAL V2 NOGO", 18, 8, "NOGO"),
    ("MATE-ENCOUNTER GO", 12, 9, "GO"), ("MATE-ENCOUNTER V1b INVALID", 12, 8, "VOID"),
    ("MATE-ENCOUNTER V1c NOGO", 18, 15, "NOGO"), ("MATE-ATTRACT V4 NOGO", 18, 4, "NOGO"),
    ("MATE-LEAVE V1 GO", 18, 10, "GO"), ("MATE-LEAVE V2 NOGO", 30, 14, "NOGO"),
    ("MATE-RECOMBINE NOGO", 18, 9, "NOGO"), ("MATE-DISPERSE NOGO", 18, 5, "NOGO"),
    ("MATE-PROXIMITY V1C GO", 18, 3, "GO"), ("MATE-INFORMED NOGO", 12, 4, "NOGO"),
    ("TURN-GATE V1 GO", 12, 4, "GO"), ("TURN-GATE V1F weak-GO", 15, 13, "GO"),
    ("TURN-GATE V1I GO", 18, 9, "GO"), ("TURN-GATE V1J GO", 12, 4, "GO"),
    ("RSI V1A GO", 8, 9, "GO"), ("RSI V1B NOGO", 12, 1, "NOGO"),
    ("RSI V1C GO", 12, 2, "GO"), ("RSI V1D NOGO", 32, 5, "NOGO"),
    ("GAIN-DOSE INVALID", 21, 11, "VOID"), ("BRAKE V2 NOGO", 18, 4, "NOGO"),
    ("VALUE-PROBE INDET", 9, 19, "VOID"), ("CUE NOGO", 24, 11, "NOGO"),
    ("DAMAGE-GATE NOGO", 15, 7, "NOGO"),
]

def ranks(xs):
    s = sorted(xs)
    return [s.index(x) + 1 for x in xs]

def spearman(a, b):
    n = len(a)
    ra, rb = ranks(a), ranks(b)
    ma, mb = sum(ra) / n, sum(rb) / n
    den = (sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb)) ** 0.5
    return sum((x - ma) * (y - mb) for x, y in zip(ra, rb)) / den if den else 0.0

cost = [v[1] for v in V]
hed = [v[2] for v in V]
print(f"n={len(V)} spearman(cost,hedges)={spearman(cost, hed):+.3f} (dissonance predicts <0)")
for cls in ["GO", "NOGO", "VOID"]:
    g = [v for v in V if v[3] == cls]
    print(f"{cls}: n={len(g)} medCost={sorted(v[1] for v in g)[len(g)//2]} "
          f"medHedges={sorted(v[2] for v in g)[len(g)//2]} "
          f"spearman={spearman([v[1] for v in g],[v[2] for v in g]):+.3f}")
print("\nmost expensive verdicts:")
for v in sorted(V, key=lambda x: -x[1])[:6]:
    print(f"  {v[0]}: mains={v[1]} hedges={v[2]}")
print("\nleast hedged verdicts:")
for v in sorted(V, key=lambda x: x[2])[:6]:
    print(f"  {v[0]}: mains={v[1]} hedges={v[2]}")
