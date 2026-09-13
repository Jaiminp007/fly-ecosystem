# Contributing

Use Node.js 22 or newer; the compact simulator has no runtime packages to install.
Run `npm test` and JavaScript syntax checks before submitting a pull request.

Describe model changes separately from UI/infrastructure changes. Include a
focused regression for changed simulation behavior and update the model identity
when checkpoint interpretation changes. Preserve experiment source digests; do
not present old measurements as evidence for changed models. Never hide extinct
runs through reseeding or label structural growth as intelligence.

Do not commit datasets, credentials, local runtime environments or personal paths.
Keep third-party attribution intact. Propose hosted architecture changes against
the acceptance criteria in docs/RELEASE_PLAN.md.
