# Hosting Afterwing

## Live Railway trial deployment — legacy compact model

https://afterwing-production.up.railway.app

Deployed 2026-09-13 as one container with a persistent volume mounted at `/data`,
RUNS_DIR=/data, HOST=0.0.0.0 and AUTO_START=true. Requested speed is 5×. Public writes
return 401; no ADMIN_TOKEN is configured. HTTP health and restart recovery were
checked; see evidence/railway-deployment.json. Browser visual QA remains unverified.
This service runs `server.mjs` and is not the MaleCNS v3 arena.

The measured local MaleCNS process peaked above 1 GB with one brain and above
1.4 GB with two. Railway's published Trial limit is 1 GB RAM per service, so the
full-connectome population has not been deployed there. The 0.5 GB Trial volume
also does not fit the original source downloads. No paid upgrade was authorized.

This is trial-funded infrastructure, not a promise of permanently free hosting.
No recurring ping job or paid subscription was created. Updates currently deploy
through the Railway CLI; GitHub pushes do not automatically redeploy this service.


## Render Free demo

`render.yaml` configures a public, read-only, auto-starting demo at 5× requested
world speed. No ADMIN_TOKEN is set, so every control write is rejected. It starts
a fresh seed on an empty filesystem, never reseeds an extinct world within a run.
The UI discloses that platform restarts may reset the demo. Local research data is
not uploaded. Deploy the public GitHub repository, select Free, Node 24, build
`npm test`, start `node server.mjs`, and use the environment in render.yaml.

Free instances sleep after 15 minutes without inbound traffic, can restart, and
lose filesystem changes. Pings do not provide durability or guaranteed uptime.
See https://render.com/docs/free (checked 2026-09-13).

## Persistent deployment configuration

Use one Node process, one replica, and durable storage mounted at RUNS_DIR.
Set HOST=0.0.0.0 and a random ADMIN_TOKEN of at least 32 characters. Terminate HTTPS
at the host. All POST controls require `Authorization: Bearer <token>`. The public
UI remains observation-only; owner API access is separate. Never embed the token
in frontend code, links, logs or Git. `/healthz` reports recovery health.

Graceful restarts preserve pause/speed. A corrupt autosave fails startup without
writing a replacement. Rolling files retain the most recent twelve snapshots;
manual/terminal archives are retained. Monitor disk growth and independently back
up the mounted storage. A local atomic rename is not an off-site backup.

An earlier checked Railway account had an expired trial. The selected account
had trial credit and now hosts the service. No paid plan was authorized. Published Railway Free allowances are small
and do not guarantee continuous simulation. See https://docs.railway.com/pricing/free-trial.

Vercel Functions have bounded execution duration and do not directly fit this
persistent process. See https://vercel.com/docs/functions/configuring-functions/duration.

## Remaining production work

Persistent hosted restore drill, owner-facing login, rate/size/compute hardening,
long-run resource limits and browser interaction QA remain release gates. Do not
call the free demo a production always-on scientific experiment.
