import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'evidence/overlap-harvest/20261026-v1'
DIAG = ROOT / 'evidence/overlap-diagnosis/20261026-v1'


def load(path):
    return json.loads(path.read_bytes())


def close(actual, expected):
    assert math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-8), (actual, expected)


def encoded(value):
    if value is None or isinstance(value, bool):
        return 1
    if isinstance(value, (int, float)):
        assert math.isfinite(value)
        return 8
    if isinstance(value, str):
        return 4 + len(value.encode())
    if isinstance(value, list):
        return 4 + sum(map(encoded, value))
    return 4 + sum(4 + len(key.encode()) + encoded(item) for key, item in value.items())


def sources(base, protocol):
    for name, expected in protocol['sourceSha256'].items():
        assert hashlib.sha256((base / 'sources' / name).read_bytes()).hexdigest() == expected
    for source in protocol['inputs']:
        for field in ['anchor', 'bare']:
            assert hashlib.sha256((ROOT / source[field]).read_bytes()).hexdigest() == source[field + 'Sha256']


def audit(final, trace, expected_hash, anchor):
    states, pricing = final['state']['controllers'], final['state']['pricing']
    totals = dict(decisions=0, midpointRecommendations=0, midpointExecuted=0, intake=0., physicalCosts=0.)
    paid, storage, pending, receipts = {}, {}, {}, 0
    hasher = hashlib.sha256()
    with trace.open('rb') as stream:
        for line in stream:
            hasher.update(line)
            event = json.loads(line)
            if event['type'] == 'decision':
                body = str(event['id'])
                points, score, point, pair = event['points'], 0., [0., 0.], [-1, -1]
                native = point
                for forward, lateral, amount in points:
                    assert amount > .06
                    value = amount / (math.hypot(forward, lateral) + 20)
                    if value > score:
                        score, point = value, [forward, lateral]
                native = point
                for first, left in enumerate(points):
                    for second in range(first + 1, len(points)):
                        right = points[second]
                        if math.hypot(left[0] - right[0], left[1] - right[1]) > 30:
                            continue
                        midpoint = [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2]
                        value = (left[2] + right[2]) / (math.hypot(*midpoint) + 20)
                        if value > score:
                            score, point, pair = value, midpoint, [first, second]
                assert pair == event['pair']
                for actual, expected in zip(event['point'], point):
                    close(actual, expected)
                close(event['score'], score)
                midpoint = states[body]['mode'] == 1 and pair[0] >= 0
                assert event['midpoint'] == midpoint
                raw = event['raw']
                distance = math.hypot(*point)
                sine = point[1] / distance if midpoint and distance > 0 else raw[2] - raw[1]
                close(event['outputs'][0], math.tanh(2 * sine + 1.8 * (raw[10] - raw[11])))
                assert event['outputs'][1:] == [1, 1, -1, 0]
                native_distance = math.hypot(*native)
                if native_distance > 0:
                    close(native[0] / native_distance, raw[0])
                    close(native[1] / native_distance, raw[2] - raw[1])
                expected_bytes = encoded(states[body]) + 28 * (len(points) - len(states[body]['points']))
                assert event['storageBytes'] == expected_bytes
                storage[body] = storage.get(body, 0) + expected_bytes * pricing['byteEnergyPerSecond'] * .1
                assert body not in pending
                pending[body] = event
                totals['decisions'] += 1
                totals['midpointRecommendations'] += pair[0] >= 0
                totals['midpointExecuted'] += midpoint
            else:
                assert event['type'] == 'physical'
                body = str(event['agentId'])
                decision = pending.pop(body)
                assert event['tick'] == decision['tick']
                assert 0 <= event['paidExtra'] <= decision['requestedExtra'] + 1e-10
                paid[body] = paid.get(body, 0) + event['paidExtra']
                totals['intake'] += event['beneficialEaten']
                totals['physicalCosts'] += event['cost']
                receipts += 1
    assert hasher.hexdigest() == expected_hash and not pending and receipts == totals['decisions']
    for body, state in states.items():
        old = anchor['state']['learners'][body]
        old_charge, charge = old['charge'], state['charge']
        old_due = (old['work']['scalarOperations'] - old_charge['operationsBilled']) * pricing['operationEnergy']
        close(charge['incurredEnergy'], old_charge['incurredEnergy'] + old_due + state['work']['scalarOperations'] * pricing['operationEnergy'] + storage.get(body, 0))
        close(charge['paidEnergy'], old_charge['paidEnergy'] + paid.get(body, 0))
        close(charge['outstandingEnergy'], charge['incurredEnergy'] - charge['paidEnergy'])
        assert charge['operationsBilled'] == state['work']['scalarOperations']
    for field, expected in totals.items():
        close(final['state']['statistics'][field], expected)
    return receipts


protocol, diagnostic = load(BASE / 'protocol.json'), load(DIAG / 'protocol.json')
sources(BASE, protocol)
sources(DIAG, diagnostic)
decisions = intervention_decisions = 0
effects = {name: [] for name in ['native', 'bare-full']}
selected = []
for source in protocol['inputs']:
    seed = str(source['history']['seed'])
    anchor, row = load(ROOT / source['anchor']), load(BASE / 'rows' / (seed + '.json'))
    living = {}
    for arm in ['overlap', 'native']:
        final = load(BASE / 'finals' / (seed + '-' + arm + '.json'))
        assert all(state['mode'] == int(arm == 'overlap') for state in final['state']['controllers'].values())
        decisions += audit(final, BASE / 'traces' / (seed + '-' + arm + '.jsonl'), row['traceHashes'][arm], anchor)
        endpoint = row['arms'][arm]
        living[arm] = {fly['id'] for fly in final['world']['world']['flies']}
        assert endpoint['survivors'] == len(living[arm])
        close(endpoint['physicalEnergy'], sum(fly['energy'] for fly in final['world']['world']['flies']))
    for body in anchor['state']['founderIds']:
        if (body in living['overlap']) != (body in living['native']):
            selected.append(dict(seed=source['history']['seed'], id=body, classification='lost' if body in living['native'] else 'saved'))
    for name in effects:
        energy = row['arms']['overlap']['budgetAdjustedEnergyPerFounder'] - row['arms'][name]['budgetAdjustedEnergyPerFounder']
        survival = row['arms']['overlap']['survivors'] - row['arms'][name]['survivors']
        close(row['effects'][name]['energy'], energy)
        assert row['effects'][name]['survivors'] == survival
        effects[name].append((energy, survival))
assert selected == diagnostic['cases']
for case in selected:
    source = next(source for source in protocol['inputs'] if source['history']['seed'] == case['seed'])
    for background in ['overlap', 'native']:
        label = str(case['seed']) + '-' + str(case['id']) + '-background-' + background
        final, row = load(DIAG / 'finals' / (label + '.json')), load(DIAG / 'rows' / (label + '.json'))
        for body, state in final['state']['controllers'].items():
            assert state['mode'] == (int(background == 'native') if int(body) == case['id'] else int(background == 'overlap'))
        intervention_decisions += audit(final, DIAG / 'traces' / (label + '.jsonl'), row['traceSha256'], load(ROOT / source['anchor']))
        focal = next((fly for fly in final['world']['world']['flies'] if fly['id'] == case['id']), None)
        assert row['focalAlive'] == (focal is not None)
        close(row['focalEnergy'], focal['energy'] if focal else 0)
result = load(BASE / 'results.json')
for name, values in effects.items():
    summary = result['comparisons'][name]
    close(summary['meanEnergy'], sum(value[0] for value in values) / 8)
    assert summary['positiveHistories'] == sum(value[0] > 0 for value in values)
    assert summary['survivorDifference'] == sum(value[1] for value in values)
assert not result['promisingHeadroom'] and not result['qualified']
print(json.dumps(dict(passed=True, factualDecisions=decisions, focalInterventionDecisions=intervention_decisions, cases=len(selected), scope='Independent full midpoint selection, native/virtual commands, dynamic encoded-list storage and reported-work ledgers, receipts, survivor-selected schedule, focal interventions and comparisons. Not independent spatial-query operation counts or physical dynamics.')))
