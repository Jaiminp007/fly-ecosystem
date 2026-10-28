"""Report the frozen sparse-policy study without changing its decision rule."""
import hashlib
import json
from pathlib import Path
import sys


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def logtext(path):
    data = path.read_bytes()
    return data.decode('utf16' if data.startswith(b'\xff\xfe') else 'utf8')


directory = Path(sys.argv[1])
p = json.loads((directory / 'protocol.json').read_text(encoding='utf8'))
tests = logtext(Path('runs/sarsa-screen-mushroom-tests.log'))
assert all(token in tests for token in ['# tests 161', '# pass 161', '# fail 0', '# skipped 0'])
assert 'OK' in logtext(Path('runs/sarsa-screen-mushroom-adapter.log'))
lines = ['# Sparse dopamine-gated policy: results', '',
    'The [prospective mechanism and alternatives](MUSHROOM_POLICY_DEVELOPMENT.md) explain why this study replaces value bootstrapping/replay with direct stochastic policy plasticity. Its inspiration from fly neuroscience is a hypothesis, not biological or performance validation. Earlier SARSA, tile, and Retrace failures remain preserved.', '']
for phase in ['development', 'confirmation']:
    folder = directory / phase
    if not folder.exists():
        continue
    r = json.loads((folder / 'results.json').read_text(encoding='utf8'))
    physical = json.loads((folder / 'physical-audit.json').read_text(encoding='utf8'))
    numeric = json.loads((folder / 'numeric-audit.json').read_text(encoding='utf8'))
    histories = p['developmentHistories' if phase == 'development' else 'confirmationHistories']
    assert r['rowSha256'] == [sha(folder / 'rows' / f"{h['seed']}.json") for h in histories]
    for a in (physical, numeric):
        assert a['passed'] and a['protocolSha256'] == sha(directory / 'protocol.json') and a['resultsSha256'] == sha(folder / 'results.json')
    assert not numeric['warnings'] and numeric['learnerBodies'] == len(histories) * 6 * 24
    passed = r['promising'] if phase == 'development' else r['qualified']
    key = 'developmentalPositive' if phase == 'development' else 'confirmatoryPass'
    required = [c for c in r['comparisons'] if not c['optional']]
    decision = {'schema': 1, 'phase': phase, 'passed': passed, 'qualified': r['qualified'],
        'requiredContrastsPassed': sum(c[key] for c in required), 'requiredContrasts': len(required),
        'failedEnergyContrasts': [c['id'] for c in required if not c[key]],
        'survivalGuardsPassed': sum(v['passed'] for v in r['survival']), 'survivalGuards': len(r['survival']),
        'plasticityHistoriesPassed': sum(v['passed'] for v in r['plasticityActivity']), 'histories': len(histories),
        'protocolSha256': sha(directory / 'protocol.json'), 'resultsSha256': sha(folder / 'results.json'),
        'physicalAuditSha256': sha(folder / 'physical-audit.json'), 'numericAuditSha256': sha(folder / 'numeric-audit.json'),
        'boundary': 'Development is not qualification. No post-result tuning, replacement, resampling or extension on this bank. Even qualification of the fixed screen would not establish autonomous persistent revision, copied-improvement superiority, subsequent search gains, ecological readiness or RSI.'}
    with (folder / 'decision.json').open('x', encoding='utf8', newline='\n') as stream:
        json.dump(decision, stream, indent=2)
        stream.write('\n')
    if phase == 'development' and not passed:
        assert not (directory / 'confirmation').exists()
    rows = [json.loads((folder / 'rows' / f"{h['seed']}.json").read_text(encoding='utf8')) for h in histories]
    wall = sum(row['runtime']['wallSeconds'] for row in rows)
    cpu = sum(sum(row['runtime']['cpuMicroseconds'].values()) for row in rows) / 1e6
    lines += [f'## {phase.capitalize()}', '',
        f'The fixed gate **{"passed" if passed else "failed"}**: {decision["requiredContrastsPassed"]}/{len(required)} required energy contrasts, {decision["survivalGuardsPassed"]}/{len(r["survival"])} survival guards, and {decision["plasticityHistoriesPassed"]}/{len(histories)} plasticity-activity gates passed. Qualification reported by this phase: **{r["qualified"]}**. Independent histories are the units; founders and probes are not extra samples.', '',
        f'Collection: {len(histories) * 10} main worlds and {len(histories) * (18 if phase == "development" else 9)} read-only probes; {wall:.3f} wall seconds and {cpu:.3f} process CPU seconds. The physical environment, reward, resource schedule and old gates were retained; slow consolidation was compared against a matched fast-only circuit.', '',
        '| Required contrast | Mean energy/founder | Simultaneous lower | Exact one-sided p | Phase gate |', '| --- | ---: | ---: | ---: | --- |']
    for c in required:
        lines.append(f'| {c["id"]} | {c["mean"]:.6f} | {c["simultaneousLower"]:.6f} | {c["pOneSided"]:.6f} | {c[key]} |')
    lines += ['', 'Development requires all means positive; its intervals/p-values are descriptive and do not count as qualification. Confirmation requires both positive simultaneous lower bounds and exact paired p<=.05/13 on every required contrast.', '',
        '| Survival control | Mean difference | Gate |', '| --- | ---: | --- |']
    for v in r['survival']:
        lines.append(f'| {v["control"]} | {v["mean"]:.6f} | {v["passed"]} |')
    activity = r['plasticityActivity']
    lines += ['', f'Nonzero dopamine fractions ranged from {min(v["fraction"] for v in activity):.2%} to {max(v["fraction"] for v in activity):.2%}; candidate slow-synapse transfers totaled {sum(v["transfers"] for v in activity):,}. Activity alone does not prove useful learning or retention.', '',
        f'Full cold physical replay reproduced every main world, probe, factual trace hash, row, and score. Independent Python reconstructed {numeric["factualTransitions"]:,} transitions, {numeric["decisions"]:,} learned-policy decisions, {numeric["learnerBodies"]:,} learner bodies and {numeric["reflexDecisions"]:,} fixed-reflex choices, with zero warnings. It independently checks connectivity, sparse winner selection, saved policy probabilities/score gradients, dopamine/baseline, both synaptic compartments, eligibility, exact work counters, RNG, receipt rings, debt and statistical gates.', '']
    lines += [f'The original raw-object physical auditor failed on signed-zero entries lost by JSON serialization. Its source and failure log are preserved. The supplemental auditor found {physical.get("signedZeroEntries", 0):,} such entries across the full bank and requires exact JSON row equality and exact trace hashes without numerical tolerance. The learner, recorded outcomes and failed gates are unchanged.', '']
    print(json.dumps(decision))
lines += [f'The [frozen protocol](../{directory.as_posix()}/protocol.json) preserves 192 unique new seeds for the development and reserved histories, excluding all prior registries and unused reserves. Confirmation directory exists: **{(directory / "confirmation").exists()}**. Software verification passed 161 Node tests with the independent Python checks enabled and one Python adapter test. Bounded/shared synaptic state does not itself prove distinct retained skills; no broader continual-learning or RSI claim follows a circuit label or software pass.', '',
    'The full goal remains active. Every failed gate remains failed. A qualified embodied substrate is still required before the later persistent autonomous revisions, copied-improvement controls and improved subsequent search can establish their causal claims.', '']
with Path('docs/MUSHROOM_POLICY_RESULTS.md').open('x', encoding='utf8', newline='\n') as stream:
    stream.write('\n'.join(lines))
