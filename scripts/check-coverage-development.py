import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'evidence/coverage-development/20261026-v1'


def load(path):
    return json.loads(path.read_bytes())


def close(actual, expected):
    assert math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-8), (actual, expected)


def phi(own):
    raw = own['raw']
    return [1] + [raw[index] * .25 for index in [0, 1, 2, 3, 4, 10, 11, 13]] + [.25 if own['contactPresent'] else 0, raw[3] * raw[0] * .25, raw[3] * raw[13] * .25, raw[13] * .25 if own['contactPresent'] else 0]


def taste_phi(cue):
    return [1] + cue + [cue[first] * cue[second] for first in range(4) for second in range(first + 1, 4)]


def vector(actual, expected):
    assert len(actual) == len(expected)
    for left, right in zip(actual, expected):
        close(left, right)


protocol = load(BASE / 'protocol.json')
assert hashlib.sha256((ROOT / protocol['bankPath']).read_bytes()).hexdigest() == protocol['bankSha256']
for name, expected in protocol['sourceSha256'].items():
    assert hashlib.sha256((BASE / 'sources' / name).read_bytes()).hexdigest() == expected
total_decisions = total_receipts = total_memories = total_taste = 0
exposures = []
aggregate = {mode: [] for mode in ['reset', 'native-full']}
for history in protocol['histories']:
    seed = str(history['seed'])
    row = load(BASE / 'rows' / (seed + '.json'))
    candidate_records = candidate_taste = None
    candidate_counts = None
    for label, spec in row['traces'].items():
        final = load(BASE / 'finals' / (label + '.json'))
        states, pricing = final['state']['learners'], final['state']['pricing']
        probe = final['state']['probe']
        initial = None
        if probe:
            phase = 'A' if '-afterA-' in label else 'C'
            initial = load(BASE / 'anchors' / (seed + '-' + phase + '.json'))['state']['learners']
        records = dict(candidate_records) if probe else {}
        taste = dict(candidate_taste) if probe else {}
        pending, moves, paid, storage, observations = {}, {}, {}, {}, {}
        counts = {key: [0, 0, 0] for key in states}
        hasher, events = hashlib.sha256(), 0
        with (BASE / 'traces' / (label + '.jsonl')).open('rb') as stream:
            for line in stream:
                hasher.update(line)
                event = json.loads(line)
                events += 1
                if event['type'] == 'decision':
                    key = str(event['id'])
                    assert key in states
                    choice, raw = event['choice'], event['own']['raw'] if event['own'] else None
                    assert choice['move'] == choice['action'] - 1
                    assert event['outputs'][1:] == [choice['move'], 1 if choice['accept'] else -1, -1, 0]
                    assert (key, event['tick']) not in moves
                    moves[key, event['tick']] = event
                    counts[key][choice['action']] += 1
                    storage[key] = storage.get(key, 0) + event['storageBytes'] * pricing['byteEnergyPerSecond'] * .1
                    if raw is not None:
                        close(event['outputs'][0], math.tanh(2 * (raw[2] - raw[1]) + 1.8 * (raw[10] - raw[11])))
                        own = event['own']
                        assert own['agentId'] == event['id'] and own['tick'] == event['tick']
                        if key in pending and not probe:
                            previous = pending[key]
                            assert own['tick'] == previous['tick'] + 1
                            records[key, previous['tick']] = dict(action=previous['choice']['action'], phi=phi(previous['own']), nextPhi=phi(own), reward=(own['energy'] - previous['own']['energy']) / 120, terminal=False)
                        pending[key] = event
                        frozen = not states[key]['acquisition']
                        if frozen and (probe or '-unlearned' in label):
                            values = [sum(weight * feature for weight, feature in zip(weights, phi(own))) for weights in states[key]['weights']]
                            best = max(range(3), key=lambda index: (values[index], index))
                            assert choice['action'] == best
                            probability = 1.
                            if own['odorPresent']:
                                logit = math.log(3) + sum(weight * feature for weight, feature in zip(states[key]['taste']['weights'], taste_phi(own['cue']))) / math.sqrt(11)
                                probability = .05 + .9 / (1 + math.exp(-logit))
                            close(choice['feedProbability'], probability)
                    total_decisions += 1
                elif event['type'] == 'physical':
                    key = str(event['agentId'])
                    decision = moves[key, event['tick']]
                    assert decision['requestedExtra'] + 1e-10 >= event['paidExtra'] >= 0
                    paid[key] = paid.get(key, 0) + event['paidExtra']
                    total_receipts += 1
                else:
                    assert event['type'] == 'observe'
                    own = event['own']
                    key = str(own['agentId'])
                    decision = moves[key, own['tick']]
                    assert observations.get(key, own['tick'] - 1) + 1 == own['tick']
                    observations[key] = own['tick']
                    if own['terminal'] and not probe:
                        records[key, own['tick']] = dict(action=decision['choice']['action'], phi=phi(decision['own']), nextPhi=[0] * 13, reward=(own['energy'] - decision['own']['energy']) / 120, terminal=True)
                        pending.pop(key, None)
                    sensed = decision['own']
                    if decision['choice']['move'] == -1 and decision['choice']['accept'] and sensed['contactPresent'] and sensed['odorPresent'] and own['lastFood'] != 0:
                        taste[key, own['tick']] = dict(phi=taste_phi(sensed['cue']), target=int(own['lastFood'] > 0))
        assert events == spec['events'] and hasher.hexdigest() == spec['sha256']
        for key, state in states.items():
            old = initial[key] if initial else None
            old_inc = old['charge']['incurredEnergy'] if old else 0
            old_paid = old['charge']['paidEnergy'] if old else 0
            old_work = old['work']['scalarOperations'] if old and final['state']['arm'] != 'native-full' else 0
            charge = state['charge']
            close(charge['incurredEnergy'], old_inc + (state['work']['scalarOperations'] - old_work) * pricing['operationEnergy'] + storage.get(key, 0))
            close(charge['paidEnergy'], old_paid + paid.get(key, 0))
            close(charge['outstandingEnergy'], charge['incurredEnergy'] - charge['paidEnergy'])
            assert charge['operationsBilled'] == state['work']['scalarOperations']
            for record in state.get('memory', []):
                assert str(record['agentId']) == key
                expected = records[key, record['tick']]
                assert record['action'] == expected['action'] and record['terminal'] == expected['terminal']
                vector(record['phi'], expected['phi'])
                vector(record['nextPhi'], expected['nextPhi'])
                close(record['reward'], expected['reward'])
                total_memories += 1
            for record in state.get('taste', {}).get('memory', []):
                assert str(record['agentId']) == key
                expected = taste[key, record['tick']]
                vector(record['phi'], expected['phi'])
                assert record['target'] == expected['target']
                total_taste += 1
        if label == seed + '-candidate':
            candidate_records, candidate_taste, candidate_counts = records, taste, counts
            survivors = [str(fly['id']) for fly in final['world']['world']['flies']]
            covered = sum(all(count > 0 for count in counts[key]) for key in survivors)
            exposures.append(dict(seed=history['seed'], survivors=len(survivors), allThreeSpeedExposure=covered, moves=[sum(count[index] for count in counts.values()) for index in range(3)]))
            assert covered == len(survivors)
    for mode in aggregate:
        current, control = row['probes']['transfer']['current'], row['probes']['transfer'][mode]
        energy = current['budgetAdjustedEnergyPerFounder'] - control['budgetAdjustedEnergyPerFounder']
        survivors = current['survivors'] - control['survivors']
        close(row['effects'][mode]['energy'], energy)
        assert row['effects'][mode]['survivors'] == survivors
        aggregate[mode].append((energy, survivors))
result = load(BASE / 'results.json')
for mode, values in aggregate.items():
    summary = result['comparisons'][mode]
    close(summary['meanEnergy'], sum(value[0] for value in values) / 8)
    assert summary['positiveHistories'] == sum(value[0] > 0 for value in values)
    assert summary['survivorDifference'] == sum(value[1] for value in values)
assert total_decisions == total_receipts
assert not result['promisingTransfer'] and not result['qualified']
report = dict(passed=True, decisions=total_decisions, receipts=total_receipts, retainedMotorRecords=total_memories, retainedTasteRecords=total_taste, exposures=exposures,
              scope='Frozen-source hashes, all decision/receipt provenance, retained own reward/feature/label records, frozen inference, reported work/storage ledgers and statistics. Not independent SGD, encoder-size or physics reconstruction; source-level operation completeness remains separate.')
print(json.dumps(report))
