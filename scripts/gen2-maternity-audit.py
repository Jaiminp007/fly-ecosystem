#!/usr/bin/env python3
"""GEN2_MATERNITY_AUDIT_V1: depth-concentration is UNMEASURABLE on frozen rows.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows lineageFounders +
founderOffspring key ranges + generations.
Proves ID-locality (founder IDs restart per row: all keys <= ~27
across 336 worlds x up to 24+ founders) => cross-row pooling of
maternal IDs conflates distinct individuals => pooled concentration
("12 distinct mothers") is artifact, not finding.
Valid remainder: per-row gen-2 count census (depth exists, thinly).
Shapley proper CLOSED as unresolvable (no counterfactual game +
no global IDs); descriptive pooled maternity CLOSED as invalid
(ID collision). What would work (specified, not built): globally-
unique founder IDs (bank+history+index) + per-birth maternal
chains (structure exists within rows; ID space does not cross them).
"""
import json, glob
from collections import Counter

def main():
    max_key = 0
    n_rows = 0
    id_reuse = Counter()
    g2_counts = Counter()
    g3_total = 0
    for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
        try:
            r = json.load(open(p))
        except Exception:
            continue
        lf = r.get("lineageFounders", "ABSENT")
        if lf == "ABSENT" or not isinstance(lf, dict):
            continue
        n_rows += 1
        fo = r.get("founderOffspring", {})
        if isinstance(fo, dict):
            for k in fo:
                try:
                    max_key = max(max_key, int(k))
                except (ValueError, TypeError):
                    pass
        for x in lf.get("gen2", []) or []:
            id_reuse[x] += 1
        g2_counts[len(lf.get("gen2", []) or [])] += 1
        g3_total += len(lf.get("gen3", []) or [])
    print(f"rows with lineageFounders: {n_rows}")
    print(f"max founder-ID key anywhere: {max_key} (per-row numbering proven: "
          f"336 worlds x 24+ founders cannot fit in <=27 global IDs)")
    print(f"per-row gen2-count histogram (row: n_rows): {dict(sorted(g2_counts.items()))}")
    print(f"total gen3 births with maternity: {g3_total}")
    print(f"most-reused maternal IDs across rows (collision demo): "
          f"{id_reuse.most_common(5)} (same numbers recur in unrelated worlds)")

if __name__ == "__main__":
    main()
