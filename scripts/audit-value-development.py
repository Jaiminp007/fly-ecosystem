import argparse
import copy
import gzip
import hashlib
import json
import math
import re
import runpy
import time
import warnings
from pathlib import Path

WORLD = runpy.run_path(str(Path(__file__).with_name('audit-value-cue.py')))
STATS = runpy.run_path(str(Path(__file__).with_name('audit-value-statistics.py')))
CORE, same = WORLD['CORE'], WORLD['same']


def sha(path):
    result = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            result.update(chunk)
    return result.hexdigest()


def activity(states):
    active=sum(s['work']['liveUpdates']>0 and any(abs(v)>1e-12 for row in s['weights'] for v in row) for s in states.values())
    return dict(founders=len(states),decisions=sum(s['decisions'] for s in states.values()),
        updates=sum(s['work']['liveUpdates'] for s in states.values()),activeFounders=active,passed=active>=len(states)/2)


def sources(directory, p):
    source_root = directory/'sources'
    executed_root = Path(__file__).resolve().parents[1]
    assert executed_root == source_root.resolve(), 'Execute captured independent entrypoint'
    found = {}
    def visit(path):
        path = path.resolve()
        name = path.relative_to(source_root.resolve()).as_posix()
        if name in found:
            return
        found[name] = sha(path)
        if path.suffix in ('.js', '.mjs'):
            for imported in re.findall(r'''(?:from|import)\s+['"](\.[^'"]+)['"]''', path.read_text(encoding='utf8')):
                visit(path.parent/imported)
    for name in ['scripts/value-development.mjs','scripts/audit-value-development.py','scripts/audit-value-statistics.py',
                 'scripts/audit-value-cue.py','scripts/audit-tick-value.py','scripts/audit-tick-cue.py','scripts/audit-tick-actor-critic.py',
                 'docs/VALUE_LEARNING_DEVELOPMENT.md','tests/value-development.test.mjs','tests/value-development-audit.test.mjs']:
        visit(source_root/name)
    same(found, p['sourceSha256'], 'complete source closure')
    excluded = {41} | set(range(250001, 250513)) | set(range(252001,252513))
    def seeds(value, key=''):
        if isinstance(value, list):
            for v in value:
                seeds(v, key)
        elif isinstance(value, dict):
            for k, v in value.items():
                seeds(v, key if re.search('seed', key, re.I) else k)
        elif re.search('seed', key, re.I) and type(value) is int and 0 < value <= 0xffffffff:
            excluded.add(value)
    for r in p['seedRegistries']:
        path = directory/'registries'/r['path']
        assert sha(path) == r['sha256']
        seeds(json.loads(path.read_text(encoding='utf8')))
    for r in p['engineeringSources']:
        path = directory/'engineering'/r['path']
        assert sha(path) == r['sha256']
        for token in re.findall(r'\b(?:0x[\da-f]+|\d[\d_]*)\b', path.read_text(encoding='utf8'), re.I):
            value = int(token.replace('_', ''), 16 if token.lower().startswith('0x') else 10)
            if 0 < value <= 0xffffffff:
                excluded.add(value)
    assert sorted(excluded) == p['excludedSeeds'], 'seed exclusions reconstructed'


def start_main(event, p, h):
    cp, arm = event['checkpoint'], event['arm']
    wrapper, world = cp['state'], cp['world']['world']
    assert wrapper['arm'] == arm and world['tick'] == 0 and not cp['atC']
    assert wrapper['founderIds'] == list(range(1, p['reference']['founders']+1))
    same(wrapper['historySpec'], h)
    same(wrapper['pricing'], p['pricing'])
    same(wrapper['reference'], p['reference'])
    same(wrapper['codebook'], WORLD['WORLD']['codebook'](h['cueSeed']))
    assert world['config']['cueForaging'] and not world['config']['reproduction'] and not world['config']['mutation']
    assert world['config']['learning'] == (arm == 'incumbent')
    assert world['config']['episodicParameters']['memoryLearning'] == (arm == 'incumbent')
    assert world['config']['episodicParameters']['neuralLearning'] == (arm == 'incumbent')
    for key, state in wrapper['learners'].items():
        agent_id = int(key)
        seed = (h['seed'] ^ ((agent_id*2654435761) & 0xffffffff)) & 0xffffffff or 1
        kind=WORLD['program'](arm)
        expected=WORLD['VALUE']['create'](agent_id,seed,0 if arm=='lambda0' else .9) if kind=='value' else CORE['create_body'](agent_id,seed) if kind=='actor' else WORLD['fixed_state'](agent_id,seed,arm)
        same(state, expected, 'initial own body')
    assert cp['kind']=='joint-value-cue-experiment' and wrapper['program']==WORLD['program'](arm)
    return WORLD['AuditValueWorld'](cp)


def start_probe(event,checkpoint,spec,p,h):
    states=copy.deepcopy(checkpoint['state']['learners'])
    fixed='acceptCruise' if spec['version']=='accept' else 'acceptStationary' if spec['version']=='acceptStationary' else None
    operations=0
    for key,current in list(states.items()):
        if fixed:
            new=WORLD['fixed_state'](current['agentId'],current['rngState'],fixed,current['lastObservedTick'])
            new['dead'],new['charge']=current['dead'],copy.deepcopy(current['charge'])
            new['charge']['operationsBilled'],new['charge']['storageBytes']=0,0
            states[key]=new
        else:
            operations+=current['work']['scalarOperations']
            if spec['version'] in ('A','B'):
                current['weights']=copy.deepcopy(checkpoint['state']['savedModels'][spec['version']][key])
            if spec['version']=='reset': current['weights']=WORLD['VALUE']['zeros']()
            WORLD['freeze_value'](current)
            current.update(previous=None,recent=[],older=[],olderSeen=0,acquiredTransitions=0)
            current['charge']['storageBytes']=0
    assert event['type']=='probe-start' and event['ticks']==256 and event['inferenceOnlyCompaction']
    same(event['learners'],states,'compact probe installed states and carried debts')
    same(event['spec'],spec);same(event['resourceSeed'],h['probeSeeds'][spec['family']])
    assert event['resetInitializationOperations']==0
    for field in ['flies','rng','ecologyRng']:
        same(event['world']['world'][field],checkpoint['world']['world'][field],'common probe '+field)
    same(sum(v['amount'] for v in event['world']['world']['food']),sum(v['amount'] for v in checkpoint['world']['world']['food']),'no probe refill')
    transfer=spec['family']=='transfer'
    assert event['world']['world']['config']['cueForaging']==(not transfer)
    if not transfer:
        expected=copy.deepcopy(checkpoint['world']['world']['food'])
        WORLD['cue_layout'](expected,checkpoint['state']['codebook'],spec['family'],h['probeSeeds'][spec['family']])
        same([v['cue'] for v in event['world']['world']['food']],[v['cue'] for v in expected],'probe family cue assignment')
        same([dict(x=v['x'],y=v['y']) for v in event['world']['world']['food']],[dict(x=v['x'],y=v['y']) for v in expected])
    energy=sum(f['energy'] for f in checkpoint['world']['world']['flies'])
    debt=sum(s['charge']['outstandingEnergy'] for s in states.values())
    same(event['startingEnergy'],energy);same(event['startingDebt'],debt)
    wrapper=copy.deepcopy(checkpoint['state'])
    wrapper.update(arm=fixed or 'frozen',program='fixed' if fixed else 'value',learners=states,startingEnergy=energy,startingDebt=debt,
        startingOperations=operations,probe=True,transfer=transfer,phaseIndex=['A','B','C'].index('A' if transfer else spec['family']))
    assert event['arm']==wrapper['arm'] and event['program']==wrapper['program']
    return WORLD['AuditValueWorld'](dict(state=wrapper,world=event['world']),states),0


def audit_trace(path, p, h, row, runtime_guard=lambda:None):
    active, arm, at_c, c_anchor = None, None, None, None
    mains, probes, physical_starts, main_worlds = {}, {}, {}, {}
    reset_operations, spec, role = 0, None, None
    raw_hash, raw_bytes, totals = hashlib.sha256(), 0, dict(decisions=0, physicalReceipts=0, terminalObservations=0, transitions=0)
    signatures, current_signature, ended = {}, None, False
    next_probe = 0
    expected_roles = [f'probe:{family}:{version}' for family, version in STATS['SPECS']]+['sham']
    with gzip.open(path, 'rb') as stream:
        for index,line in enumerate(stream):
            if index%2048==0: runtime_guard()
            raw_hash.update(line)
            raw_bytes += len(line)
            assert raw_bytes <= p['budget']['maxUncompressedTraceBytesPerHistory']
            e = json.loads(line)
            assert not ended, 'trailing events'
            if e.get('type') == 'main-start':
                assert active is None and e['arm'] == p['arms'][len(mains)] and next_probe == 0
                arm = e['arm']
                active = start_main(e, p, h)
                main_worlds[arm] = e['checkpoint']['world']
            elif e.get('type') == 'main-end':
                assert active is not None and arm == e['arm']
                assert active.completed == 1792 or not active.live
                cp = e['checkpoint']
                assert active.current is None and not active.buffer
                active.endpoint(e['endpoint'])
                final_flies = {str(fly['id']): fly for fly in cp['world']['world']['flies']}
                assert set(final_flies) == active.live
                for key, fly in final_flies.items():
                    same(fly['energy'], active.energy[key], 'final checkpoint body energy')
                    same(fly['age'], active.age[key], 'final checkpoint body age')
                    same(dict(x=fly['x'],y=fly['y']),active.positions[key],'final checkpoint body position')
                same(cp['world']['world']['totals'], e['endpoint']['totals'])
                same(cp['state']['learners'], active.states, 'final main models')
                same(cp['state']['savedModels'], active.saved)
                same(cp['state']['phaseRows'], active.phase_rows)
                if arm == 'candidate':
                    at_c = cp['atC']
                    assert bool(at_c) == (c_anchor is not None), 'end-C checkpoint coverage'
                    if at_c:
                        assert at_c['world']['world']['tick'] == 1536
                        same(at_c['state']['learners'], active.anchor, 'end-C audited anchor')
                        same(at_c['state']['savedModels'], active.saved)
                        c_flies = {str(fly['id']): fly for fly in at_c['world']['world']['flies']}
                        assert set(c_flies) == c_anchor['live'], 'end-C founder coverage'
                        for key, fly in c_flies.items():
                            same(fly['energy'], c_anchor['energy'][key], 'end-C source body energy')
                            same(fly['age'], c_anchor['age'][key], 'end-C source body age')
                            same(dict(x=fly['x'],y=fly['y']),c_anchor['positions'][key],'end-C source body position')
                        same(at_c['world']['world']['totals'], c_anchor['endpoint']['totals'])
                        same(sum(v['amount'] for v in at_c['world']['world']['food']), c_anchor['endpoint']['foodInventory'], 'end-C source inventory')
                mains[arm] = dict(endpoint=e['endpoint'], phases=active.phase_rows,
                                  activity=activity(active.states) if arm == 'candidate' else None)
                for key in totals:
                    totals[key] += active.counts[key]
                active, arm = None, None
            elif e.get('type') == 'history-end':
                assert active is None and list(mains) == p['arms']
                for name, expected in mains.items():
                    for key, value in expected.items():
                        same(row['arms'][name][key], value, 'row main '+key)
                same(e['row'], {key: row[key] for key in e['row']}, 'history row binding')
                if at_c is None:
                    assert not probes and next_probe == 0 and row['endCCheckpointSha256'] is None
                    for result in row['probes']+[row['sham']]:
                        same(result, dict(family=result['family'], version=result['version'], resourceSeed=h['probeSeeds'][result['family']], founders=p['reference']['founders'],
                                          survivors=0, survival=0, value=0, skippedAllDead=True, startWorldSha256=None,
                                          resetInitializationOperations=0, resetInitializationEnergyPerFounder=0))
                else:
                    assert next_probe == len(expected_roles) and list(probes) == expected_roles
                    for spec, result in zip(p['probes'], row['probes']):
                        observed = probes[f"probe:{spec['family']}:{spec['version']}"]
                        verify_probe_result(result, observed, spec, p, h)
                    verify_probe_result(row['sham'], probes['sham'], dict(family='A', version='A'), p, h)
                    assert signatures['probe:A:A'] == signatures['sham'], 'exact event sham'
                common = [v for name, v in main_worlds.items() if name not in ('incumbent', 'nullCandidate', 'nullBlind')]
                assert all(v == common[0] for v in common)
                assert main_worlds['nullCandidate'] == main_worlds['nullBlind']
                ended = True
            else:
                event_role, event = e['role'], e['event']
                if event_role.startswith('main:'):
                    assert active is not None and event_role == 'main:'+arm
                    active.events([event], complete=False)
                    if arm == 'candidate' and event['type'] == 'phase-end' and event['phase'] == 'C':
                        c_anchor = dict(live=set(active.live), energy=copy.deepcopy(active.energy), age=copy.deepcopy(active.age), positions=copy.deepcopy(active.positions), endpoint=copy.deepcopy(event['endpoint']))
                elif event['type'] == 'probe-start':
                    assert active is None and at_c is not None and event_role == expected_roles[next_probe]
                    role = event_role
                    spec = dict(family='A', version='A') if role == 'sham' else p['probes'][next_probe]
                    active, reset_operations = start_probe(event, at_c, spec, p, h)
                    current_signature = hashlib.sha256()
                    start_world = event['world']
                    if spec['family'] in physical_starts:
                        same(start_world, physical_starts[spec['family']], 'paired full probe world')
                    physical_starts[spec['family']] = start_world
                    start_hash = event['startWorldSha256']
                    skipped = not bool(active.live)
                else:
                    assert active is not None and event_role == role and arm is None
                    if event['type'] == 'probe-end':
                        assert active.completed == 1792 or not active.live
                        assert active.current is None and not active.buffer
                        active.endpoint(event['endpoint'])
                        same(event['learners'], active.states, 'final frozen models')
                        assert active.counts['transitions'] == 0
                        probes[role] = dict(endpoint=event['endpoint'], reset=reset_operations, start_hash=start_hash, skipped=skipped)
                        for key in totals:
                            totals[key] += active.counts[key]
                    else:
                        active.events([event], complete=False)
                if not event_role.startswith('main:'):
                    current_signature.update(json.dumps(event, sort_keys=True, separators=(',', ':')).encode())
                    if event['type'] == 'probe-end':
                        signatures[role] = current_signature.hexdigest()
                        active = None
                        next_probe += 1
    assert ended and active is None
    assert raw_bytes == row['uncompressedBytes'] and raw_hash.hexdigest() == row['uncompressedSha256']
    return totals


def verify_probe_result(result, observed, spec, p, h):
    assert result['family'] == spec['family'] and result['version'] == spec['version']
    assert result['resourceSeed'] == h['probeSeeds'][spec['family']]
    same(result['endpoint'], observed['endpoint'])
    for field in ['founders', 'survivors', 'survival']:
        same(result[field], observed['endpoint'][field])
    same(result['value'], observed['endpoint']['budgetAdjustedEnergyPerFounder'])
    same(result['resetInitializationOperations'], observed['reset'])
    same(result['resetInitializationEnergyPerFounder'], observed['reset']*p['pricing']['operationEnergy']/p['reference']['founders'])
    assert result['startWorldSha256'] == observed['start_hash'] and result['skippedAllDead'] == observed['skipped']
    assert result['acquisitionDisabled'] and result['learnedWeightsUnchanged'] and result['inferenceOnlyCompaction']


def audit(directory, phase):
    start, cpu = time.monotonic(), time.process_time()
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    STATS['validate_protocol'](p)
    sources(directory, p)
    protocol_hash = sha(directory/'protocol.json')
    previous = None
    if phase=='confirmation':
        development=json.loads((directory/'development/results.json').read_text(encoding='utf8'))
        assert development['promising'] is True,'Failed development: confirmation closed'
        for name in ['physical-audit.json','numeric-audit.json']:
            approval=json.loads((directory/'development'/name).read_text(encoding='utf8'))
            assert approval['passed'] is True and approval['protocolSha256']==protocol_hash
            assert approval['resultsSha256']==sha(directory/'development/results.json')
        previous=json.loads((directory/'development/numeric-audit.json').read_text(encoding='utf8'))
    def runtime_guard():
        assert time.monotonic()-start+(previous['runtimeTotals']['wallSeconds'] if previous else 0)<=p['budget']['maxIndependentAuditWallSeconds'],'Independent audit wall ceiling'
        assert time.process_time()-cpu+(previous['runtimeTotals']['cpuSeconds'] if previous else 0)<=p['budget']['maxIndependentAuditCpuSeconds'],'Independent audit CPU ceiling'
    runtime_guard()
    folder = directory/phase
    result = json.loads((folder/'results.json').read_text(encoding='utf8'))
    assert result['protocolSha256'] == protocol_hash
    rows, totals = [], dict(decisions=0, physicalReceipts=0, terminalObservations=0, transitions=0)
    for index, h in enumerate(p[phase+'Histories']):
        path = folder/'rows'/f"{h['seed']}.json"
        row = json.loads(path.read_text(encoding='utf8'))
        assert row['history'] == h and row['protocolSha256'] == protocol_hash and sha(path) == result['rowSha256'][index]
        trace = folder/'numerics'/f"{h['seed']}.jsonl.gz"
        assert sha(trace) == row['numericsSha256'] and trace.stat().st_size == row['compressedBytes'] <= p['budget']['maxCompressedTraceBytesPerHistory']
        for key, value in audit_trace(trace, p, h, row,runtime_guard).items():
            totals[key] += value
        rows.append(row)
    inference = STATS['audit_score'](rows, p, phase, result)
    collection_previous = json.loads((directory/'development'/'results.json').read_text(encoding='utf8')) if phase == 'confirmation' else None
    expected_runtime = dict(wallSeconds=sum(row['runtime']['wallSeconds'] for row in rows)+(collection_previous['runtimeTotals']['wallSeconds'] if collection_previous else 0),
                            cpuMicroseconds=sum(row['runtime']['cpuMicroseconds'] for row in rows)+(collection_previous['runtimeTotals']['cpuMicroseconds'] if collection_previous else 0))
    same(result['runtimeTotals'], expected_runtime)
    assert expected_runtime['wallSeconds'] <= p['budget']['maxCollectionWallSeconds'] and expected_runtime['cpuMicroseconds'] <= p['budget']['maxCollectionCpuMicroseconds']
    operations = sum(sum(v['endpoint']['scalarOperations'] for v in row['arms'].values())+
        sum(v.get('endpoint', {}).get('additionalScalarOperations', 0) for v in row['probes'])+row['sham'].get('endpoint', {}).get('additionalScalarOperations', 0) for row in rows)
    operations += collection_previous['policyScalarOperations'] if collection_previous else 0
    assert result['policyScalarOperations'] == operations <= p['budget']['maxPolicyScalarOperations']
    assert sum(path.stat().st_size for path in directory.rglob('*') if path.is_file()) <= p['budget']['maxEvidenceBytes']
    previous = json.loads((directory/'development'/'numeric-audit.json').read_text(encoding='utf8')) if phase == 'confirmation' else None
    runtime = dict(wallSeconds=time.monotonic()-start+(previous['runtimeTotals']['wallSeconds'] if previous else 0),
                   cpuSeconds=time.process_time()-cpu+(previous['runtimeTotals']['cpuSeconds'] if previous else 0))
    assert runtime['wallSeconds'] <= p['budget']['maxIndependentAuditWallSeconds'] and runtime['cpuSeconds'] <= p['budget']['maxIndependentAuditCpuSeconds']
    return dict(schema=1, passed=True, phase=phase, protocolSha256=protocol_hash, resultsSha256=sha(folder/'results.json'),
                **inference, **totals, runtimeTotals=runtime,
                scope='Independent full policy/ledger/probe-role/contrast/inference reconstruction. Native sensor/policy/noise and resource provenance require exact captured-source replay; no RSI claim.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('phase', choices=['development', 'confirmation'])
    args = parser.parse_args()
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        result = audit(args.directory.resolve(), args.phase)
    assert not caught, [str(w.message) for w in caught]
    result['warnings'] = []
    with (args.directory/args.phase/'numeric-audit.json').open('x', encoding='utf8') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print(json.dumps(result))
