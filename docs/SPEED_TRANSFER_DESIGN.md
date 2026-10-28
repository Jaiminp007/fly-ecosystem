# Adaptive speed authority witness

Prospectively agreed in the [Astra/root conversation](t3-thread://v1/mcp:65dee2c2-6de9-411b-9e34-31afe7486364)
after stopping the unsuccessful stop-plus-one-cruise-speed family. This is one
explicit speed-interface experiment, not a threshold sweep or learner revision.

Use the same eight attempt-15 end-C anchors and original transfer seeds for256
ticks. Keep native steering, acceptance, inventory, founders, physical traits,
initial energy, inherited debt and prices. Every current-15 shadow weight is
frozen. The adaptive controller chooses full-speed approach (`move=1`) only if
all conditions hold: target present (`raw[3]>0`), outside the near field
(`raw[3]<.75`), forward cosine at least.5, no local contact, and both wall sensors
zero. Otherwise it chooses original half-speed approach (`move=0`). No target
means half-speed search. Recompute every tick, with no pause or hysteresis.
The thresholds are fixed engineering choices, not claimed optimal.

Three shadow arms use adaptive, always-half, or always-full movement. Every arm
computes all six scalar predicates and the mode selection, carries identical
numeric fields for mode/requested/executed movement, and pays its actual frozen
learner and selector costs. All physical decisions still accept; pending credit
and held cruise state agree with actual execution. Requested and executed move
outputs are recorded. No target identity, map, GPS, new sensor or privileged
geometry can influence this controller.

Also execute two bare fixed references, always half and always full, from these
same bodies. Earlier full-speed experiments on different acquired bodies are not
substitutes. Settle already performed work before scoring starting debt in all
five arms, and settle completed observations in the shadow executor. Common
physical starting hashes and frozen weights must hold; prices and terminal debt
remain real. Actual sensing/inference work and byte-time costs are reported,
not subtracted twice from already charged physical costs.

The predeclared exploratory witness rule requires positive mean energy versus
ALL four references, at least6/8 positive paired energy contrasts versus EACH
shadow fixed-speed reference, and nonnegative summed survivor differences versus
every reference. Report all histories, full-speed fraction, intake, physical
costs and learner charges. No retuning after failure. Beating half while losing
to always full demonstrates speed headroom, not value from adaptive selection.

A pass would be a hand-coded paid control witness only. A later learner must
actually acquire useful action values over stop/half/full from own finite-horizon
net energy and terminal outcomes. Frozen/reset models receive the same action
set and every innate initialization/fallback; reproducing a shared hand-coded
policy does not count as acquired transfer. All existing qualification/retention/
functional-pressure and RSI requirements stay unchanged. Failure closes this
particular speed-controller hypothesis without proving global optimality.
