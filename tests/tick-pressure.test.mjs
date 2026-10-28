import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {tickPressureEngineeringRecord,pressureSourceHashes} from '../scripts/tick-pressure-engineering.mjs';
import {TICK_PRESSURE_SPECS,tickPressureEffects} from '../learning/tick-cue-pressure.mjs';

const python = process.env.SARSA_AUDIT_PYTHON || process.env.PYTHON || 'python';
const root = resolve('.');
let directory, record, path;
const check = (file,script = 'scripts/audit-tick-pressure.py',output = null) => spawnSync(python,
  ['-B',script,file,...(output ? ['--output',output] : [])],{encoding: 'utf8',cwd: root});
test.before(() => {
  directory = mkdtempSync(join(tmpdir(),'tick-pressure-'));
  record = tickPressureEngineeringRecord(); path = join(directory,'record.json'); writeFileSync(path,JSON.stringify(record));
});
test.after(() => {
  assert.equal(dirname(resolve(directory)),resolve(tmpdir())); rmSync(directory,{recursive: true,force: true});
});

test('pressure battery reinstates actual saved weights, keeps paired bodies/debt, and includes an exact sham', () => {
  assert.deepEqual(record.sources,pressureSourceHashes());
  for (const row of record.cases) {
    const {battery,events} = row;
    assert.deepEqual(battery.probes.map(({family,version}) => ({family,version})),TICK_PRESSURE_SPECS);
    assert.deepEqual(battery.sham,battery.probes[0].result);
    if (row.checkpoint) {
      assert.deepEqual(events.sham,events['A:A']);
      for (const version of ['A','B','C','reset']) assert.deepEqual(events[`A:${version}`][0].world,events['A:A'][0].world);
      for (const version of ['A','B']) for (const [id,state] of Object.entries(events[`A:${version}`][0].learners)) {
        assert.deepEqual(state.weights,row.checkpoint.state.savedModels[version][id]);
        assert.equal(state.acquisition,false); assert.equal(state.pending,null);
      }
    }
    if (row.parent === 'absent-end-C' || row.parent === 'age-extinction') {
      assert.ok(Object.values(row.effects).every(value => value === 0));
    }
  }
});

test('functional contrasts require acquired skills, substantial interference, physical food change, and final recovery separately', () => {
  const values = [10,6,9.9,1,0,10,1], battery = {schema: 1,kind: 'tick-functional-pressure-battery',founders: 2,seeds: {A: 1,B: 2}};
  battery.probes = TICK_PRESSURE_SPECS.map((spec,index) => ({...spec,result: {...spec,value: values[index],founders: 2,
    resourceSeed: battery.seeds[spec.family],startWorldSha256: spec.family,
    resetInitializationEnergyPerFounder: spec.version === 'reset' ? 1 : 0,
    endpoint: {totals: {beneficialEaten: values[index]*2,toxinDamage: 0}}}}));
  battery.sham = structuredClone(battery.probes[0].result);
  const effect = tickPressureEffects(battery);
  assert.equal(effect.aSkillWithoutResetConstruction,8); assert.equal(effect.bSkillWithoutResetConstruction,8);
  assert.equal(effect.bAcquisition,10); assert.equal(effect.aInterference,3.6);
  assert.equal(effect.aNetFoodInterference,4); assert.ok(Math.abs(effect.aFinalRetention-.3)<1e-12);
  const noInterference = structuredClone(battery); noInterference.probes[1].result.value = 10;
  assert.ok(tickPressureEffects(noInterference).aInterference < 0);
  const costsOnly = structuredClone(battery); costsOnly.probes[0].result.value = 2; costsOnly.sham = structuredClone(costsOnly.probes[0].result);
  assert.equal(tickPressureEffects(costsOnly).aSkillWithoutResetConstruction,0);
  const missing = structuredClone(battery); missing.probes.pop(); assert.throws(() => tickPressureEffects(missing));
  const unfair = structuredClone(battery); unfair.probes[1].result.startWorldSha256 = 'foreign'; assert.throws(() => tickPressureEffects(unfair));
});

test('independent Python reconstructs pressure intervention, mortality cases, sham and raw effects without overwriting outputs', () => {
  const output = join(directory,'audit.json'), result = check(path,undefined,output);
  assert.equal(result.status,0,result.stderr);
  const audit = JSON.parse(readFileSync(output,'utf8'));
  assert.equal(audit.passed,true); assert.equal(audit.cases,4); assert.equal(audit.probes,32);
  assert.ok(audit.decisions>0); assert.notEqual(check(path,undefined,output).status,0);
});

test('full captured source closure independently audits and cold-replays outside the checkout', () => {
  const captured = join(directory,'sources');
  for (const name of Object.keys(record.sources)) {
    const target = resolve(captured,name); assert.ok(target.startsWith(resolve(captured)+sep));
    mkdirSync(dirname(target),{recursive: true}); copyFileSync(resolve(root,name),target);
  }
  const independent = check(path,join(captured,'scripts/audit-tick-pressure.py'));
  assert.equal(independent.status,0,independent.stderr);
  const output = join(directory,'replay.json');
  const replay = spawnSync(process.execPath,[join(captured,'scripts/tick-pressure-engineering.mjs'),'--replay',path,'--output',output],{encoding: 'utf8',cwd: directory});
  assert.equal(replay.status,0,replay.stderr); assert.equal(JSON.parse(readFileSync(output,'utf8')).exactJsonReplay,true);
});

test('independent audit rejects missing roles, foreign weights, body/RNG/debt changes, altered effects and false sham', () => {
  const mutations = {
    role: copy => copy.cases[0].battery.probes.pop(),
    sourceHash: copy => {copy.cases[0].battery.sourceCheckpointSha256 = '0'.repeat(64);},
    savedWeights: copy => {copy.cases[0].events['A:B'][0].learners['1'].weights[0] += .1;},
    body: copy => {copy.cases[0].events['A:B'][0].world.world.flies[0].energy++;},
    rng: copy => {copy.cases[0].events['A:B'][0].learners['1'].rngState++;},
    debt: copy => {copy.cases[1].events['A:B'][0].startingDebt = 0;},
    acquisition: copy => {copy.cases[0].events['A:B'][0].learners['1'].acquisition = true;},
    pressureEffect: copy => {copy.cases[0].effects.aInterference += 1;},
    resetCredit: copy => {copy.cases[0].battery.probes[3].result.resetInitializationEnergyPerFounder = 0;},
    sham: copy => {copy.cases[0].battery.sham.value += 1;},
    source: copy => {delete copy.sources['learning/tick-cue-pressure.mjs'];},
    allDead: copy => {copy.cases[3].battery.probes[0].result.value = 1;}
  };
  const altered = join(directory,'altered.json');
  for (const [name,change] of Object.entries(mutations)) {
    const copy = structuredClone(record); change(copy); writeFileSync(altered,JSON.stringify(copy));
    const result = check(altered); assert.notEqual(result.status,0,`${name} accepted`); assert.match(result.stderr,/AssertionError/,`${name}: ${result.stderr}`);
  }
});
