import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'evidence/alternative-target/20261026-v1'


def load(path):
    return json.loads(path.read_text())


def close(actual, expected):
    assert math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-8), (actual, expected)


def encoded(value):
    if value is None or isinstance(value, bool):
        return 1
    if isinstance(value, (float, int)):
        assert math.isfinite(value)
        return 8
    if isinstance(value, str):
        return 4 + len(value.encode())
    if isinstance(value, list):
        return 4 + sum(map(encoded, value))
    return 4 + sum(4 + len(key.encode()) + encoded(item) for key, item in value.items())


protocol = load(BASE / 'protocol.json')
for name, expected in protocol['sourceSha256'].items():
    assert hashlib.sha256((BASE / 'sources' / name).read_bytes()).hexdigest() == expected
effects = {name: [] for name in ['native', 'bare-full']}
decisions = 0
for source in protocol['inputs']:
    for field in ['anchor', 'bare']:
        assert hashlib.sha256((ROOT / source[field]).read_bytes()).hexdigest() == source[field + 'Sha256']
    anchor = load(ROOT / source['anchor'])
    row = load(BASE / 'rows' / (str(source['history']['seed']) + '.json'))
    for arm in ['rate', 'native']:
        final = load(BASE / 'finals' / (str(source['history']['seed']) + '-' + arm + '.json'))
        controllers = final['state']['controllers']
        totals = dict(decisions=0, alternativeRecommendations=0, alternativeExecuted=0, intake=0., physicalCosts=0.)
        counts = {key: 0 for key in controllers}
        paid = {key: 0. for key in controllers}
        trace = BASE / 'traces' / (str(source['history']['seed']) + '-' + arm + '.jsonl')
        hasher = hashlib.sha256()
        with trace.open('rb') as stream:
            for line in stream:
                hasher.update(line)
                event = json.loads(line)
                key = str(event['id'])
                state = controllers[key]
                rates = []
                for amount, distance, cosine, sine in event['targets']:
                    travel = max(0., distance - 15) / state['speed']
                    rotation = abs(math.atan2(sine, cosine)) / 2.8 if distance > 15 else 0.
                    rates.append(amount / (travel + rotation + amount / 8 + .1))
                for actual, expected in zip(event['rates'], rates):
                    close(actual, expected)
                choice = int(rates[1] > rates[0])
                assert event['choice'] == choice
                selected = choice if arm == 'rate' else 0
                assert event['selected'] == selected
                raw = event['raw']
                sine = raw[2] - raw[1] if selected == 0 else event['targets'][1][3]
                close(event['outputs'][0], math.tanh(2 * sine + 1.8 * (raw[10] - raw[11])))
                assert event['outputs'][1:] == [1, 1, -1, 0]
                receipt = event['receipt']
                assert receipt['agentId'] == event['id'] and receipt['tick'] == event['tick']
                counts[key] += 1
                paid[key] += receipt['paidExtra']
                totals['decisions'] += 1
                totals['alternativeRecommendations'] += choice
                totals['alternativeExecuted'] += selected
                totals['intake'] += receipt['beneficialEaten']
                totals['physicalCosts'] += receipt['cost']
        assert hasher.hexdigest() == row['traceHashes'][arm]
        pricing = final['state']['pricing']
        for key, state in controllers.items():
            old = anchor['state']['learners'][key]
            old_charge, charge = old['charge'], state['charge']
            old_due = (old['work']['scalarOperations'] - old_charge['operationsBilled']) * pricing['operationEnergy']
            due = state['work']['scalarOperations'] * pricing['operationEnergy']
            storage = encoded(state) * pricing['byteEnergyPerSecond'] * .1 * counts[key]
            close(charge['incurredEnergy'], old_charge['incurredEnergy'] + old_due + due + storage)
            close(charge['paidEnergy'], old_charge['paidEnergy'] + paid[key])
            close(charge['outstandingEnergy'], charge['incurredEnergy'] - charge['paidEnergy'])
            assert charge['operationsBilled'] == state['work']['scalarOperations']
        endpoint = row['arms'][arm]
        for field, expected in totals.items():
            close(endpoint['statistics'][field], expected)
        close(endpoint['physicalEnergy'], sum(fly['energy'] for fly in final['world']['world']['flies']))
        assert endpoint['survivors'] == len(final['world']['world']['flies'])
        close(endpoint['controllerBytes'], sum(encoded(state) for state in controllers.values()))
        close(endpoint['budgetAdjustedEnergyPerFounder'], (endpoint['physicalEnergy'] - endpoint['startingEnergy'] - endpoint['outstandingEnergy'] + endpoint['startingDebt']) / endpoint['founders'])
        decisions += totals['decisions']
    for name in effects:
        effect = dict(energy=row['arms']['rate']['budgetAdjustedEnergyPerFounder'] - row['arms'][name]['budgetAdjustedEnergyPerFounder'], survivors=row['arms']['rate']['survivors'] - row['arms'][name]['survivors'])
        assert effect == row['effects'][name]
        effects[name].append(effect)
result = load(BASE / 'results.json')
for name, rows in effects.items():
    comparison = result['comparisons'][name]
    close(comparison['meanEnergy'], sum(row['energy'] for row in rows) / 8)
    assert comparison['positiveHistories'] == sum(row['energy'] > 0 for row in rows)
    assert comparison['survivorDifference'] == sum(row['survivors'] for row in rows)
assert not result['promisingHeadroom'] and not result['qualified']
print(json.dumps(dict(passed=True, decisions=decisions, scope='Independent trace, fixed-rate, receipt and fixed-shape charge readback; not independent physics replay.')))
