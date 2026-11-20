#!/usr/bin/env python3
"""CONCENTRATION_AUDIT_V1: is the residual ALWAYS concentrated in a few harmful cues?

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/turn-gated-dev/attempt-*/rows/*.json summaries
(per-cue contact/turn/label) + dev-results gaps.
Prior: TURN_GATE_CONCENTRATION (one bank: error mass in ~3 HB cues,
top-1 26-43%, top always HB). This generalizes across all banks/lines/arms.
Metric per (bank, tag): pool harmful-cue misses (contact-turn), rank,
report top-1/top-3 share of total harmful misses + n cues.
"""
import json, glob, os
from collections import defaultdict

def load():
    rows = []
    for p in sorted(glob.glob("evidence/turn-gated-dev/attempt-*/rows/*.json")):
        r = json.load(open(p))
        s = r.get("summary") or {}
        if not s.get("cues"):
            continue
        rows.append({"bank": p.replace("\\", "/").split("/")[-3],
                     "tag": r.get("tag"), "seed": (r.get("history") or {}).get("seed"),
                     "cues": s["cues"]})
    return rows

def conc(rows):
    miss = defaultdict(int)
    tot = 0
    for r in rows:
        for cue, c in r["cues"].items():
            if c.get("label") != "harmful":
                continue
            m = (c.get("contact") or 0) - (c.get("turn") or 0)
            if m > 0:
                miss[(r["seed"], cue)] += m
                tot += m
    if not tot:
        return None
    ranked = sorted(miss.values(), reverse=True)
    return {"top1": ranked[0] / tot, "top3": sum(ranked[:3]) / tot,
            "ncues": len(ranked), "tot": tot}

def main():
    rows = load()
    groups = defaultdict(list)
    for r in rows:
        groups[(r["bank"], r["tag"])].append(r)
    print("bank | tag | ncues | top1 | top3 | totMiss")
    out = {}
    for (bank, tag) in sorted(groups):
        c = conc(groups[(bank, tag)])
        if not c:
            continue
        out[(bank, tag)] = c
        print(f"{bank} | {tag} | {c['ncues']} | {c['top1']:.3f} | {c['top3']:.3f} | {c['tot']}")
    # train concentration vs transfer gap per bank (from dev-results)
    print("\nbank trainTop1 trainTop3 gap(train-uniform)")
    gaps = []
    for att in sorted(glob.glob("evidence/turn-gated-dev/attempt-*/dev-results.json")):
        d = json.load(open(att))
        bank = os.path.basename(os.path.dirname(att))
        # uniform arm tag varies by line; find transferred-* non-gain non-seg2 non-damage
        tg = d.get("trainGaps") or []
        xg = d.get("transGaps") or []
        if not tg or not xg:
            continue
        # train concentration: any tag in {train, candidate}
        tc = None
        for t in ("train", "candidate"):
            if (bank, t) in out:
                tc = out[(bank, t)]
        if not tc:
            continue
        mt = sum(g["gap"] for g in tg) / len(tg)
        mx = sum(g["gap"] for g in xg) / len(xg)
        gaps.append((tc["top3"], mt - mx))
        print(f"{bank}: top1={tc['top1']:.3f} top3={tc['top3']:.3f} gap={mt-mx:.4f}")
    if len(gaps) >= 3:
        xs = [g[0] for g in gaps]
        ys = [g[1] for g in gaps]
        mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
        den = (sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys)) ** 0.5
        r = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / den if den else 0
        print(f"corr(trainTop3, gap) = {r:+.3f} (n={len(gaps)})")

if __name__ == "__main__":
    main()
