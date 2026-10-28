"""Independent fixed-protocol effects, exact-count guards and inference."""
import math
from scipy.stats import t

ARMS = ['candidate','originalValue','contactActor','originalActor','lambda0','frozen','reset',
        'cueBlind','shuffled','nullCandidate','nullBlind','incumbent','acceptCruise','refuseCruise',
        'acceptStationary','refuseStationary','random']
CONTROLS = [arm for arm in ARMS if arm not in ('candidate','nullCandidate','nullBlind')]
SPECS = [('A','A'),('A','B'),('A','C'),('A','reset'),('B','A'),('B','B'),('B','C'),('B','reset'),('C','B'),('C','C')]+[
    ('transfer',v) for v in ['A','C','reset','accept','acceptStationary']]
CONTRASTS = [dict(id=f'sequence-{arm}',main=arm) for arm in CONTROLS]+[
    dict(id='B-acquisition',terms=[['B:B',1],['B:A',-1]]),
    dict(id='C-acquisition',terms=[['C:C',1],['C:B',-1]]),
    dict(id='A-initial-skill',terms=[['A:A',1],['A:reset',-1]]),
    dict(id='B-initial-skill',terms=[['B:B',1],['B:reset',-1]]),
    dict(id='A-retention',terms=[['A:C',1],['A:A',-.95],['A:reset',-.05]]),
    dict(id='B-retention',terms=[['B:C',1],['B:B',-.95],['B:reset',-.05]])]+[
    dict(id=f'transfer-{v}',terms=[['transfer:C',1],[f'transfer:{v}',-1]]) for v in ['reset','accept','acceptStationary']]+[
    dict(id='functional-interference',pressure='aInterference'),dict(id='physical-interference',pressure='aNetFoodInterference'),
    dict(id='null-equivalence',null=True)]
SURVIVAL = [dict(id=f'sequence-{arm}',main=arm) for arm in CONTROLS]+[
    dict(id=c['id'],pair=['A:C','A:A'] if c['id']=='A-retention' else ['B:C','B:B'] if c['id']=='B-retention' else [key for key,_ in c['terms']])
    for c in CONTRASTS if 'terms' in c]
REFERENCE = dict(founders=24,parameters=dict(capacity=128,neighbors=8,bandwidth=.25,maxDistance=.6,exploration=.1,
    replacement='reservoir',featureMode='mixed',decisionTicks=8,creditTicks=8,discount=.99,returnMode='td',actuator='move',
    turnGain=.25,moveGain=2,moveMode='levels',slowSpeed=.15,fastSpeed=.5,memoryLearning=True,neuralLearning=True,
    memoryEnergyPerRecordSecond=1e-5,lookupEnergyPerRecord=5e-6),
    actorParameters=dict(learningScale=4.148153974110893,traceRetention=.9920990378910495,eligibilityDecay=.7,exploration=.3))


def close(actual, expected, name='statistic'):
    assert math.isfinite(actual) and math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-12), (name, actual, expected)


def validate_protocol(p):
    assert p['experiment'] == 'fixed-contact-value-development-v1' and p['schema'] == 1
    assert p['arms'] == ARMS and [(v['family'], v['version']) for v in p['probes']] == SPECS
    assert p['contrasts'] == CONTRASTS and p['survival'] == SURVIVAL
    assert p['reference']['founders'] == 24 and p['retentionFraction'] == .95 and p['interferenceFraction'] == .05
    assert p['resetConstructionNeutral'] is True and p['nullMargin'] == .5 and p['alphaPerTest'] == .05/26
    assert p['budget'] == dict(developmentWorlds=264, confirmationWorlds=528, totalWorlds=792,
        worldsPerHistory=33, worldStepsPerHistory=34560, totalCollectionWorldSteps=829440,
        maxPolicyScalarOperations=400000000000, maxCompressedTraceBytesPerHistory=536870912,
        maxUncompressedTraceBytesPerHistory=8589934592, maxEvidenceBytes=17179869184,
        maxCollectionWallSeconds=86400, maxCollectionCpuMicroseconds=86400000000,
        maxReplayWallSeconds=86400, maxReplayCpuMicroseconds=86400000000,
        maxIndependentAuditWallSeconds=172800, maxIndependentAuditCpuSeconds=172800)
    assert p['reference'] == REFERENCE and p['requireNonempty'] is True
    assert p['pricing'] == dict(operationEnergy=5e-6/17,byteEnergyPerSecond=1e-5/(17*8))
    assert p['phases'] == [dict(id='A',kind='stable',ticks=512,nutrient=.4,shiftEvery=0),
        dict(id='B',kind='moving',ticks=512,nutrient=.4,shiftEvery=128),
        dict(id='C',kind='scarce',ticks=512,nutrient=.2,shiftEvery=0),
        dict(id='return-A',kind='stable',ticks=256,nutrient=.4,shiftEvery=0)]
    assert p['learner'] == dict(mechanism='tick-linear-expected-sarsa-v1',dimensions=71,actions=4,
        epsilon=.1,discount=.99,**{'lambda':.9},updateRate=.05,replayRate=.01,capacity=64,recent=16,weightBound=4)
    seeds = []
    for phase, n in [('development', 8), ('confirmation', 16)]:
        assert len(p[phase+'Histories']) == n
        close(p['critical'][phase], float(t.ppf(1-.05/26, n-1)), 'directional critical')
        close(p['equivalenceCritical'][phase], float(t.ppf(1-.05/52, n-1)), 'equivalence critical')
        close(p['descriptiveCritical'][phase], float(t.ppf(.975, n-1)), 'descriptive critical')
        for h in p[phase+'Histories']:
            assert set(h) == {'seed', 'cueSeed', 'resourceSeeds', 'shuffleSeed', 'nullSeed', 'probeSeeds'}
            assert len(h['resourceSeeds']) == 4 and list(h['probeSeeds']) == ['A', 'B', 'C', 'transfer']
            seeds.extend([h['seed'], h['cueSeed']]+h['resourceSeeds']+[h['shuffleSeed'], h['nullSeed']]+list(h['probeSeeds'].values()))
    assert len(seeds) == len(set(seeds)) == 288
    assert all(type(seed) is int and 0 < seed <= 0xffffffff and seed not in p['excludedSeeds'] for seed in seeds)


def probe(row, key):
    return next(v for v in row['probes'] if v['family']+':'+v['version'] == key)


def value(row, key):
    result = probe(row, key)
    assert math.isfinite(result['value']) and math.isfinite(result['resetInitializationEnergyPerFounder'])
    return result['value']+result['resetInitializationEnergyPerFounder']


def effect(row, c):
    if 'main' in c:
        return row['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder']-row['arms'][c['main']]['endpoint']['budgetAdjustedEnergyPerFounder']
    if c.get('null'):
        return row['arms']['nullCandidate']['endpoint']['budgetAdjustedEnergyPerFounder']-row['arms']['nullBlind']['endpoint']['budgetAdjustedEnergyPerFounder']
    if c.get('pressure') == 'aInterference':
        return value(row, 'A:A')-value(row, 'A:B')-.05*(value(row, 'A:A')-value(row, 'A:reset'))
    if c.get('pressure') == 'aNetFoodInterference':
        def net(key):
            endpoint = probe(row, key).get('endpoint')
            return (endpoint['totals']['beneficialEaten']-endpoint['totals']['toxinDamage'])/row['arms']['candidate']['endpoint']['founders'] if endpoint else 0
        return net('A:A')-net('A:B')
    return sum(weight*value(row, key) for key, weight in c['terms'])


def statistics(values, critical):
    n = len(values)
    mean = sum(values)/n
    se = math.sqrt(sum((v-mean)**2 for v in values)/(n-1)/n)
    return dict(mean=mean, se=se, lower=mean-critical*se, upper=mean+critical*se)


def audit_score(rows, p, phase, result):
    validate_protocol(p)
    n = 8 if phase == 'development' else 16
    assert len(rows) == n and result['phase'] == phase and result['experiment'] == p['experiment']
    assert result['histories'] == [h['seed'] for h in p[phase+'Histories']]
    assert len(result['comparisons']) == 26 and len(result['survival']) == 23 and len(result['activity']) == n
    for row, h in zip(rows, p[phase+'Histories']):
        assert row['history'] == h and row['phase'] == phase and list(row['arms']) == ARMS
        assert [(v['family'], v['version']) for v in row['probes']] == SPECS
        assert row['sham'] == probe(row, 'A:A')
        for item in [v['endpoint'] for v in row['arms'].values()]+row['probes']:
            assert item['founders'] == 24 and type(item['survivors']) is int and 0 <= item['survivors'] <= 24
            close(item['survival'], item['survivors']/24, 'founder denominator')
        for family in ['A', 'B', 'C', 'transfer']:
            assert len({v['startWorldSha256'] for v in row['probes'] if v['family'] == family}) == 1
        for item in row['probes']:
            assert item['resourceSeed']==h['probeSeeds'][item['family']]
            assert item['resetInitializationOperations']==item['resetInitializationEnergyPerFounder']==0
            if item.get('endpoint') is not None:
                assert item['acquisitionDisabled'] and item['learnedWeightsUnchanged'] and item['inferenceOnlyCompaction']
                close(item['value'],item['endpoint']['budgetAdjustedEnergyPerFounder'])
                assert item['survivors']==item['endpoint']['survivors'] and item['endpoint']['founders']==24
                assert item['endpoint']['tick']==1792 or item['survivors']==0
            else:
                assert item['skippedAllDead'] and row['endCCheckpointSha256'] is None
        a=row['arms']['candidate']['activity']
        assert a['founders']==24 and all(type(a[k]) is int and a[k]>=0 for k in ('activeFounders','updates','decisions'))
        assert a['activeFounders']<=24 and a['activeFounders']<=a['updates']<=a['decisions']
    for spec, actual in zip(CONTRASTS, result['comparisons']):
        for key, v in spec.items():
            assert actual[key] == v
        values = [effect(row, spec) for row in rows]
        expected = statistics(values, p['equivalenceCritical' if spec.get('null') else 'critical'][phase])
        assert len(actual['effects']) == n and actual['n'] == n
        for a, e in zip(actual['effects'], values):
            close(a, e, 'individual effect')
        for key, v in expected.items():
            close(actual[key], v, key)
        observed = sum(values)
        signflip = sum(sum(v*(1 if mask >> i & 1 else -1) for i, v in enumerate(values)) >= observed-1e-12 for mask in range(1 << n))/(1 << n)
        close(actual['pOneSided'], signflip, 'sign-flip p')
        assert actual['developmentPass'] == (abs(expected['mean']) < .5 if spec.get('null') else expected['mean'] > 0)
        assert actual['confirmationPass'] == (expected['lower'] > -.5 and expected['upper'] < .5 if spec.get('null') else expected['lower'] > 0 and signflip <= .05/26)
    for spec, actual in zip(SURVIVAL, result['survival']):
        for key, v in spec.items():
            assert actual[key] == v
        counts = [row['arms']['candidate']['endpoint']['survivors']-row['arms'][spec['main']]['endpoint']['survivors'] if 'main' in spec else
                  probe(row, spec['pair'][0])['survivors']-probe(row, spec['pair'][1])['survivors'] for row in rows]
        assert actual['counts'] == counts
        effects = [v/24 for v in counts]
        assert actual['effects'] == effects
        for key, v in statistics(effects, p['descriptiveCritical'][phase]).items():
            close(actual[key], v, 'survival '+key)
        assert actual['passed'] == (sum(counts) >= 0)
    for row, actual in zip(rows, result['activity']):
        assert actual == dict(seed=row['history']['seed'], **row['arms']['candidate']['activity'])
        assert actual['passed'] == (actual['activeFounders'] >= 12)
    support = [dict(seed=row['history']['seed'],passed=row['endCCheckpointSha256'] is not None and
        row['arms']['candidate']['endpoint']['survivors']>0 and all(v['survivors']>0 for v in row['probes'] if v['version'] not in ('accept','acceptStationary'))) for row in rows]
    assert result['support'] == support
    common = all(v['passed'] for v in result['survival']) and all(v['passed'] for v in result['activity']) and all(v['passed'] for v in support)
    assert result['promising'] == (common and all(v['developmentPass'] for v in result['comparisons']) if phase == 'development' else None)
    assert result['qualified'] == (phase == 'confirmation' and common and all(v['confirmationPass'] for v in result['comparisons']))
    return dict(histories=n, comparisons=26, survivalGuards=23)


if __name__ == '__main__':
    import argparse
    import json
    from pathlib import Path
    parser=argparse.ArgumentParser()
    parser.add_argument('fixture',type=Path)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    fixture=json.loads(args.fixture.read_text(encoding='utf8'))
    assert fixture['kind']=='value-study-inference-engineering' and fixture['schema']==1
    assert [b['phase'] for b in fixture['banks']] in [['development'],['development','confirmation']]
    audits=[audit_score(b['rows'],fixture['p'],b['phase'],b['result']) for b in fixture['banks']]
    text=json.dumps(dict(schema=1,passed=True,banks=audits,scope='Independent fixed-protocol inference on invented tables only, not empirical learning or qualification.'),indent=2)+'\n'
    if args.output:
        with args.output.open('x',encoding='utf8') as f:f.write(text)
    else: print(text,end='')
