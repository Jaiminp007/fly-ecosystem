# GEN1-WIPE PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why wipe verified post-B weights (retention left the carrier open)
Retain V1: post-B frozen weights beat naive (91% skill kept) — but
WHERE does the edge live? Candidates: the weight values (content) vs
everything else identical across arms (placement, world, freeze —
controlled) — except the STORE (cleared at placement for all: no) and
INIT-vs-ZEROS (naive carries random init noise; cleared carries blank
zeros — if zeros beat init, init noise was harmful, not learned skill
helpful). Wiping post-B weights to blank zeros and probing frozen
isolates the carrier: edge disappears → weights carry it (content
confirmed); edge persists → zeros beat init (init was the handicap).
- Same A→B continual train (512+512, learn on, snapshots A + post-B;
  standard codebooks, same history) then FOUR frozen 256-tick probes
  on ORIGINAL A cues/positions (do NOT relabel, do NOT move):
  aprobeT (A-weights — bank skill gate, retain-verbatim) + intact
  (post-B weights via placeLearnedWeights) + cleared (post-B weights
  copied for integrity, then zeroWeights-wiped blank, then frozen —
  placeCleared) + naive (init via placeNaive, double-duty control for
  both gates). All energy48 + re-baseline. Metric: net intake rate;
  toxin/survival texture. 2 histories = 2 trains + 8 probes.
- Verdict (pooled n=2): A-digest unmoved → INVALID (no content).
  Else aprobeT ≤ naive (no positive edge) → INCOMPLETE-NOSKILL (void —
  no skill on this bank). Else GO (`GEN1-WIPE-GO-V1`) iff intact >
  naive ×1.1 (edge replicates) AND cleared ≤ naive ×1.0 (no positive
  edge — disappears when wiped; weights carry it). Else NOGO
  (`GEN1-WIPE-NOGO-V1`) — subcases descriptive: cleared-keeps-edge
  (zeros beat init — init noise was the handicap, not learned skill
  the carrier) vs intact-weak/destroyed (edge marginal or B-destroyed
  this bank — wipe untestable). No transmission/transfer/RSI/
  population claim. No sensors/actuators.
- Bank: fresh-32, 474559–474576 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: train + intact-probe +
  cleared-probe (the novel wipe path incl. direct zero-read check) on
  ONE throwaway history on 490190–490198 (added to spent, disclosed)
  proving digests move + wipe zeroes + probes complete BEFORE bank
  mint (naive/A-pair machinery proven in retain triage). Caps: BT.
  Single attempt. Disk floor 1 GB (free ~3G; output ~2M).
