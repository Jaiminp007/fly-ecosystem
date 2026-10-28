"""Independent cue-learning arithmetic, observation/physical receipts and gates.

Reuse independently implemented sparse/linear inference and plasticity, with a
temporary audit view subtracting separately checked actuator work. Original
traces remain unchanged. Byte-time charges use recorded storage receipts; this
does not independently reconstruct every intermediate JS object shape. Full
exact physical replay separately checks all bills and probe states.
"""
import gc
import hashlib
import json
import math
from pathlib import Path
import runpy
import sys
import tempfile
import warnings
from scipy.stats import t

HERE = Path(__file__).resolve().parent
mb = runpy.run_path(str(HERE/'audit-mushroom-body.py'))
linear = runpy.run_path(str(HERE/'audit-sarsa-screen.py'))
authority = runpy.run_path(str(HERE/'audit-cue-authority.py'))
close, sha = authority['close'], authority['sha']
LEARNED = ['candidate', 'lambda0', 'frozen', 'reset', 'cueBlind', 'shuffled', 'nullCandidate', 'nullBlind', 'fastOnly', 'linear']


def audit_trace(path, p, h, row):
    states, counts = {}, {'physicalReceipts': 0, 'observedDecisions': 0}
    with tempfile.TemporaryDirectory(prefix='cue-independent-') as directory:
        view = Path(directory)/'body-view.jsonl'
        with path.open(encoding='utf8') as stream, view.open('w', encoding='utf8') as out:
            for line in stream:
                e = json.loads(line)
                arm = e['arm']
                if e['type'] == 'start':
                    assert arm not in states and e['seed'] == h['seed']
                    states[arm] = {'bodies': {s['agentId']: {'energy': 65., 'cost': 0., 'good': 0., 'harm': 0., 'damage': 0., 'discard': 0., 'paid': 0., 'byteSeconds': 0., 'motor': 0, 'ticks': 0, 'last': 0, 'own': {}, 'terminal': {}, 'pressure': {'A': set(), 'B': set(), 'C': set()}, 'pressureCount': 0} for s in e['learners']}, 'initialEnergy': e['initialEnergy'], 'ended': False}
                    close(e['initialEnergy'], e['initialFoodInventory']+65*p['reference']['founders'], 'starting energy')
                    assert len(states[arm]['bodies']) == p['reference']['founders']
                elif e['type'] in ['own', 'terminal']:
                    s = states[arm]['bodies'][e['agentId']]
                    observed = e['observedEnergy'] if e['type'] == 'own' else e['energy']
                    close(observed, e['physicalEnergy']-e['outstandingEnergy'], 'own physical energy minus actual debt')
                    if e['type'] == 'own':
                        close(e['physicalEnergy'], s['energy'], 'observed body continuity')
                        s['own'][e['tick']] = e
                        counts['observedDecisions'] += 1
                    else:
                        assert e['terminal'] and e['physicalEnergy'] == 0
                        s['terminal'][e['tick']] = e
                elif e['type'] == 'ledger':
                    s = states[arm]['bodies'][e['agentId']]
                    assert e['tick'] == s['last']+1 and 1 <= e['steps'] <= 8
                    close(e['initialEnergy'], s['energy'], 'receipt continuity')
                    close(e['initialEnergy']-e['cost']+e['beneficialEaten']-e['toxinDamage']-e['discarded'], e['finalEnergy'], 'physical receipt')
                    for k in ['cost', 'paidExtra', 'beneficialEaten', 'harmfulEaten', 'toxinDamage', 'discarded', 'storageByteSeconds', 'finalEnergy']:
                        assert e[k] >= 0
                    assert e['paidExtra'] <= e['cost']+1e-10 and e['toxinDamage'] <= e['harmfulEaten']+1e-10
                    s['energy'] = e['finalEnergy']
                    for key, field in [('cost', 'cost'), ('beneficialEaten', 'good'), ('harmfulEaten', 'harm'), ('toxinDamage', 'damage'), ('discarded', 'discard'), ('paidExtra', 'paid'), ('storageByteSeconds', 'byteSeconds')]:
                        s[field] += e[key]
                    if arm != 'incumbent':
                        s['motor'] += (6 if e['action'] > 0 else 9)*e['steps']
                    s['ticks'] += e['steps']
                    s['last'] = e['tick']+e['steps']-1
                    counts['physicalReceipts'] += 1
                elif e['type'] == 'experience':
                    s = states[arm]['bodies'][e['agentId']]
                    if e['decision']:
                        assert e['decision']['observation'] == s['own'][e['tick']]['observation']
                    for tr in e['transitions']:
                        if arm == 'candidate' and tr['tick'] <= 1536:
                            family = 'A' if tr['tick'] <= 512 else 'B' if tr['tick'] <= 1024 else 'C'
                            s['pressure'][family].update(i for i, v in enumerate(tr['phi']) if v != 0)
                            s['pressureCount'] += 1
                        close(tr['initialEnergy'], s['own'][tr['tick']]['observedEnergy'], 'transition own initial energy')
                        final = s['terminal'][e['tick']]['energy'] if tr['terminal'] else s['own'][e['tick']]['observedEnergy']
                        close(tr['finalEnergy'], final, 'transition own matured energy')
                        close(tr['reward'], (final-tr['initialEnergy'])/120, 'own experienced reward')
                elif e['type'] == 'end':
                    run = states[arm]
                    assert not run['ended']
                    run['ended'] = True
                    for original in e['learners']:
                        s = run['bodies'][original['agentId']]
                        if arm != 'incumbent':
                            assert original['actuator']['scalarOperations'] == s['motor'] and original['actuator']['ticks'] == s['ticks']
                            close(original['charge']['incurredEnergy'], original['work']['scalarOperations']*p['pricing']['operationEnergy']+s['byteSeconds']*p['pricing']['byteEnergyPerSecond'], 'work and recorded byte-time bill')
                            close(original['charge']['paidEnergy'], s['paid'], 'paid work')
                            close(original['charge']['incurredEnergy']-s['paid'], original['charge']['outstandingEnergy'], 'all retained debt')
                            if arm not in LEARNED:
                                assert original['work']['scalarOperations'] == s['motor']+original['decisions']
                    ep = row['arms'][arm]['endpoint']
                    ss = list(run['bodies'].values())
                    close((sum(s['energy'] for s in ss)-65*len(ss)-ep['outstandingEnergy'])/len(ss), ep['budgetAdjustedEnergyPerFounder'], 'all-founder endpoint')
                    for key, field in [('beneficialEaten', 'good'), ('harmfulEaten', 'harm'), ('toxinDamage', 'damage')]:
                        close(sum(s[field] for s in ss), ep['totals'][key], key)
                    close(sum(s['cost']+s['harm']+s['damage']+s['discard'] for s in ss), ep['totals']['dissipated'], 'physical dissipation')
                    close(ep['foodInventory']+sum(s['energy'] for s in ss)+ep['totals']['dissipated']-run['initialEnergy']-ep['totals']['externalEnergy'], 0, 'global conservation')
                    assert ep['survivors'] == sum(not s['dead'] for s in e['learners'])
                    if arm in LEARNED:
                        for s in e['learners']:
                            s['work']['scalarOperations'] -= s['actuator']['scalarOperations']
                elif e['type'] not in ['intervention', 'decision']:
                    raise AssertionError(e['type'])
                if e['program'] in ['candidate', 'fastOnly', 'linear']:
                    out.write(json.dumps(e)+'\n')
        assert list(states) == p['arms'] and all(s['ended'] for s in states.values())
        ss = list(states['candidate']['bodies'].values())
        a = sum(len(s['pressure']['A']) for s in ss)
        b = sum(len(s['pressure']['B']) for s in ss)
        reuse_a = sum(len(s['pressure']['A'].intersection(s['pressure']['B'] | s['pressure']['C'])) for s in ss)
        reuse_b = sum(len(s['pressure']['B'].intersection(s['pressure']['C'])) for s in ss)
        assert row['arms']['candidate']['pressure'] == {'aCells': a, 'bCells': b, 'reusedA': reuse_a, 'reusedB': reuse_b, 'aReuse': reuse_a/a if a else 0, 'bReuse': reuse_b/b if b else 0, 'bodiesOverReceiptCapacity': sum(s['pressureCount'] > 16 for s in ss), 'founders': p['reference']['founders']}
        for program, helper, expected in [('candidate', mb, 8), ('fastOnly', mb, 1), ('linear', linear, 1)]:
            result = helper['audit_trace'](view, h['seed'], program)
            assert result['learnerBodies'] == expected*p['reference']['founders'], ('nonempty exact body coverage', program)
            for key, value in result.items():
                counts[key] = counts.get(key, 0)+value
    return counts


def effect(row, c):
    if c.get('null'):
        return row['arms']['nullCandidate']['endpoint']['budgetAdjustedEnergyPerFounder']-row['arms']['nullBlind']['endpoint']['budgetAdjustedEnergyPerFounder']
    if 'main' in c:
        return row['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder']-row['arms'][c['main']]['endpoint']['budgetAdjustedEnergyPerFounder']
    probes = {v['family']+':'+v['version']: v['value'] for v in row['probes']}
    return sum(probes[k]*w for k, w in c['terms'])


def audit(directory, phase):
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    folder = directory/phase
    result_path = folder/'results.json'
    result = json.loads(result_path.read_text(encoding='utf8'))
    protocol_hash = sha(directory/'protocol.json')
    assert result['protocolSha256'] == protocol_hash
    for file, expected in p['sourceSha256'].items():
        assert sha(directory/'sources'/file) == expected
    histories = p['developmentHistories' if phase == 'development' else 'confirmationHistories']
    n, k = len(histories), len(p['contrasts'])
    close(p['critical'][phase], float(t.ppf(1-.05/k, n-1)), 'critical t')
    close(p['equivalenceCritical'][phase], float(t.ppf(1-.05/(2*k), n-1)), 'equivalence t')
    totals, rows = {}, []
    for i, h in enumerate(histories):
        path = folder/'rows'/f"{h['seed']}.json"
        row = json.loads(path.read_text(encoding='utf8'))
        assert row['protocolSha256'] == protocol_hash and sha(path) == result['rowSha256'][i] and row['history'] == h
        trace = folder/'numerics'/f"{h['seed']}.jsonl"
        assert sha(trace) == row['numericsSha256']
        for key, value in audit_trace(trace, p, h, row).items():
            totals[key] = totals.get(key, 0)+value
        rows.append(row)
    for spec, c in zip(p['contrasts'], result['comparisons']):
        assert c['id'] == spec['id']
        effects = [effect(r, spec) for r in rows]
        close(c['mean'], sum(effects)/n, 'effect mean')
        for actual, expected in zip(c['effects'], effects):
            close(actual, expected, 'individual effect')
        se = math.sqrt(sum((v-c['mean'])**2 for v in effects)/(n-1)/n)
        critical = p['equivalenceCritical'][phase] if spec.get('null') else p['critical'][phase]
        close(c['se'], se, 'standard error')
        close(c['lower'], c['mean']-critical*se, 'lower bound')
        close(c['upper'], c['mean']+critical*se, 'upper bound')
        signflip = sum(sum(v*(1 if bits>>i & 1 else -1) for i, v in enumerate(effects)) >= sum(effects)-1e-12 for bits in range(1 << n))/(1 << n)
        close(c['pOneSided'], signflip, 'exact sign-flip p')
        assert c['developmentPass'] == (abs(c['mean']) < p['nullMargin'] if spec.get('null') else c['mean'] > 0)
        assert c['confirmationPass'] == (c['lower'] > -p['nullMargin'] and c['upper'] < p['nullMargin'] if spec.get('null') else c['lower'] > 0 and c['pOneSided'] <= p['alphaPerTest'])
    for c in result['survival']:
        effects = [r['arms']['candidate']['endpoint']['survival']-r['arms'][c['control']]['endpoint']['survival'] for r in rows]
        assert effects == c['effects']
        close(c['mean'], sum(effects)/n, 'survival mean')
        assert c['passed'] == (c['mean'] >= 0)
    for row, pressure, activity in zip(rows, result['pressure'], result['activity']):
        v = row['arms']['candidate']['pressure']
        for key, value in v.items():
            assert pressure[key] == value
        assert pressure['passed'] == (v['aReuse'] >= .5 and v['bReuse'] >= .5 and v['bodiesOverReceiptCapacity'] >= p['reference']['founders']/2)
        ds = [s['plasticityDiagnostics'] for s in row['arms']['candidate']['learners']]
        updates = sum(s['updates'] for s in ds)
        fraction = sum(s['nonzeroDopamine'] for s in ds)/updates if updates else 0
        transfer = sum(s['absoluteTransfer'] for s in ds)
        assert activity['updates'] == updates
        close(activity['fraction'], fraction, 'dopamine activity')
        close(activity['absoluteTransfer'], transfer, 'synapse transfer')
        assert activity['passed'] == (updates > 0 and fraction >= .5 and transfer > 0)
    common = all(c['passed'] for key in ['survival', 'pressure', 'activity'] for c in result[key])
    if phase == 'development':
        assert result['promising'] == (common and all(c['developmentPass'] for c in result['comparisons'] if not c.get('optional')))
    else:
        assert result['promising'] is None
    assert result['qualified'] == (phase == 'confirmation' and common and all(c['confirmationPass'] for c in result['comparisons'] if not c.get('optional')))
    return {'schema': 1, 'passed': True, 'phase': phase, 'protocolSha256': protocol_hash, 'resultsSha256': sha(result_path), **totals,
            'limits': 'Independent inference/plasticity, own-reward and physical ledger reconstruction; storage-time charges use recorded byte receipts. Exact full cold replay is separate.'}


if __name__ == '__main__':
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        result = audit(Path(sys.argv[1]).resolve(), sys.argv[2])
        gc.collect()
    assert not caught, [str(w.message) for w in caught]
    result['warnings'] = []
    with (Path(sys.argv[1])/sys.argv[2]/'numeric-audit.json').open('x', encoding='utf8', newline='\n') as f:
        json.dump(result, f, indent=2)
        f.write('\n')
    print(json.dumps(result))
