"""Independent fixed-protocol effects, exact-count guards and inference."""
import math
from scipy.stats import t

ARMS = ['candidate', 'frozen', 'reset', 'cueBlind', 'shuffled', 'nullCandidate', 'nullBlind',
        'incumbent', 'acceptCruise', 'refuseCruise', 'acceptStationary', 'refuseStationary', 'random']
CONTROLS = [arm for arm in ARMS if arm not in ('candidate', 'nullCandidate', 'nullBlind')]
SPECS = [('A', 'A'), ('A', 'C'), ('A', 'reset'), ('B', 'A'), ('B', 'B'), ('B', 'C'), ('B', 'reset'),
         ('C', 'B'), ('C', 'C')]+[('transfer', version) for version in ['A', 'C', 'reset', 'accept', 'acceptStationary']]+[('A', 'B')]
CONTRASTS = [dict(id=f'sequence-{arm}', main=arm) for arm in CONTROLS]+[
    dict(id='B-acquisition', terms=[['B:B', 1], ['B:A', -1]]),
    dict(id='C-acquisition', terms=[['C:C', 1], ['C:B', -1]]),
    dict(id='A-initial-skill', terms=[['A:A', 1], ['A:reset', -1]]),
    dict(id='B-initial-skill', terms=[['B:B', 1], ['B:reset', -1]]),
    dict(id='A-retention', terms=[['A:C', 1], ['A:A', -.95], ['A:reset', -.05]]),
    dict(id='B-retention', terms=[['B:C', 1], ['B:B', -.95], ['B:reset', -.05]])]+[
    dict(id=f'transfer-{v}', terms=[['transfer:C', 1], [f'transfer:{v}', -1]]) for v in ['reset', 'accept', 'acceptStationary']]+[
    dict(id='functional-interference', pressure='aInterference'), dict(id='physical-interference', pressure='aNetFoodInterference'),
    dict(id='null-equivalence', null=True)]
SURVIVAL = [dict(id=f'sequence-{arm}', main=arm) for arm in CONTROLS]+[
    dict(id=c['id'], pair=['A:C', 'A:A'] if c['id'] == 'A-retention' else ['B:C', 'B:B'] if c['id'] == 'B-retention' else [key for key, _ in c['terms']])
    for c in CONTRASTS if 'terms' in c]


def close(actual, expected, name='statistic'):
    assert math.isfinite(actual) and math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-12), (name, actual, expected)


def validate_protocol(p):
    assert p['experiment'] == 'fixed-tick-actor-critic-development-v1' and p['schema'] == 1
    assert p['arms'] == ARMS and [(v['family'], v['version']) for v in p['probes']] == SPECS
    assert p['contrasts'] == CONTRASTS and p['survival'] == SURVIVAL
    assert p['reference']['founders'] == 24 and p['retentionFraction'] == .95 and p['interferenceFraction'] == .05
    assert p['resetConstructionNeutral'] is True and p['nullMargin'] == .5 and p['alphaPerTest'] == .05/22
    assert p['budget'] == dict(developmentWorlds=232, confirmationWorlds=464, totalWorlds=696,
        worldsPerHistory=29, worldStepsPerHistory=27392, totalCollectionWorldSteps=657408,
        maxPolicyScalarOperations=50000000000, maxCompressedTraceBytesPerHistory=268435456,
        maxUncompressedTraceBytesPerHistory=4294967296, maxEvidenceBytes=8589934592,
        maxCollectionWallSeconds=43200, maxCollectionCpuMicroseconds=43200000000,
        maxReplayWallSeconds=43200, maxReplayCpuMicroseconds=43200000000,
        maxIndependentAuditWallSeconds=86400, maxIndependentAuditCpuSeconds=86400)
    assert p['learner'] == dict(mechanism='tick-shared-actor-critic-v1', inputs=33, hidden=4, actions=4,
        initializationSeed=0x74616331, discount=.99, **{'lambda': .9}, epsilon=.1, actorRate=.01, criticRate=.05, weightBound=4)
    seeds = []
    for phase, n in [('development', 8), ('confirmation', 16)]:
        assert len(p[phase+'Histories']) == n
        close(p['critical'][phase], float(t.ppf(1-.05/22, n-1)), 'directional critical')
        close(p['equivalenceCritical'][phase], float(t.ppf(1-.05/44, n-1)), 'equivalence critical')
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
    assert len(result['comparisons']) == 22 and len(result['survival']) == 19 and len(result['activity']) == n
    for row, h in zip(rows, p[phase+'Histories']):
        assert row['history'] == h and row['phase'] == phase and list(row['arms']) == ARMS
        assert [(v['family'], v['version']) for v in row['probes']] == SPECS
        assert row['sham'] == probe(row, 'A:A')
        for item in [v['endpoint'] for v in row['arms'].values()]+row['probes']:
            assert item['founders'] == 24 and type(item['survivors']) is int and 0 <= item['survivors'] <= 24
            close(item['survival'], item['survivors']/24, 'founder denominator')
        for family in ['A', 'B', 'C', 'transfer']:
            assert len({v['startWorldSha256'] for v in row['probes'] if v['family'] == family}) == 1
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
        assert actual['confirmationPass'] == (expected['lower'] > -.5 and expected['upper'] < .5 if spec.get('null') else expected['lower'] > 0 and signflip <= .05/22)
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
    common = all(v['passed'] for v in result['survival']) and all(v['passed'] for v in result['activity'])
    assert result['promising'] == (common and all(v['developmentPass'] for v in result['comparisons']) if phase == 'development' else None)
    assert result['qualified'] == (phase == 'confirmation' and common and all(v['confirmationPass'] for v in result['comparisons']))
    return dict(histories=n, comparisons=22, survivalGuards=19)
