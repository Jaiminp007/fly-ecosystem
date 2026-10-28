"""Independent read-only selection, actuator, hash and endpoint checks; no simulation."""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'evidence/escape-commitment/20261025-v1'


def read(path):
    return json.loads(path.read_text(encoding='utf8'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def close(first, second):
    assert math.isclose(first, second, rel_tol=1e-10, abs_tol=1e-8), (first, second)


protocol = read(BASE / 'protocol.json')
result = read(BASE / 'results.json')
assert len(protocol['inputs']) == result['histories'] == 8
assert protocol['commitmentTicks'] == math.ceil(math.pi / .28) == 12
for name, expected in protocol['sourceSha256'].items():
    assert sha(BASE / 'sources' / name) == expected
rows, counts = [], {'events': 0, 'actualTurns': 0, 'priorCollisionEvents': 0, 'deepInteriorEvents': 0}
for source in protocol['inputs']:
    assert sha(ROOT / source['anchor']) == source['sha256']
    seed = str(source['history']['seed'])
    row, traces = read(BASE / 'rows' / (seed + '.json')), read(BASE / 'traces' / (seed + '.json'))
    rows.append(row)
    prior, earliest = {}, None
    grouped = {}
    for record in traces['reference']:
        grouped.setdefault(record['decision'], []).append(record)
        raw = record['raw']
        close(record['escape']['executedTurn'], math.tanh(2 * (raw[2] - raw[1]) + 1.8 * (raw[10] - raw[11])))
        assert record['executedMove'] == record['escape']['eat'] == 1
    for decision, records in sorted(grouped.items()):
        eligible = sorted(record['id'] for record in records if len(prior.get(record['id'], [])) >= 16
                          and all(item['raw'][3] > 0 and item['raw'][13] <= 0 for item in prior[record['id']][-16:])
                          and any(item['raw'][10] > 0 or item['raw'][11] > 0 for item in prior[record['id']][-4:]))
        if earliest is None and 17 <= decision <= 112 and eligible:
            earliest = {'id': eligible[0], 'decision': decision}
        for record in records:
            prior.setdefault(record['id'], []).append(record)
    selection = row['selection']
    assert (selection is None) == (earliest is None)
    if selection:
        assert all(selection[key] == value for key, value in earliest.items())
        event = read(BASE / 'checkpoints' / (seed + '.json'))
        assert event['id'] == selection['id'] and event['decision'] == selection['decision']
        assert event['checkpoint']['elapsed'] == selection['decision'] - 1
        preceding = [record for record in traces['reference'] if record['id'] == selection['id'] and record['decision'] < selection['decision']][-16:]
        collisions = sum(record['collision'] for record in preceding)
        assert selection['precedingCollisions'] == collisions
        focal = [record for record in traces['commitment'] if record['id'] == selection['id']]
        for index, record in enumerate(focal):
            assert record['escape']['active'] == (index < 12)
            raw = record['raw']
            expected = 1 if index < 12 else math.tanh(2 * (raw[2] - raw[1]) + 1.8 * (raw[10] - raw[11]))
            close(record['escape']['executedTurn'], expected)
            assert record['executedMove'] == record['escape']['eat'] == 1
        counts['events'] += 1
        counts['actualTurns'] += min(12, len(focal))
        counts['priorCollisionEvents'] += collisions > 0
        counts['deepInteriorEvents'] += selection['deepInteriorTarget']
        for horizon in row['horizons'].values():
            effect = horizon['effect']
            close(effect['energy'] * 24, effect['focalBudget'] + effect['otherBodiesBudget'])
    for name in ['commitment', 'matched-full']:
        endpoint = row['arms'][name]['endpoint']
        assert endpoint['founders'] == 24 and abs(endpoint['accountingResidual']) < 1e-7
        close(endpoint['budgetAdjustedEnergyPerFounder'], (endpoint['physicalEnergy'] - endpoint['startingEnergy'] - endpoint['outstandingEnergy'] + endpoint['startingDebt']) / 24)
        close(endpoint['incurredEnergy'] - endpoint['paidEnergy'], endpoint['outstandingEnergy'])
    active = row['arms']['commitment']['endpoint']
    for name in ['matched-full', 'bare-full']:
        arm = row['arms'][name]
        endpoint = arm.get('endpoint', arm)
        value = arm['value'] if name == 'bare-full' else endpoint['budgetAdjustedEnergyPerFounder']
        close(row['effects'][name]['energy'], active['budgetAdjustedEnergyPerFounder'] - value)
        assert row['effects'][name]['survivors'] == active['survivors'] - arm.get('survivors', endpoint['survivors'])
    assert row['startWorldSha256'] == row['arms']['bare-full']['startWorldSha256']
for name, comparison in result['comparisons'].items():
    effects = [row['effects'][name] for row in rows]
    close(comparison['meanEnergy'], sum(effect['energy'] for effect in effects) / 8)
    assert comparison['positive'] == sum(effect['energy'] > 0 for effect in effects)
    assert comparison['survivorDifference'] == sum(effect['survivors'] for effect in effects)
assert result['events'] == counts['events']
assert result['promising'] == all(comparison['meanEnergy'] > 0 and comparison['positive'] >= 6 and comparison['survivorDifference'] >= 0 for comparison in result['comparisons'].values())
report = {'schema': 1, 'passed': True, 'counts': counts, 'scriptSha256': sha(Path(__file__)),
          'resultsSha256': sha(BASE / 'results.json'), 'scope': 'Read-only independent hash/selection/actuator/arithmetic checks, not full numerical learner reconstruction or qualification.'}
with (BASE / 'readback.json').open('x', encoding='utf8') as handle:
    json.dump(report, handle, indent=2)
    handle.write('\n')
print(json.dumps(report))
