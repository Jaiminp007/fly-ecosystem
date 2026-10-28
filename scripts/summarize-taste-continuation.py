"""Brief arithmetic/source readback of exploratory results, not trajectory audit."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'evidence/taste-development'
OUTPUT = ROOT / 'evidence/taste-continuation/20261025-v1/summary.json'
NAMES = ['attempt-04-controls', 'attempt-05-orthogonal', 'attempt-06-appetite', 'attempt-07-intake']


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def close(a, b):
    assert abs(a-b) < 1e-10, (a, b)


def main():
    reports = []
    bank = None
    for name in NAMES:
        directory = BASE / name
        result, attempt = read(directory/'results.json'), read(directory/'attempt.json')
        if bank is None:
            bank = result['bankSha256']
        assert bank == result['bankSha256'] == attempt['bankSha256']
        for path, expected in result['sourceSha256'].items():
            assert hashlib.sha256((directory/'sources'/path).read_bytes()).hexdigest() == expected
        rows = [read(p) for p in sorted((directory/'rows').glob('*.json'))]
        assert len(rows) == result['histories'] == 8 and not result['qualified']
        for row in rows:
            for arm in row['arms'].values():
                endpoint = arm['endpoint']
                assert endpoint['founders'] == 24 and abs(endpoint['accountingResidual']) < 1e-7
                close(endpoint['budgetAdjustedEnergyPerFounder'], (endpoint['physicalEnergy']-endpoint['startingEnergy']-endpoint['outstandingEnergy']+endpoint['startingDebt'])/24)
                close(endpoint['incurredEnergy'], endpoint['paidEnergy']+endpoint['outstandingEnergy'])
            for family in ['A', 'B', 'transfer']:
                probes = [probe for key, probe in row['probes'].items() if key.startswith(family+':')]
                assert len({p.get('startWorldSha256') for p in probes}) == 1
                for probe in probes:
                    assert probe['founders'] == 24
                    if not probe['skippedAllDead']:
                        assert abs(probe['endpoint']['accountingResidual']) < 1e-7
        for arm, comparison in result['controlComparisons'].items():
            effects = [r['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder']-r['arms'][arm]['endpoint']['budgetAdjustedEnergyPerFounder'] for r in rows]
            close(sum(effects)/8, comparison['mean'])
            assert sum(v > 0 for v in effects) == comparison['positive']
            assert sum(r['arms']['candidate']['endpoint']['survivors']-r['arms'][arm]['endpoint']['survivors'] for r in rows) == comparison['survivorDifference']
        probe_effects = {}
        for family in ['A', 'B', 'transfer']:
            effects = [r['probes'][family+':current']['value']-r['probes'][family+':reset']['value'] for r in rows]
            probe_effects[family] = dict(mean=sum(effects)/8, positive=sum(v > 0 for v in effects),
                survivorDifference=sum(r['probes'][family+':current']['survivors']-r['probes'][family+':reset']['survivors'] for r in rows))
            if family in result.get('retention', {}):
                retention = result['retention'][family]
                saved = [r['probes'][family+':'+family]['value']-r['probes'][family+':reset']['value'] for r in rows]
                close(probe_effects[family]['mean'], retention['retainedMean'])
                close(sum(saved)/8, retention['savedMean'])
                assert retention['descriptive95Percent'] == (retention['savedMean'] > 0 and retention['retainedMean'] >= .95*retention['savedMean'])
        reports.append(dict(attempt=name, options=attempt['learnerOptions'], survivors={arm:sum(r['arms'][arm]['endpoint']['survivors'] for r in rows) for arm in rows[0]['arms']},
            comparisons=result['controlComparisons'], acquiredA=result['acquiredA'], probes=probe_effects, retention=result.get('retention'), runtime=result['runtime'],
            developmentSignal=result['developmentSignal'], extendedDevelopmentSignal=result.get('extendedDevelopmentSignal')))
    output = dict(schema=1, passed=True, bankSha256=bank, originalFoundersPerAttempt=192, reports=reports,
        scope='Reusable development data. Brief arithmetic, captured-source integrity and paired-start readback only; no independent world trajectory audit, held-out qualification, pressure or RSI.')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open('x', encoding='utf-8') as stream:
        json.dump(output, stream, indent=2)
        stream.write('\n')
    print(json.dumps(output))


if __name__ == '__main__':
    main()
