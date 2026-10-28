# Single-traversal exact overlap index

The previous fixed bucket prototype visited each neighboring pair twice and
failed its cost comparison. This separately specified, outcome-informed
engineering candidate visits each pair once: first evaluate all center
scores, then traverse points by increasing second index, look only in the
three neighboring cells containing earlier points, and insert the current
index after its pairs have been processed. Equal pair scores explicitly select
the lexicographically earliest first/second pair; an equal center remains the
winner. Thus this changed enumeration preserves the original output rather
than changing the policy. Unsafe cell integers fall back to the original loop.

Retain the complete bucket index in scratch for encoded-state pricing, restore
the original final separation scratch value, and explicitly meter construction,
lookup, traversal, geometric calculations and tie handling. Compare the fixed
candidate with the original on the same captured C/transfer point sequences;
report every operation and byte-tick, without attributing the resulting
same-state cost difference to a physical policy or a qualified learned skill.
The declared scalar convention is not an independent low-level cost proof.
Before integration, verify deterministic ties, boundaries, duplicates, random
and unsafe coordinates, and audit the calculation independently. Embodied
controls must then pay all extra state and work without changing any existing
survival, retention, transfer or fresh qualification gate.
