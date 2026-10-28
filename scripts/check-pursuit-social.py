"""Independent factual totals, episode checks and frozen predictor evaluation."""
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CENSUS = ROOT / 'evidence/pursuit-census/20261025-v1'
SOCIAL = ROOT / 'evidence/social-yield/20261025-v1'


def read(path):
    return json.loads(path.read_bytes())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def close(first, second):
    assert math.isclose(first, second, rel_tol=1e-9, abs_tol=1e-8), (first, second)


def distribution(values):
    values = sorted(values)
    return dict(count=len(values), median=values[len(values)//2] if values else None,
                p90=values[int(len(values)*.9)] if values else None, maximum=values[-1] if values else None)


for directory in [CENSUS, SOCIAL]:
    protocol = read(directory / 'protocol.json')
    for name, expected in protocol['sourceSha256'].items():
        assert sha(directory / 'sources' / name) == expected

census_protocol, census_result = read(CENSUS / 'protocol.json'), read(CENSUS / 'results.json')
social_protocol, social_result = read(SOCIAL / 'protocol.json'), read(SOCIAL / 'results.json')
fields = ['ticks', 'path', 'intake', 'toxinDamage', 'physicalCosts', 'movementCosts', 'rejectedMoves', 'boundaryClips']
rows, streaks = [], defaultdict(list)
for source in census_protocol['inputs']:
    seed = str(source['history']['seed'])
    row, social = read(CENSUS / 'rows' / (seed + '.json')), read(SOCIAL / 'rows' / (seed + '.json'))
    episodes = read(CENSUS / 'episodes' / (seed + '.json'))
    indexed = {('transfer' if episode['phase'] == 'transfer' else 'acquisition', episode['episodeId']): episode for episode in episodes}
    seen, totals, transfers, pending_streaks = {}, defaultdict(lambda: defaultdict(float)), defaultdict(list), {}
    train_counts, moves = defaultdict(int), defaultdict(set)
    hash_state = hashlib.sha256()
    with (CENSUS / 'steps' / (seed + '.jsonl')).open('rb') as handle:
        for line in handle:
            hash_state.update(line)
            record = json.loads(line)
            phase, identity = record['phase'], record['id']
            key = ('transfer' if phase == 'transfer' else 'acquisition', record['episodeId'])
            episode = indexed[key]
            assert episode['id'] == identity and episode['phase'] == phase
            assert episode['target'] == record['target'] or (episode['target'] and record['target'] and all(episode['target'][name] == record['target'][name] for name in ['index', 'x', 'y', 'deepInterior']))
            aggregate = seen.setdefault(key, defaultdict(float))
            aggregate['ticks'] += 1
            for name, field in [('path', 'displacement'), ('intake', 'intake'), ('toxinDamage', 'toxinDamage'), ('physicalCosts', 'cost'), ('movementCosts', 'movementCost'), ('rejectedMoves', 'collision'), ('boundaryClips', 'boundaryClip')]:
                aggregate[name] += record[field]
            previous = pending_streaks.get(identity)
            signature = (phase, record['episodeId'])
            if previous and (previous['signature'] != signature or record['intake'] > 0):
                streaks[previous['phase']].append(previous['ticks'])
                del pending_streaks[identity]
            if record['intake'] <= 0 and record['target']:
                current = pending_streaks.setdefault(identity, dict(signature=signature, phase=phase, ticks=0))
                current['ticks'] += 1
            if phase in ['A', 'B', 'C']:
                train_counts[(identity, phase)] += 1
                moves['acquisition'].add(record['outputs'][1])
            if phase == 'transfer':
                transfers[identity].append(record)
                moves['transfer'].add(record['outputs'][1])
    assert hash_state.hexdigest() == row['stepsSha256']
    for pending in pending_streaks.values():
        streaks[pending['phase']].append(pending['ticks'])
    assert set(seen) == set(indexed)
    for key, aggregate in seen.items():
        episode = indexed[key]
        for field in fields:
            close(aggregate[field], episode[field])
            totals[episode['phase']][field] += aggregate[field]
    for phase, sums in totals.items():
        for field, value in sums.items():
            close(value, row['phases'][phase]['all'][field])
    assert social['support']['acquisitionMoves'] == sorted(moves['acquisition'])
    assert social['support']['transferMoves'] == sorted(moves['transfer'])
    scored = defaultdict(lambda: defaultdict(float))
    for identity in range(1, 25):
        body = social['bodies'][str(identity)]
        expected_training = sum(max(0, train_counts[(identity, phase)] - 7) for phase in ['A', 'B', 'C'])
        assert body['trainingSamples'] == expected_training
        records = transfers[identity]
        assert body['transferSamples'] == max(0, len(records) - 7)
        assert body['models']['food']['weights'] == body['models']['blind']['weights'][:13]
        assert body['models']['blind']['weights'][13:] == [0]*5
        for index in range(max(0, len(records) - 7)):
            record = records[index]
            label = int(any(item['intake'] > 0 for item in records[index:index+8]))
            base = [1] + [record['raw'][position] for position in [0, 1, 2, 3, 4, 5, 10, 11, 13]] + record['outputs'][:3]
            current_social = [record['raw'][position] for position in [6, 7, 8, 9, 12]]
            delayed = [records[index-32]['raw'][position] for position in [6, 7, 8, 9, 12]] if index >= 32 else [0]*5
            for mode in ['food', 'social', 'blind', 'delayed', 'prevalence']:
                features = [1] if mode == 'prevalence' else base if mode == 'food' else base + ([0]*5 if mode == 'blind' else delayed if mode == 'delayed' else current_social)
                weights = body['models'][mode]['weights']
                assert len(weights) == len(features)
                probability = 1/(1+math.exp(-max(-30, min(30, sum(weight*feature for weight, feature in zip(weights, features))))))
                scored[mode]['samples'] += 1
                scored[mode]['positives'] += label
                scored[mode]['brier'] += (probability-label)**2
                scored[mode]['logLoss'] += -label*math.log(probability)-(1-label)*math.log(1-probability)
        for mode, model in body['models'].items():
            dimension = len(model['weights'])
            assert model['updates'] == expected_training
            assert model['scalarOperations'] == expected_training*(10*dimension+6)+body['transferSamples']*(2*dimension+5)
    for mode, metrics in scored.items():
        for field in ['samples', 'positives']:
            assert metrics[field] == social['metrics'][mode][field]
        for field in ['brier', 'logLoss']:
            close(metrics[field]/metrics['samples'], social['metrics'][mode][field])
    rows.append(social)
for mode, losses in social_result['comparisons'].items():
    for loss, comparison in losses.items():
        effects = [row['metrics'][mode][loss]-row['metrics']['social'][loss] for row in rows]
        for first, second in zip(effects, comparison['effects']):
            close(first, second)
        close(sum(effects)/8, comparison['meanImprovement'])
        assert sum(effect > 0 for effect in effects) == comparison['positiveHistories']
assert social_result['promisingInformation'] == all(loss['meanImprovement'] > 0 and loss['positiveHistories'] >= 6 for mode in ['food', 'blind', 'delayed'] for loss in social_result['comparisons'][mode].values())
report = dict(schema=1, passed=True, histories=len(rows), noIntakeSameTargetStreakTicks={phase: distribution(values) for phase, values in streaks.items()},
              scriptSha256=sha(Path(__file__)), censusResultsSha256=sha(CENSUS / 'results.json'), socialResultsSha256=sha(SOCIAL / 'results.json'),
              scope='Independent complete-tape episode arithmetic, label timing, frozen-model predictions/losses, work formulas and comparisons. Not an independent reconstruction of SGD training updates or causal action headroom.')
with (SOCIAL / 'readback.json').open('x', encoding='utf8') as handle:
    json.dump(report, handle, indent=2)
    handle.write('\n')
print(json.dumps(report))
