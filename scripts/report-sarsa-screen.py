"""Derive the continuation report from immutable screen results and audits."""
import json
from pathlib import Path
import statistics
import sys

directory, output = Path(sys.argv[1]), Path(sys.argv[2])
read = lambda name: json.loads((directory / name).read_text(encoding='utf8'))
p, results, cold, numeric, recapture = [read(name) for name in ['protocol.json', 'results.json', 'audit.json', 'numeric-audit-v3.json', 'supplemental/audit.json']]
assert cold['passed'] and numeric['passed'] and recapture['passed']
rows = [read(f"rows/{h['seed']}.json") for h in p['histories']]
required = [v for v in results['comparisons'] if not v['optional']]
lines = ['# Expected SARSA screen: results and continuation', '',
         f"The fixed candidate **{'passed' if results['qualified'] else 'failed'} qualification** on the locked fresh bank. {sum(v['passed'] for v in required)} of {len(required)} required energy/skill/retention contrasts passed. The original intervention remains failed. No ecological policy was promoted and no RSI result has been demonstrated.", '',
         'The user authorized continuation from PR #2 on 2026-10-24. The original handoff/Astra transcript remain preserved. See [the prospective design](SARSA_SCREEN.md) and [the frozen protocol](../evidence/sarsa-screen/20261024-fixed-expected-sarsa-v1/protocol.json).', '',
         'Sixteen independent seed histories, seven arms and nine common-body probes per history: 112 main worlds plus 144 frozen probes. Each history keeps all 24 original founders in denominators. The nine-probe/144 budget was explicitly adopted before scientific seeds/outcomes; it exceeds the suggested 128-probe ceiling by sixteen, retaining the earlier 256-world combined cap. No candidate search, held-out reselection, sample extension or replacement of deaths occurred.', '',
         'Every contrast below reports the mean energy effect per founder, its simultaneous one-sided lower confidence bound, exact paired sign-flip p-value and frozen gate. Bonferroni family alpha .05 covers all ten contrasts (including optional trace attribution); each requires lower > 0 and p ≤ .005. The history, not a founder or probe, is the inference unit.', '']
for v in results['comparisons']:
    lines.append(f"- `{v['id']}`: mean {v['mean']:.6f}, lower {v['simultaneousLower']:.6f}, p={v['pOneSided']:.8g}; **{'pass' if v['passed'] else 'fail'}**{' (optional attribution)' if v['optional'] else ''}.")
passed_names = ', '.join(v['id'] for v in results['comparisons'] if v['passed']) or 'none'
failed_names = ', '.join(v['id'] for v in results['comparisons'] if not v['passed']) or 'none'
lines += ['', f'Passed comparisons: {passed_names}. Failed comparisons: {failed_names}. A positive average alone does not clear a gate. Trace attribution requires the separate optional lambda-zero comparison.', '', 'Whole-sequence mean net energy change per founder (including priced external work/debt):', '']
for arm, value in results['meanSequenceEnergy'].items():
    lines.append(f'- {arm}: {value:.6f}.')
lines += ['', 'Survival guards require nonnegative observed mean candidate-control survival, with descriptive uncertainty. They are not a survival noninferiority demonstration:', '']
for v in results['survival']:
    lo, hi = v['descriptiveCi95']
    lines.append(f"- Versus {v['control']}: {100*v['mean']:.6f} percentage points, descriptive 95% interval [{100*lo:.6f}, {100*hi:.6f}]; **{'pass' if v['passed'] else 'fail'}**.")
lines += ['', 'Survivor totals across the sixteen main worlds:', '']
for arm in p['arms']:
    lines.append(f"- {arm}: {sum(r['arms'][arm]['endpoint']['survivors'] for r in rows)}/384.")
learners = [s for r in rows for s in r['arms']['candidate']['learners']]
lines += ['', f"Actual memory pressure was present: candidate founders completed {min(s['transitions'] for s in learners)}–{max(s['transitions'] for s in learners)} transitions against a 64-transition capacity; {min(s['olderSeen'] for s in learners)}–{max(s['olderSeen'] for s in learners)} transitions entered the older-reservoir stream. These are observed lifetime counters, not proof that each retained record supplied a distinct useful skill.", '', 'Actual candidate resource measurements, averaged over histories:', '']
for phase in p['phases']:
    values = [v for r in rows for v in r['arms']['candidate']['phases'] if v['phase'] == phase['id']]
    avg = lambda key: statistics.mean(v[key] for v in values)
    lines.append(f"- {phase['id']}: inventory {avg('foodInventoryStart'):.6f} → {avg('foodInventoryEnd'):.6f}, eaten {avg('foodEaten'):.6f}, delivered regrowth {avg('deliveredRegrowth'):.6f}.")
wall = sum(r['runtime']['wallSeconds'] for r in rows)
user = sum(r['runtime']['cpuMicroseconds']['user'] for r in rows) / 1e6
system = sum(r['runtime']['cpuMicroseconds']['system'] for r in rows) / 1e6
lines += ['', f"Collection consumed {wall:.6f} measured wall seconds and {user:.6f}/{system:.6f} process user/system CPU seconds on Node {rows[0]['runtime']['node']} / Windows. This includes external recording/evaluation overhead; it is separate from the declared canonical-storage/scalar-work energy model.", '',
          f"The full original cold audit reproduced all {cold['mainWorlds']} main worlds and {cold['probes']} probes, including physical/checkpoint/learner states, endpoints, scores and gates. The first independent Python audit stopped on `AssertionError: factual prior features`. Investigation found that a death on a decision tick can perform two learner updates, while the original evaluator trace stored only the last one. The original frozen sources, traces, results and failed log remain intact.", '',
          f"A supplemental recorder captures both updates in their actual order. It cold-replayed the same bank again and asserted exact equality of every original main/probe/checkpoint/learner/endpoint row. It recorded {recapture['doubleUpdateEvents']} double-update events. It changed no scientific seed, learner rule, physical trajectory, score, contrast or gate. The source manifest and patch identify the correction; no authoritative original bytes were rewritten.", '',
          f"The corrected independent Python checker rebuilt {numeric['factualTransitions']:,} factual transitions and {numeric['decisions']:,} choices across {numeric['learnerBodies']:,} learner bodies, plus history features, RNGs, traces, reservoir/replay, scalar work, paid/debt arithmetic, all-founder endpoints and all ten statistical gates. V2 completed those arithmetic assertions but refused the warning-free gate because it left sixteen trace files unclosed. V3 adds explicit file context managers; its source/patch and both earlier failures are preserved. V3 passed with {len(numeric['warnings'])} warnings. No arithmetic threshold changed. This independent arithmetic complements the physical replay; it does not turn a failed scientific gate into a pass.", '',
          'New-machine preparation restored and verified all 1,316 original archived files and installed 17 paused runtime files without starting habitats. Windows CRLF conversion initially caused an exact evidence-hash refusal; confirmed line-ending-only files were restored to their original Git blob bytes, and `.gitattributes` prevents recurrence. The historical loader test now uses Windows-compatible file URLs. The prior intervention numerical audit passed here with 64 models, twelve comparisons and no warnings; its historical full physical bank was not rerun here.', '',
          'An intermediate baseline suite reported an autonomy smoke-test status error without the child error in its assertion. The assertion now retains that error. A later run exposed `EPERM` during replacement of `status.json.tmp` with `status.json` on Windows. The existing autonomy runner now retries that same completed temporary file a bounded number of times, preserving the old checkpoint and propagating a persistent error. Regression tests cover eventual success and persistent failure without deleting either recovery file. The earlier uninstrumented failure has no separately established cause. Failing logs remain preserved. Initialization also initially refused a missing parent directory (`ENOENT`); the parent is now created before the exclusive study directory. This occurred before seeds/outcomes were generated.', '',
          'The entire new bank, original and corrected traces, captured source graphs, seed exclusion inputs, all audits and execution logs are retained in the additional checked archive. The original handoff manifest/chunks remain unchanged. Restore after cloning:', '',
          '```powershell',
          'python scripts/research-evidence.py restore --runtime',
          'python scripts/package-sarsa-evidence.py restore handoff/sarsa-screen-20261024/manifest.json',
          'python scripts/package-sarsa-evidence.py verify handoff/sarsa-screen-20261024/manifest.json',
          '```', '',
          'The RSI goal remains active and unachieved. This candidate is not a qualified embodied substrate, so it does not authorize advancing it to persistent recursive generations or a live habitat. Any next candidate requires a justified change and a new prospective protocol/bank; these held-out outcomes cannot be reused for selection or called fresh confirmation. Copied-improvement controls, successive autonomous algorithm revisions and causal search-productivity gains remain unimplemented obligations.', '']
with output.open('x', encoding='utf8', newline='\n') as f:
    f.write('\n'.join(lines))
print(json.dumps({'report': str(output), 'qualified': results['qualified'], 'requiredPassed': sum(v['passed'] for v in required), 'requiredTotal': len(required)}))
