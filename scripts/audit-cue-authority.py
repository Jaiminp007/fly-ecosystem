"""Independent policy, charge, physical-ledger and seed-level statistical audit.

Physical replay uses exact JSON/trace equality in Node. This separate arithmetic
reconstruction uses 1e-8 absolute + 1e-11 relative for accumulated float sums.
It does not replace or relax the exact physical replay requirement.
"""
import hashlib
import json
import math
from pathlib import Path
import sys
import warnings
from scipy.stats import t


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def close(a, b, name):
    assert math.isfinite(a) and math.isfinite(b) and math.isclose(a, b, abs_tol=1e-8, rel_tol=1e-11), (name, a, b)


def advance(s):
    s ^= (s << 13) & 0xffffffff
    s ^= s >> 17
    s ^= (s << 5) & 0xffffffff
    return s & 0xffffffff


class Rng:
    def __init__(self, seed):
        self.state = seed

    def next(self):
        self.state = advance(self.state)
        return self.state / 4294967296


def shuffled(xs, rng):
    xs = list(xs)
    for i in range(len(xs) - 1, 0, -1):
        j = int(rng.next() * (i + 1))
        xs[i], xs[j] = xs[j], xs[i]
    return xs


def codebook(seed):
    rng = Rng(seed)
    patterns = shuffled([{'id': i+1, 'bits': [1 if i >> j & 1 else -1 for j in range(4)]} for i in range(16)], rng)
    result = {}
    for i, family in enumerate(['A', 'B', 'C']):
        labels = shuffled([-1, -1, 1, 1], rng)
        result[family] = [dict(patterns[i*4+j], valence=labels[j]) for j in range(4)]
    return result


def encoded(x):
    if x is None or isinstance(x, bool):
        return 1
    if isinstance(x, (float, int)):
        assert math.isfinite(x)
        return 8
    if isinstance(x, str):
        return 4 + len(x.encode('utf8'))
    if isinstance(x, list):
        return 4 + sum(encoded(v) for v in x)
    return 4 + sum(4 + len(k.encode('utf8')) + encoded(v) for k, v in x.items())


def audit_trace(path, p, h, row):
    runs = {}
    counts = {'decisions': 0, 'physicalReceipts': 0, 'bodySteps': 0, 'bodies': 0}
    book = codebook(h['cueSeed'])
    with path.open(encoding='utf8') as stream:
        for line in stream:
            e = json.loads(line)
            arm = e['arm']
            if e['type'] == 'start':
                assert arm not in runs and e['codebook'] == book and e['seed'] == h['seed']
                states = {}
                for key, s in e['learners'].items():
                    assert not s['acquisition'] and not s['weights'] and not s['recent'] and s['transitions'] == 0
                    assert s['agentId'] == int(key) and s['rngState'] == ((h['seed'] ^ ((int(key)*2654435761) & 0xffffffff)) & 0xffffffff or 1)
                    if 'Oracle' in arm and arm != 'valueOracle':
                        assert s['knowledge'] == book
                    else:
                        assert 'knowledge' not in s
                    states[int(key)] = {'rng': s['rngState'], 'bytes': encoded(s), 'work': 0, 'ticks': 0,
                                        'decisions': 0, 'primitive': 0, 'actions': {}, 'energy': 65., 'cost': 0., 'paid': 0.,
                                        'good': 0., 'harm': 0., 'damage': 0., 'discard': 0., 'last': 0}
                assert len(states) == p['reference']['founders']
                close(e['initialEnergy'], e['initialFoodInventory']+65*len(states), 'initial physical energy')
                runs[arm] = {'states': states, 'ended': False, 'initialEnergy': e['initialEnergy']}
                counts['bodies'] += len(states)
            elif e['type'] == 'decision':
                s = runs[arm]['states'][e['agentId']]
                assert e['tick'] == s['decisions']*8+1
                obs = e['observation']
                assert len(obs) == 17 and all(math.isfinite(v) and abs(v) <= 1 for v in obs)
                s['work'] += 1
                if arm == 'valueOracle':
                    choice = -1 if e['sensedValence'] < 0 else 1
                elif 'Oracle' in arm:
                    bits = [obs[0], 2*obs[1]-1, 2*obs[2]-1, 2*obs[3]-1]
                    s['work'] += 6
                    choice = 1
                    for item in [c for fam in book.values() for c in fam]:
                        match = True
                        for j in range(4):
                            s['work'] += 1
                            if item['bits'][j] != bits[j]:
                                match = False
                                break
                        if match:
                            s['work'] += 1
                            choice = item['valence']
                            break
                elif arm in ['random', 'nullRandom']:
                    s['rng'] = advance(s['rng'])
                    s['work'] += 6
                    choice = 1 if s['rng']/4294967296 >= .5 else -1
                else:
                    choice = -1 if arm == 'refuse' else 1
                assert e['choice'] == choice and e['rngState'] == s['rng']
                s['actions'][e['tick']] = choice
                s['decisions'] += 1
                counts['decisions'] += 1
            elif e['type'] == 'ledger':
                s = runs[arm]['states'][e['agentId']]
                assert e['tick'] == s['last']+1 and 1 <= e['steps'] <= 8
                assert e['tick'] in s['actions']
                close(e['initialEnergy'], s['energy'], 'receipt continuity')
                close(e['initialEnergy']-e['cost']+e['beneficialEaten']-e['toxinDamage']-e['discarded'], e['finalEnergy'], 'physical receipt')
                for k in ['cost', 'paidExtra', 'beneficialEaten', 'harmfulEaten', 'toxinDamage', 'discarded', 'finalEnergy']:
                    assert e[k] >= 0
                assert e['paidExtra'] <= e['cost']+1e-10 and e['toxinDamage'] <= e['harmfulEaten']+1e-10
                s['energy'] = e['finalEnergy']
                s['cost'] += e['cost']
                s['paid'] += e['paidExtra']
                s['good'] += e['beneficialEaten']
                s['harm'] += e['harmfulEaten']
                s['damage'] += e['toxinDamage']
                s['discard'] += e['discarded']
                s['ticks'] += e['steps']
                s['last'] = e['tick']+e['steps']-1
                primitive = (6 if s['actions'][e['tick']] > 0 else 9)*e['steps']
                s['work'] += primitive
                s['primitive'] += primitive
                counts['physicalReceipts'] += 1
                counts['bodySteps'] += e['steps']
            elif e['type'] == 'end':
                run = runs[arm]
                assert not run['ended']
                run['ended'] = True
                for key, final in e['learners'].items():
                    s = run['states'][int(key)]
                    assert not final['acquisition'] and not final['weights'] and final['transitions'] == 0 and final['work']['liveUpdates'] == 0
                    assert final['work']['scalarOperations'] == s['work'] and final['charge']['operationsBilled'] == s['work']
                    assert final['actuator'] == {'heldAction': s['actions'][max(s['actions'])], 'ticks': s['ticks'], 'decisions': s['decisions'], 'scalarOperations': s['primitive']}
                    assert final['decisions'] == s['decisions'] and final['rngState'] == s['rng']
                    assert final['charge']['storageBytes'] == s['bytes']
                    due = s['work']*p['pricing']['operationEnergy']+s['bytes']*p['pricing']['byteEnergyPerSecond']*.1*s['ticks']
                    close(due, final['charge']['incurredEnergy'], 'full compute/storage bill')
                    close(s['paid'], final['charge']['paidEnergy'], 'paid work')
                    close(due-s['paid'], final['charge']['outstandingEnergy'], 'retained unpaid debt')
                endpoint = e['endpoint']
                assert endpoint == row['arms'][arm]['endpoint']
                ss = list(run['states'].values())
                assert endpoint['survivors'] == sum(not s['dead'] for s in e['learners'].values())
                assert endpoint['scalarOperations'] == sum(s['work'] for s in ss)
                assert endpoint['encodedBytes'] == sum(s['bytes'] for s in ss)
                close((sum(s['energy'] for s in ss)-65*len(ss)-endpoint['outstandingEnergy'])/len(ss), endpoint['budgetAdjustedEnergyPerFounder'], 'all-founder endpoint')
                for key, field in [('beneficialEaten', 'good'), ('harmfulEaten', 'harm'), ('toxinDamage', 'damage')]:
                    close(sum(s[field] for s in ss), endpoint['totals'][key], key)
                close(sum(s['good']+s['harm'] for s in ss), endpoint['totals']['foodEaten'], 'food total')
                close(sum(s['cost']+s['harm']+s['damage']+s['discard'] for s in ss), endpoint['totals']['dissipated'], 'dissipation')
                close(endpoint['foodInventory']+sum(s['energy'] for s in ss)+endpoint['totals']['dissipated']-run['initialEnergy']-endpoint['totals']['externalEnergy'], 0, 'independent world conservation')
                close(endpoint['accountingResidual'], 0, 'world residual')
            else:
                raise AssertionError(('Unexpected trace event', e['type']))
    assert list(runs) == p['arms'] and all(r['ended'] for r in runs.values())
    return counts


def audit(directory):
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    result_path = directory/'results.json'
    result = json.loads(result_path.read_text(encoding='utf8'))
    protocol_hash = sha(directory/'protocol.json')
    assert result['protocolSha256'] == protocol_hash
    for file, expected in p['sourceSha256'].items():
        assert sha(directory/'sources'/file) == expected
    seeds = [s for h in p['histories'] for s in [h['seed'], h['cueSeed'], *h['resourceSeeds'], h['shuffleSeed'], h['nullSeed']]]
    assert len(seeds) == len(set(seeds)) == 128 and not set(seeds).intersection(p['excludedSeeds'])
    critical = float(t.ppf(1-.05/(2*8), 15))
    close(critical, p['critical'], 'critical value')
    rows, totals = [], {}
    for i, h in enumerate(p['histories']):
        row_path = directory/'rows'/f"{h['seed']}.json"
        row = json.loads(row_path.read_text(encoding='utf8'))
        assert sha(row_path) == result['rowSha256'][i] and row['history'] == h and row['protocolSha256'] == protocol_hash
        path = directory/'numerics'/f"{h['seed']}.jsonl"
        assert sha(path) == row['numericsSha256']
        for key, value in audit_trace(path, p, h, row).items():
            totals[key] = totals.get(key, 0)+value
        rows.append(row)
    for spec, c in zip(p['contrasts'], result['comparisons']):
        assert spec['id'] == c['id']
        effects = [r['arms'][spec['a']]['endpoint']['budgetAdjustedEnergyPerFounder']-r['arms'][spec['b']]['endpoint']['budgetAdjustedEnergyPerFounder'] for r in rows]
        mean = math.fsum(effects)/len(effects)
        se = math.sqrt(math.fsum((v-mean)**2 for v in effects)/(len(effects)-1)/len(effects))
        assert effects == c['effects']
        for key, value in [('mean', mean), ('se', se), ('lower', mean-critical*se), ('upper', mean+critical*se)]:
            close(value, c[key], spec['id']+key)
        assert c['passed'] == (mean-critical*se > -p['nullMargin'] and mean+critical*se < p['nullMargin'] if spec.get('equivalence') else mean-critical*se > 0)
    for c in result['survivalGuards']:
        spec = next(v for v in p['contrasts'] if v['id'] == c['id'])
        effects = [r['arms'][spec['a']]['endpoint']['survival']-r['arms'][spec['b']]['endpoint']['survival'] for r in rows]
        assert effects == c['effects']
        mean = math.fsum(effects)/len(effects)
        close(mean, c['mean'], 'survival')
        assert c['passed'] == (mean >= 0)
    assert not result['learnerQualification']
    assert result['passed'] == (all(c['passed'] for c in result['comparisons']) and all(c['passed'] for c in result['survivalGuards']))
    return {'schema': 1, 'passed': True, 'protocolSha256': protocol_hash, 'resultsSha256': sha(result_path), **totals,
            'physicalEquality': 'Requires separate exact Node cold replay; arithmetic tolerances do not replace it.'}


if __name__ == '__main__':
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        result = audit(Path(sys.argv[1]).resolve())
    assert not caught, [str(w.message) for w in caught]
    result['warnings'] = []
    with (Path(sys.argv[1])/'numeric-audit.json').open('x', encoding='utf8', newline='\n') as f:
        json.dump(result, f, indent=2)
        f.write('\n')
    print(json.dumps(result))
