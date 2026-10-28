"""Independent frozen pursuit-authority motor, charge, ledger and statistical audit.

Reuses unchanged cue-authority warmup extraction and the existing tolerance:
1e-8 absolute plus 1e-11 relative for accumulated floats. Every recorded probe
motor is reconstructed from its recorded sensors; physical sensor provenance
and application still require exact Node cold replay. Inputs stay immutable.
"""
import importlib.util
import json
import math
from pathlib import Path
import re
import sys
import warnings
from scipy.stats import t


helper_path = Path(__file__).with_name('audit-transfer-authority.py')
helper_spec = importlib.util.spec_from_file_location('transfer_authority_audit', helper_path)
transfer = importlib.util.module_from_spec(helper_spec)
helper_spec.loader.exec_module(transfer)
sha, close, encoded, advance = transfer.sha, transfer.close, transfer.encoded, transfer.advance
captured, hash_value, audit_warmup = transfer.captured, transfer.hash_value, transfer.audit_warmup
ARMS = ['legacyFast', 'pursuit', 'refuse', 'random']
CONTROLS = ['legacyFast', 'refuse', 'random']
TARGET = 'pursuit'


def initial_state(agent_id, seed, arm, dead):
    return {'agentId': agent_id, 'mode': arm,
            'rngState': (seed ^ ((agent_id*2654435761) & 0xffffffff)) & 0xffffffff or 1,
            'heldAction': 1, 'decisions': 0, 'ticks': 0, 'lastDecisionTick': 0,
            'lastObservedTick': 1536, 'dead': dead, 'work': {'scalarOperations': 0},
            'charge': {'operationsBilled': 0, 'outstandingEnergy': 0,
                       'incurredEnergy': 0, 'paidEnergy': 0, 'storageBytes': 0}}


def verify_protocol(directory, p):
    assert p['schema'] == 1 and p['experiment'] == 'original-transfer-pursuit-authority-v1'
    assert p['arms'] == ARMS and len(p['histories']) == 16
    assert p.get('survivalArithmetic') in [None, 'exact-founder-counts-v1']
    assert p.get('target', TARGET) == TARGET and p.get('controls', CONTROLS) == CONTROLS
    assert p['budget'] == {'warmupWorlds': 16, 'probeWorlds': 64,
                           'totalWorlds': 80, 'maximumWorldSteps': 40960}
    close(p['alphaPerTest'], .05/3, 'one-sided Bonferroni alpha')
    critical = float(t.ppf(1-.05/3, 15))
    close(p['critical'], critical, 'critical value')
    required = {'engine.mjs', 'challenges.mjs', 'learning/pursuit-authority.mjs',
                'learning/cue-foraging.mjs', 'learning/sarsa-experiment.mjs',
                'scripts/pursuit-authority.mjs', 'scripts/audit-pursuit-authority.py',
                'scripts/audit-transfer-authority.py', 'scripts/audit-cue-authority.py'}
    assert required <= p['sourceSha256'].keys()
    for file, expected in p['sourceSha256'].items():
        assert sha(captured(directory/'sources', file)) == expected, file
    assert sha(transfer.helper_path) == p['sourceSha256']['scripts/audit-cue-authority.py']
    assert sha(helper_path) == p['sourceSha256']['scripts/audit-transfer-authority.py']
    assert sha(Path(__file__)) == p['sourceSha256']['scripts/audit-pursuit-authority.py']
    reference_path = directory/'reference-input.json'
    assert sha(reference_path) == p['inputSha256']
    reference = json.loads(reference_path.read_text(encoding='utf8'))
    assert p['reference'] == reference['reference'] and p['pricing'] == reference['pricing']
    for file in ['engine.mjs', 'challenges.mjs']:
        assert p['sourceSha256'][file] == reference['sourceSha256'][file]
    assert type(p['reference']['founders']) is int and p['reference']['founders'] > 0
    for key in ['operationEnergy', 'byteEnergyPerSecond']:
        assert math.isfinite(p['pricing'][key]) and p['pricing'][key] > 0
    excluded = {41}

    def visit(value, key=''):
        if isinstance(value, list):
            for item in value:
                visit(item, key)
        elif isinstance(value, dict):
            for field, item in value.items():
                visit(item, key if re.search('seed', key, re.I) else field)
        elif re.search('seed', key, re.I) and type(value) in (int, float):
            if math.isfinite(value) and value == int(value) and 0 < value <= 0xffffffff:
                excluded.add(int(value))

    for key, folder in [('seedRegistries', 'registries'), ('engineeringSources', 'engineering')]:
        names = [entry['path'] for entry in p[key]]
        assert len(names) == len(set(names)) and names
        for entry in p[key]:
            name = entry['path']
            if key == 'engineeringSources':
                assert name.startswith('tests/') and name.endswith('.mjs')
                name = name[6:]
            path = captured(directory/folder, name)
            assert sha(path) == entry['sha256'], entry['path']
            text = path.read_text(encoding='utf8')
            if key == 'seedRegistries':
                visit(json.loads(text))
            else:
                for match in re.finditer(r'\b(?:0x[\da-f]+|\d[\d_]*)\b', text, re.I | re.ASCII):
                    literal = match[0].replace('_', '')
                    value = int(literal, 16 if literal.lower().startswith('0x') else 10)
                    if 0 < value <= 0xffffffff:
                        excluded.add(value)
    assert p['excludedSeeds'] == sorted(excluded)
    seeds = []
    for history in p['histories']:
        assert set(history) == {'seed', 'cueSeed', 'resourceSeeds', 'shuffleSeed', 'nullSeed', 'transferSeed'}
        assert len(history['resourceSeeds']) == 4
        seeds.extend([history['seed'], history['cueSeed'], *history['resourceSeeds'],
                      history['shuffleSeed'], history['nullSeed'], history['transferSeed']])
    assert all(type(seed) is int and 0 < seed <= 0xffffffff for seed in seeds)
    assert len(seeds) == len(set(seeds)) == 144 and not set(seeds).intersection(excluded)
    return critical


def motor(sensors, action, arm):
    assert arm in ARMS and type(action) is int and action in [-1, 1]
    assert isinstance(sensors, list) and len(sensors) == 5
    assert all(type(value) in (int, float) and math.isfinite(value) and abs(value) <= 1 for value in sensors)
    ahead, left, right, wall_left, wall_right = (float(value) for value in sensors)
    if arm == 'legacyFast':
        return [math.tanh(2*(right-left)+1.8*(wall_left-wall_right)), 0, 1, -1, 0], 6
    magnitude = ahead**2+left**2+right**2
    if magnitude == 0:
        return [math.tanh(1.8*(wall_left-wall_right)), 0, action, -1, 0], 9
    bearing = math.atan2(action*(right-left), action*ahead)
    if bearing == -math.pi:
        bearing = math.pi
    turn = max(-1, min(1, bearing/.28))
    move = -1 if abs(bearing) > .28 else 0
    return [turn, move, action, -1, 0], 16


def audit_probe(path, p, h, row, warm, warm_energies):
    runs = {}
    counts = {'probeDecisions': 0, 'probeMotors': 0, 'probeMotorOperations': 0,
              'probePhysicalReceipts': 0, 'probeBodySteps': 0, 'probeBodies': 0}
    founder_count = p['reference']['founders']
    start_tick = warm['endpoint']['tick']
    alive = {key for key, state in warm['learners'].items() if not state['dead']}
    common = None
    with path.open(encoding='utf8') as stream:
        for line in stream:
            event = json.loads(line)
            if event['stage'] != 'probe':
                continue
            arm, kind = event['arm'], event['type']
            assert arm in ARMS
            if kind == 'start':
                assert len(runs) < len(ARMS)
                assert arm == ARMS[len(runs)] and all(run['ended'] for run in runs.values())
                assert set(event['learners']) == set(warm['learners'])
                assert set(event['bodyEnergy']) == alive
                hash_value(event['initialWorldSha256'])
                assert event['initialWorldSha256'] == row['arms'][arm]['initialWorldSha256']
                hash_value(row['arms'][arm]['finalSha256'])
                baseline = {key: event[key] for key in ['initialWorldSha256', 'initialEnergy',
                            'initialWorldEnergy', 'initialTotals', 'bodyEnergy']}
                if common is None:
                    common = baseline
                assert baseline == common
                assert event['initialTotals'] == warm['endpoint']['totals']
                for key in alive:
                    close(event['bodyEnergy'][key], warm_energies[key], 'warmup body continuity')
                close(event['initialEnergy'], math.fsum(event['bodyEnergy'].values()), 'initial body energy')
                close(event['initialWorldEnergy'], event['initialEnergy']+warm['endpoint']['foodInventory'], 'transfer preserves world energy')
                states = {}
                for key, state in event['learners'].items():
                    assert state == initial_state(int(key), h['seed'], arm, key not in alive)
                    states[key] = {'initial': state, 'rng': state['rngState'], 'bytes': encoded(state),
                                   'energy': event['bodyEnergy'].get(key, 0), 'work': 0, 'ticks': 0,
                                   'decisions': 0, 'choice': 1, 'decisionTick': 0, 'pending': None, 'motors': 0,
                                   'last': start_tick, 'steps': 0, 'cost': 0., 'paid': 0.,
                                   'good': 0., 'discard': 0., 'byteSeconds': 0.}
                assert len(states) == founder_count
                runs[arm] = {'states': states, 'ended': False, 'start': event, 'clock': start_tick}
                counts['probeBodies'] += len(alive)
                continue
            assert arm in runs and not runs[arm]['ended'] and arm == list(runs)[-1]
            run = runs[arm]
            if kind in ['decision', 'motor']:
                assert type(event['tick']) is int and run['clock'] <= event['tick'] <= start_tick+256
                run['clock'] = event['tick']
            if kind in ['decision', 'motor', 'ledger']:
                state = run['states'][str(event['agentId'])]
                assert str(event['agentId']) in alive
            if kind == 'decision':
                assert state['pending'] is None
                assert not state['decisions'] or state['steps'] == 8
                assert state['discard'] == 0
                assert state['energy'] > 0
                assert event['tick'] == start_tick+1+state['decisions']*8 == state['last']+1
                assert event['tick'] <= start_tick+256
                choice = -1 if arm == 'refuse' else 1
                state['work'] += 1
                if arm == 'random':
                    state['rng'] = advance(state['rng'])
                    choice = -1 if state['rng']/4294967296 < .5 else 1
                    state['work'] += 6
                assert event['choice'] == choice and event['rngState'] == state['rng']
                state['choice'], state['decisionTick'] = choice, event['tick']
                state['pending'] = event['tick']
                state['decisions'] += 1
                counts['probeDecisions'] += 1
            elif kind == 'motor':
                assert state['pending'] is not None and state['motors'] < 8
                assert event['tick'] == state['pending']+state['motors']
                assert event['action'] == state['choice']
                outputs, operations = motor(event['sensors'], event['action'], arm)
                assert type(event['operations']) is int and event['operations'] == operations
                assert isinstance(event['outputs'], list) and len(event['outputs']) == 5
                for actual, expected in zip(event['outputs'], outputs):
                    assert type(actual) in (int, float)
                    close(actual, expected, 'pursuit motor output')
                state['motors'] += 1
                state['work'] += operations
                counts['probeMotors'] += 1
                counts['probeMotorOperations'] += operations
            elif kind == 'ledger':
                assert event['tick'] == state['pending'] == state['last']+1
                assert type(event['steps']) is int and 1 <= event['steps'] <= 8
                assert event['steps'] == state['motors']
                assert event['tick']+event['steps']-1 <= start_tick+256
                for key in ['initialEnergy', 'finalEnergy', 'cost', 'paidExtra', 'beneficialEaten', 'discarded', 'byteSeconds']:
                    assert math.isfinite(event[key]) and event[key] >= 0
                assert event['paidExtra'] <= event['cost']+1e-10
                close(event['initialEnergy'], state['energy'], 'probe receipt continuity')
                close(event['initialEnergy']-event['cost']+event['beneficialEaten']-event['discarded'], event['finalEnergy'], 'probe physical receipt')
                close(event['byteSeconds'], state['bytes']*.1*event['steps'], 'probe byte-time receipt')
                state['energy'] = event['finalEnergy']
                for field, key in [('cost', 'cost'), ('paid', 'paidExtra'), ('good', 'beneficialEaten'),
                                   ('discard', 'discarded'), ('byteSeconds', 'byteSeconds')]:
                    state[field] += event[key]
                state['ticks'] += event['steps']
                state['steps'] = event['steps']
                state['last'] = event['tick']+event['steps']-1
                state['pending'] = None
                state['motors'] = 0
                due = state['work']*p['pricing']['operationEnergy']+state['byteSeconds']*p['pricing']['byteEnergyPerSecond']
                assert state['paid'] <= due+1e-8
                counts['probePhysicalReceipts'] += 1
                counts['probeBodySteps'] += event['steps']
            elif kind == 'end':
                assert set(event['learners']) == set(run['states'])
                endpoint = event['endpoint']
                assert endpoint == row['arms'][arm]['endpoint']
                assert endpoint['founders'] == founder_count
                assert type(endpoint['tick']) is int and start_tick <= endpoint['tick'] <= start_tick+256
                debt, deaths, survivors = 0., 0, 0
                for key, final in event['learners'].items():
                    state = run['states'][key]
                    assert state['pending'] is None and state['motors'] == 0 and type(final['dead']) is bool
                    if key not in alive:
                        assert final == state['initial']
                        continue
                    assert state['ticks'] > 0 and state['last'] <= endpoint['tick']
                    assert final['dead'] or state['last'] == endpoint['tick']
                    assert not final['dead'] or state['energy'] == 0
                    assert final['dead'] or state['energy'] > 0
                    assert final['dead'] or state['discard'] == 0
                    deaths += int(final['dead'])
                    survivors += int(not final['dead'])
                    expected = {**state['initial'], 'rngState': state['rng'], 'heldAction': state['choice'],
                                'decisions': state['decisions'], 'ticks': state['ticks'],
                                'lastDecisionTick': state['decisionTick'], 'lastObservedTick': state['last'],
                                'dead': final['dead'], 'work': {'scalarOperations': state['work']}}
                    assert {field: value for field, value in final.items() if field != 'charge'} == {
                        field: value for field, value in expected.items() if field != 'charge'}
                    charge = final['charge']
                    assert set(charge) == set(state['initial']['charge'])
                    assert charge['operationsBilled'] == state['work'] and charge['storageBytes'] == state['bytes']
                    due = state['work']*p['pricing']['operationEnergy']+state['bytes']*.1*state['ticks']*p['pricing']['byteEnergyPerSecond']
                    close(due, charge['incurredEnergy'], 'probe full work/storage bill')
                    close(state['paid'], charge['paidEnergy'], 'probe paid energy')
                    assert charge['outstandingEnergy'] >= 0
                    close(due-state['paid'], charge['outstandingEnergy'], 'probe retained unpaid debt')
                    debt += charge['outstandingEnergy']
                states = list(run['states'].values())
                assert endpoint['survivors'] == survivors
                assert endpoint['tick'] == start_tick+256 or survivors == 0
                assert endpoint['tick'] == max((state['last'] for state in states), default=start_tick)
                close(endpoint['survival'], survivors/founder_count, 'all-founder survival')
                close(endpoint['outstandingEnergy'], debt, 'probe endpoint debt')
                assert endpoint['scalarOperations'] == sum(state['work'] for state in states)
                assert endpoint['encodedBytes'] == sum(state['bytes'] for state in states)
                body_energy = math.fsum(state['energy'] for state in states)
                close(endpoint['budgetAdjustedEnergyPerFounder'], (body_energy-run['start']['initialEnergy']-debt)/founder_count, 'probe all-founder energy delta')
                initial, totals = run['start']['initialTotals'], endpoint['totals']
                assert totals.keys() == initial.keys()
                for key in ['beneficialEaten', 'harmfulEaten', 'toxinDamage', 'births', 'birthEnergy', 'structuralMutations']:
                    if key in initial:
                        close(totals[key], initial[key], 'unchanged original-ecology '+key)
                assert totals['deaths']-initial['deaths'] == deaths
                causes = {key: totals['deathCauses'][key]-initial['deathCauses'][key] for key in ['energy', 'age']}
                assert all(type(value) is int and value >= 0 for value in causes.values())
                assert sum(causes.values()) == deaths
                assert causes['age'] >= sum(state['discard'] > 0 for state in states)
                close(totals['foodEaten']-initial['foodEaten'], math.fsum(state['good'] for state in states), 'probe food intake')
                close(totals['dissipated']-initial['dissipated'], math.fsum(state['cost']+state['discard'] for state in states), 'probe costs and death disposal')
                assert totals['externalEnergy'] >= initial['externalEnergy'] and endpoint['foodInventory'] >= 0
                close(endpoint['foodInventory']+body_energy+totals['dissipated']-initial['dissipated']-run['start']['initialWorldEnergy']-(totals['externalEnergy']-initial['externalEnergy']), 0, 'probe independent world conservation')
                close(endpoint['accountingResidual'], 0, 'probe world residual')
                run['ended'] = True
            else:
                raise AssertionError(('Unexpected probe event', kind))
    assert list(runs) == ARMS and all(run['ended'] for run in runs.values())
    return counts


def audit_trace(path, p, h, row):
    """Audit one engineering or frozen trace; directory audit verifies file hashes."""
    assert p['arms'] == ARMS and list(row['arms']) == ARMS and row['history'] == h
    warm, energies, counts = audit_warmup(Path(path), p, h, row)
    counts.update(audit_probe(Path(path), p, h, row, warm, energies))
    return counts


def survival_guard(rows, control, p):
    effects = [row['arms'][TARGET]['endpoint']['survival']-
               row['arms'][control]['endpoint']['survival'] for row in rows]
    if p.get('survivalArithmetic') != 'exact-founder-counts-v1':
        mean = math.fsum(effects)/len(effects)
        return {'control': control, 'effects': effects, 'mean': mean, 'passed': mean >= 0}
    founders = p['reference']['founders']
    assert type(founders) is int and founders > 0
    differences = []
    for row in rows:
        target, baseline = row['arms'][TARGET]['endpoint'], row['arms'][control]['endpoint']
        for endpoint in [target, baseline]:
            assert endpoint['founders'] == founders
            assert type(endpoint['survivors']) is int and 0 <= endpoint['survivors'] <= founders
            assert endpoint['survival'] == endpoint['survivors']/founders
        differences.append(target['survivors']-baseline['survivors'])
    mean = sum(differences)/(len(rows)*founders)
    return {'control': control, 'effects': effects, 'survivorDifferences': differences,
            'founders': founders, 'mean': mean, 'passed': sum(differences) >= 0}


def audit(directory):
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    protocol_hash = sha(directory/'protocol.json')
    critical = verify_protocol(directory, p)
    result_path = directory/'results.json'
    result = json.loads(result_path.read_text(encoding='utf8'))
    assert result['schema'] == 1 and result['histories'] == 16
    assert result['protocolSha256'] == protocol_hash and len(result['rowSha256']) == 16
    rows, counts = [], {}
    for index, history in enumerate(p['histories']):
        row_path = directory/'rows'/f"{history['seed']}.json"
        row = json.loads(row_path.read_text(encoding='utf8'))
        assert sha(row_path) == result['rowSha256'][index]
        assert row['schema'] == 1 and row['history'] == history and row['protocolSha256'] == protocol_hash
        trace = directory/'numerics'/f"{history['seed']}.jsonl"
        assert sha(trace) == row['numericsSha256']
        for key, value in audit_trace(trace, p, history, row).items():
            counts[key] = counts.get(key, 0)+value
        rows.append(row)
    assert [comparison['control'] for comparison in result['comparisons']] == CONTROLS
    assert [guard['control'] for guard in result['survival']] == CONTROLS
    for comparison, guard in zip(result['comparisons'], result['survival']):
        control = comparison['control']
        effects = [row['arms'][TARGET]['endpoint']['budgetAdjustedEnergyPerFounder']-
                   row['arms'][control]['endpoint']['budgetAdjustedEnergyPerFounder'] for row in rows]
        assert comparison['effects'] == effects
        mean = math.fsum(effects)/len(effects)
        se = math.sqrt(math.fsum((value-mean)**2 for value in effects)/(len(effects)-1)/len(effects))
        lower = mean-critical*se
        for key, value in [('mean', mean), ('se', se), ('lower', lower)]:
            close(comparison[key], value, control+' '+key)
        assert type(comparison['passed']) is bool and comparison['passed'] == (lower > 0)
        expected_guard = survival_guard(rows, control, p)
        assert set(guard) == set(expected_guard)
        close(guard['mean'], expected_guard['mean'], control+' survival guard')
        assert type(guard['passed']) is bool
        for key in expected_guard:
            if key != 'mean':
                assert guard[key] == expected_guard[key]
    assert result['learnerQualification'] is False
    assert type(result['passed']) is bool
    assert result['passed'] == (all(value['passed'] for value in result['comparisons']) and
                                all(value['passed'] for value in result['survival']))
    return {'schema': 1, 'passed': True, 'protocolSha256': protocol_hash,
            'resultsSha256': sha(result_path), 'warmupWorlds': 16, 'probeWorlds': 64, **counts,
            'scope': 'Frozen hashes and seed exclusions; unchanged extracted cue-authority warmup audit; every recorded pursuit/legacy motor input-output law and operation count, decisions, RNG, work, byte-time, energy/death ledgers, all-founder endpoints and seed-level statistics. No learner qualification.',
            'physicalEquality': 'Requires separate exact Node cold replay. Recorded sensors and aggregate receipts cannot independently establish sensor provenance, actual motor application, resource dynamics, death causes or world/checkpoint digests; matching arithmetic does not replace physical replay.'}


if __name__ == '__main__':
    directory = Path(sys.argv[1]).resolve()
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        result = audit(directory)
    assert not caught, [str(warning.message) for warning in caught]
    result['warnings'] = []
    with (directory/'numeric-audit.json').open('x', encoding='utf8', newline='\n') as output:
        json.dump(result, output, indent=2)
        output.write('\n')
    print(json.dumps(result))
