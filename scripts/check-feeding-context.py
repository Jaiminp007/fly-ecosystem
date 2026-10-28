import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'evidence/feeding-context/20261026-v1'
MODES = ['raw', 'context', 'delayed']


def load(path):
    return json.loads(path.read_bytes())


def close(actual, expected):
    assert math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-12), (actual, expected)


def features(own, probability, delayed, mode):
    raw = own['raw']
    base = [1] + [raw[index] * .25 for index in [0, 1, 2, 3, 4, 10, 11, 13]] + [.25 if own['contactPresent'] else 0, raw[3] * raw[0] * .25, raw[3] * raw[13] * .25, raw[13] * .25 if own['contactPresent'] else 0]
    context = 2 * (delayed if mode == 'delayed' else probability) - 1
    return base if mode == 'raw' else base + [value * context for value in base]


protocol = load(BASE / 'protocol.json')
for name, expected in protocol['sourceSha256'].items():
    assert hashlib.sha256((BASE / 'sources' / name).read_bytes()).hexdigest() == expected
training = scoring = 0
effects = {family: {mode: [] for mode in ['raw', 'delayed']} for family in ['C', 'transfer']}
for source in protocol['inputs']:
    seed = str(source['history']['seed'])
    saved = load(BASE / 'models' / (seed + '.json'))
    row = load(BASE / 'rows' / (seed + '.json'))
    weights, delayed, updates, work = {}, {}, {}, {}
    stats = {family: {mode: [0, 0.] for mode in MODES} for family in ['C', 'transfer']}
    for key, family in [('acquisition', 'C'), ('transfer', 'transfer')]:
        pending = {}
        prediction_path = BASE / 'predictions' / (seed + '-' + family + '.jsonl')
        assert hashlib.sha256(prediction_path.read_bytes()).hexdigest() == row['predictionHashes'][family]
        with prediction_path.open() as predictions:
            def complete(previous, energy, terminal):
                global training, scoring
                own = previous['own']
                body = str(own['agentId'])
                target = (energy - own['energy']) / 120
                fit = key == 'acquisition' and own['tick'] <= 1024
                evaluation = None if fit else json.loads(next(predictions))
                if evaluation:
                    assert evaluation['own'] == own
                    assert evaluation['agentId'] == own['agentId'] and evaluation['tick'] == own['tick']
                    assert evaluation['action'] == previous['choice']['action'] and evaluation['terminal'] == terminal
                    close(evaluation['target'], target)
                    close(evaluation['probability'], previous['choice']['feedProbability'])
                    close(evaluation['delayedProbability'], previous['previousProbability'])
                for mode in MODES:
                    phi = features(own, previous['choice']['feedProbability'], previous['previousProbability'], mode)
                    selected = weights[body][mode][previous['choice']['action']]
                    predicted = sum(weight * feature for weight, feature in zip(selected, phi))
                    work[body][mode] += 2 * len(phi)
                    if fit:
                        denominator = 1.
                        for feature in phi:
                            denominator += feature * feature
                        step = .1 * (target - predicted) / denominator
                        for index, feature in enumerate(phi):
                            selected[index] = max(-8., min(8., selected[index] + step * feature))
                        work[body][mode] += 6 * len(phi) + 3
                        updates[body][mode] += 1
                    else:
                        error = (predicted - target) ** 2
                        close(evaluation['predictions'][mode]['prediction'], predicted)
                        close(evaluation['predictions'][mode]['squaredError'], error)
                        stats[family][mode][0] += 1
                        stats[family][mode][1] += error
                if fit:
                    training += 1
                else:
                    scoring += 1
            hasher = hashlib.sha256()
            with (ROOT / source[key]).open('rb') as stream:
                for line in stream:
                    hasher.update(line)
                    event = json.loads(line)
                    if event['type'] == 'decision':
                        body = str(event['id'])
                        if body not in weights:
                            weights[body] = {mode: [[0.] * (13 if mode == 'raw' else 26) for action in range(3)] for mode in MODES}
                            updates[body] = {mode: 0 for mode in MODES}
                            work[body] = {mode: 0 for mode in MODES}
                        if body in pending:
                            assert event['tick'] == pending[body]['tick'] + 1
                            complete(pending[body], event['own']['energy'], False)
                        event['previousProbability'] = delayed.get(body, .725)
                        pending[body] = event
                        delayed[body] = event['choice']['feedProbability']
                    elif event['type'] == 'observe' and event['own']['terminal']:
                        body = str(event['own']['agentId'])
                        complete(pending.pop(body), event['own']['energy'], True)
            assert hasher.hexdigest() == source[key + 'Sha256']
            assert next(predictions, None) is None
        for mode in MODES:
            expected = row['statistics'][family][mode]
            assert stats[family][mode][0] == expected['count']
            close(stats[family][mode][1], expected['squaredError'])
            close(stats[family][mode][1] / stats[family][mode][0], expected['mse'])
        for mode in ['raw', 'delayed']:
            effects[family][mode].append(row['statistics'][family]['context']['mse'] - row['statistics'][family][mode]['mse'])
    for body in weights:
        for mode in MODES:
            for actual, expected in zip(weights[body][mode], saved[body][mode]['weights']):
                for left, right in zip(actual, expected):
                    close(left, right)
            assert updates[body][mode] == saved[body][mode]['updates'] == row['trainingCounts'][body]
            assert work[body][mode] == saved[body][mode]['scalarOperations']
            assert saved[body][mode]['frozen']
    assert row['scalarOperations'] == sum(sum(values.values()) for values in work.values())
result = load(BASE / 'results.json')
for family, modes in effects.items():
    for mode, differences in modes.items():
        summary = result['comparisons'][family][mode]
        close(summary['meanDifference'], sum(differences) / 8)
        assert summary['improvedHistories'] == sum(value < 0 for value in differences)
assert not result['promisingInformation'] and not result['qualified']
print(json.dumps(dict(passed=True, trainingTransitions=training, evaluationTransitions=scoring, scope='Independent full own A/B SGD, frozen C/transfer predictions, source/input/output hashes, labels, per-founder weights, predictor work and effect statistics. No policy or physical gain.')))
