# Deployment design

Target: Vercel for the web interface. Current `npm start` runs a persistent,
loopback-only Node HTTP process and writes checkpoints to local disk. Uploading
`dist/` alone does not provide `/api/state` or an always-on world.

Vercel Functions have finite execution durations:
https://vercel.com/docs/functions/configuring-functions/duration

A continuously advancing world therefore needs either a separately hosted
persistent worker with durable storage, or a redesigned bounded-job system with
persistent checkpoints, exclusive world ownership and retry-safe progression.
The latter is a substantial architectural change, not a deployment setting.

No public hosting has been provisioned. Do not expose the local server directly:
its controls rely on localhost restrictions, not owner authentication. The hosted
release checklist in RELEASE_PLAN.md is the deployment acceptance gate. No cloud
budget or external worker provider has been chosen yet.
