# Security scope

The baseline is intended for trusted local use. Do not expose it to the public
internet: there is no owner-account authentication. Checkpoints are untrusted
inputs; validation does not make arbitrary-sized computations safe.

Report suspected vulnerabilities privately to the repository owner rather than
posting credentials or exploit data publicly. Public deployment is gated on
explicit read/control separation, authentication, limits and durable recovery.
