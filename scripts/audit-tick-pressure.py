"""Independent snapshot-intervention and raw-contrast reconstruction.

Reuses the independently implemented Python policy/ledger checker. Geometry,
resource provenance and native execution still require captured-source Node replay.
"""
import argparse
import copy
import hashlib
import json
import re
import runpy
from pathlib import Path

WORLD = runpy.run_path(str(Path(__file__).with_name('audit-tick-cue.py')))
same = WORLD['same']
SPECS = [('A', 'A'), ('A', 'B'), ('A', 'C'), ('A', 'reset'), ('B', 'A'), ('B', 'B'), ('B', 'reset')]


def sources(record, root):
    found = {}
    def visit(path):
        path = path.resolve()
        name = path.relative_to(root.resolve()).as_posix()
        if name in found:
            return
        data = path.read_bytes()
        found[name] = hashlib.sha256(data).hexdigest()
        if path.suffix in ('.js', '.mjs'):
            for imported in re.findall(r'''(?:from|import)\s+['"](\.[^'"]+)['"]''', data.decode('utf-8')):
                visit(path.parent/imported)
    for name in ['scripts/tick-pressure-engineering.mjs', 'scripts/audit-tick-pressure.py',
                 'scripts/audit-tick-cue.py', 'scripts/audit-tick-actor-critic.py', 'tests/tick-pressure.test.mjs',
                 'tests/tick-cue-world-audit.test.mjs']:
        visit(root/name)
    same(record['sources'], found, 'pressure source closure')


def effects(battery):
    values, food = {}, {}
    for probe in battery['probes']:
        family, version, result = probe['family'], probe['version'], probe['result']
        assert (result['family'], result['version']) == (family, version)
        assert result['founders'] == battery['founders']
        assert result['resourceSeed'] == battery['seeds'][family]
        if version != 'reset':
            same(result['resetInitializationEnergyPerFounder'], 0)
        values[family, version] = result['value']+result['resetInitializationEnergyPerFounder']
        totals = result.get('endpoint', {}).get('totals')
        food[family, version] = (totals['beneficialEaten']-totals['toxinDamage'])/battery['founders'] if totals else 0
    a_skill = values['A', 'A']-values['A', 'reset']
    return dict(aSkillWithoutResetConstruction=a_skill,
                bSkillWithoutResetConstruction=values['B', 'B']-values['B', 'reset'],
                bAcquisition=values['B', 'B']-values['B', 'A'],
                aInterference=values['A', 'A']-values['A', 'B']-.05*a_skill,
                aNetFoodInterference=food['A', 'A']-food['A', 'B'],
                aFinalRetention=values['A', 'C']-.95*values['A', 'A']-.05*values['A', 'reset'])


def audit(record, root):
    assert record['schema'] == 1 and record['kind'] == 'tick-pressure-engineering'
    sources(record, root)
    base = record['base']
    base_audit = WORLD['audit_record'](base, root)
    assert [case['parent'] for case in record['cases']] == ['phase-candidate', 'partial-mortality', 'age-extinction', 'absent-end-C']
    decisions = probes = 0
    for case in record['cases']:
        parent = next((row for row in base['cases'] if row['name'] == case['parent']), None)
        battery = case['battery']
        same(json.loads(case['checkpointJson']), case['checkpoint'], 'checkpoint JSON binding')
        same(hashlib.sha256(case['checkpointJson'].encode('utf-8')).hexdigest(), battery['sourceCheckpointSha256'], 'source checkpoint hash')
        assert battery['schema'] == 1 and battery['kind'] == 'tick-functional-pressure-battery'
        same(battery['seeds'], dict(A=17049, B=17049))
        assert battery['founders'] == 2
        assert [(row['family'], row['version']) for row in battery['probes']] == SPECS
        same(battery['sham'], battery['probes'][0]['result'], 'identical reinstall sham')
        parent_audit = WORLD['audit_case'](parent, base['config']) if parent else None
        if parent:
            expected = copy.deepcopy(parent['finalCheckpoint']['atC'] if case['parent'] == 'phase-candidate' else parent['finalCheckpoint'])
            if case['parent'] != 'phase-candidate':
                for family in ['A', 'B']:
                    expected['state']['savedModels'][family] = {key: copy.deepcopy(state['weights']) for key, state in expected['state']['learners'].items()}
                    parent_audit.saved[family] = copy.deepcopy(expected['state']['savedModels'][family])
            same(case['checkpoint'], expected, 'source checkpoint identity')
        else:
            assert case['checkpoint'] is None and not case['events']
        expected_roles = [f'{family}:{version}' for family, version in SPECS]+['sham']
        same(sorted(case['events']), sorted(expected_roles) if parent else [], 'pressure role coverage')
        starts = {}
        for index, (family, version) in enumerate(SPECS+[('A', 'A')]):
            role = f'{family}:{version}' if index < 7 else 'sham'
            result = battery['probes'][index]['result'] if index < 7 else battery['sham']
            events = case['events'].get(role, [])
            counts = WORLD['audit_probe'](dict(parent=case['parent'], spec=dict(family=family, version=version),
                                              ticks=2, resourceSeed=17049, events=events, result=result), parent, parent_audit)
            probes += 1
            decisions += counts['decisions']
            if events:
                world = events[0]['world']
                if family in starts:
                    same(world, starts[family], 'paired complete pressure worlds')
                starts[family] = world
        if parent:
            same(case['events']['sham'], case['events']['A:A'], 'sham event identity')
        same(case['effects'], effects(battery), 'raw pressure contrasts')
    return dict(schema=1, passed=True, cases=len(record['cases']), probes=probes, decisions=decisions,
                base=base_audit, scope='Engineering snapshot roles, paired physical states, policy/ledger arithmetic and raw contrasts. No statistical qualification or demonstrated functional pressure.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('record', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    result = audit(json.loads(args.record.read_text(encoding='utf-8')), Path(__file__).resolve().parents[1])
    text = json.dumps(result, indent=2)+'\n'
    if args.output:
        with args.output.open('x', encoding='utf-8') as stream:
            stream.write(text)
    else:
        print(text, end='')
