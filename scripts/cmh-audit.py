#!/usr/bin/env python3
"""CMH_AUDIT_V1: bank-stratified hub-vs-spread conversion (Mantel-Haenszel + Breslow-Day).

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Strata = banks with a canonical hub arm and spread arm (10 strata, 6 histories
each; proximity excluded — multi-arm, no canonical pair; encounter-03 duo
excluded — three-arm topology question, not binary).
Vote = per-history binary conversion (gen2>=1), same standard as JURY_AUDIT_V1.
CMH here is DESCRIPTIVE stratification (arms assigned, histories random —
not a randomized trial; no causal claim beyond the pairing).

Outputs: per-stratum ORs, pooled OR_MH with RBG 95% CI, CMH association test,
Breslow-Day homogeneity (do banks agree on the hub effect?).
"""
import json, glob, math
from collections import defaultdict

rows = []
for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
    r = json.load(open(p))
    if r.get("arm") not in ("hub", "spread"):
        continue
    by = ((r.get("generations") or {}).get("byGeneration")) or {}
    rows.append({"bank": p.replace("\\", "/").split("/")[1] + "/" + p.replace("\\", "/").split("/")[2],
                 "arm": r["arm"], "seed": (r.get("history") or {}).get("seed"),
                 "vote": 1 if int(by.get("2", 0) or 0) >= 1 else 0})

groups = defaultdict(list)
for x in rows:
    groups[x["bank"]].append(x)

# stratum = bank with >=3 hub AND >=3 spread votes
tables = {}
for bank, g in sorted(groups.items()):
    h = [x["vote"] for x in g if x["arm"] == "hub"]
    s = [x["vote"] for x in g if x["arm"] == "spread"]
    if len(h) >= 3 and len(s) >= 3:
        a, b = sum(h), len(h) - sum(h)      # hub convert / not
        c, d = sum(s), len(s) - sum(s)      # spread convert / not
        tables[bank] = (a, b, c, d)
print(f"strata: {len(tables)}")
for bank, (a, b, c, d) in tables.items():
    n = a + b + c + d
    orow = (a * d / (b * c)) if b and c else (float("inf") if a and d else 0.0)
    print(f"  {bank}: hub {a}/{a+b} spread {c}/{c+d} OR={orow:.3f}" if orow not in (float("inf"),) else f"  {bank}: hub {a}/{a+b} spread {c}/{c+d} OR=inf")

# Mantel-Haenszel pooled OR + RBG CI
num = den = 0.0
for a, b, c, d in tables.values():
    n = a + b + c + d
    num += a * d / n
    den += b * c / n
or_mh = num / den if den else float("nan")
# RBG variance of ln(OR_MH)
sP = sQ = sPQ = 0.0
for a, b, c, d in tables.values():
    n = a + b + c + d
    if n == 0:
        continue
    P = (a + d) / n
    Q = (b + c) / n
    R = a * d / n
    S = b * c / n
    sP += P * R
    sQ += Q * S
    sPQ += (P * S + Q * R)
var_ln = sP / (2 * num * num) + sPQ / (2 * num * den) + sQ / (2 * den * den) if num and den else float("nan")
import math as _m
ci = (_m.exp(_m.log(or_mh) - 1.96 * _m.sqrt(var_ln)), _m.exp(_m.log(or_mh) + 1.96 * _m.sqrt(var_ln)))
print(f"\nOR_MH={or_mh:.3f} 95%CI=[{ci[0]:.3f},{ci[1]:.3f}]")

# CMH association test
sAD = sE = sV = 0.0
for a, b, c, d in tables.values():
    n = a + b + c + d
    E = (a + b) * (a + c) / n
    V = (a + b) * (c + d) * (a + c) * (b + d) / (n * n * (n - 1)) if n > 1 else 0
    sAD += a - E
    sE += E
    sV += V
chisq = (abs(sAD) - 0.5) ** 2 / sV if sV else float("nan")
print(f"CMH chi2(1)={chisq:.3f} (association of hub with conversion, conditional on bank)")

# bisection-based BD (robust, no algebra risk): E(a) s.t. E*(n-m1-m2+E)/((m1-E)*(m2-E)) = or_c
def expected_a(a, b, c, d, or_c):
    m1, m2, n = a + b, a + c, a + b + c + d
    lo, hi = max(0, m1 + m2 - n), min(m1, m2)
    for _ in range(200):
        mid = (lo + hi) / 2
        f = mid * (n - m1 - m2 + mid) / max(1e-12, (m1 - mid) * (m2 - mid)) if (m1 - mid) > 0 and (m2 - mid) > 0 else float("inf")
        if f > or_c:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2

def bd_var(a, b, c, d, E):
    m1, m2, n = a + b, a + c, a + b + c + d
    return 1 / (1 / max(1e-12, E) + 1 / max(1e-12, m1 - E) + 1 / max(1e-12, m2 - E) + 1 / max(1e-12, n - m1 - m2 + E))

bd = sum((a - expected_a(a, b, c, d, or_mh)) ** 2 / bd_var(a, b, c, d, expected_a(a, b, c, d, or_mh))
         for a, b, c, d in tables.values())
df = len(tables) - 1
print(f"Breslow-Day chi2({df})={bd:.3f} (homogeneity of hub effect across banks; large = banks disagree)")
