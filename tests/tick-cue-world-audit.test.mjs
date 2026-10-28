import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {tickWorldEngineeringRecord,worldSourceHashes} from '../scripts/tick-cue-engineering.mjs';

const python = process.env.SARSA_AUDIT_PYTHON || process.env.PYTHON || 'python';
const root = resolve('.');
let directory, record, recordPath;
const check = (script,path,output = null) => spawnSync(python,['-B',script,path,...(output ? ['--output',output] : [])],{encoding: 'utf8',cwd: root});
test.before(() => {
  directory = mkdtempSync(join(tmpdir(),'tick-cue-audit-'));
  recordPath = join(directory,'record.json');
  record = tickWorldEngineeringRecord(); writeFileSync(recordPath,JSON.stringify(record));
});
test.after(() => {
  assert.equal(dirname(resolve(directory)),resolve(tmpdir())); rmSync(directory,{recursive: true,force: true});
});

test('independent checker reconstructs all named world roles, phases, terminal debt and fourteen paired probe modes', () => {
  const output = join(directory,'numeric-audit.json'), result = check('scripts/audit-tick-cue.py',recordPath,output);
  assert.equal(result.status,0,result.stderr);
  const audit = JSON.parse(readFileSync(output,'utf8'));
  assert.equal(audit.passed,true); assert.equal(audit.cases,19); assert.equal(audit.probes,23);
  assert.ok(audit.decisions > 0 && audit.physicalReceipts === audit.decisions && audit.terminalObservations > 0);
  const bytes = readFileSync(output,'utf8'); assert.notEqual(check('scripts/audit-tick-cue.py',recordPath,output).status,0);
  assert.equal(readFileSync(output,'utf8'),bytes);
});

test('captured complete import closure independently audits and exact-JSON cold-replays outside the checkout', () => {
  const captured = join(directory,'captured');
  assert.deepEqual(record.sources,worldSourceHashes());
  for (const path of Object.keys(record.sources)) {
    const target = resolve(captured,path); assert.ok(target.startsWith(resolve(captured)+sep));
    mkdirSync(dirname(target),{recursive: true}); copyFileSync(resolve(root,path),target);
  }
  const independent = check(join(captured,'scripts/audit-tick-cue.py'),recordPath);
  assert.equal(independent.status,0,independent.stderr);
  const output = join(directory,'replay.json');
  const replay = spawnSync(process.execPath,[join(captured,'scripts/tick-cue-engineering.mjs'),'--replay',recordPath,'--output',output],{encoding: 'utf8',cwd: directory});
  assert.equal(replay.status,0,replay.stderr);
  assert.equal(JSON.parse(readFileSync(output,'utf8')).exactJsonReplay,true);
});

test('world audit rejects policy, ledger, native cost, death, coverage, saved-model and probe corruption', () => {
  const path = join(directory,'mutated.json');
  const event = (copy,kind) => copy.cases[0].events.find(row => row.type === kind);
  const probe = (copy,version) => copy.probes.find(row => row.parent === 'phase-candidate' && row.spec.family === 'transfer' && row.spec.version === version);
  const mutate = {
    choice: copy => {event(copy,'decision').choice = (event(copy,'decision').choice+1)%4;},
    rawEnergy: copy => {event(copy,'decision').own.raw[4] -= .1;},
    cue: copy => {event(copy,'decision').own.observation[0] = 1;},
    work: copy => {event(copy,'decision').scalarOperations++;},
    bytes: copy => {event(copy,'decision').storageBytes++;},
    appliedMotor: copy => {event(copy,'native-cost').outputs[0] += .1;},
    nativeCharge: copy => {event(copy,'native-cost').nativeMemoryRecords++;},
    cost: copy => {event(copy,'physical').cost += .01;},
    paid: copy => {event(copy,'physical').paidExtra += .01;},
    food: copy => {event(copy,'physical').beneficialEaten += .1;},
    terminal: copy => {copy.cases.find(row => row.name === 'age-extinction').events.find(row => row.type === 'observe').own.terminal = false;},
    discarded: copy => {copy.cases.find(row => row.name === 'age-extinction').events.find(row => row.type === 'observe').discardedEnergy = 0;},
    terminalDebt: copy => {copy.cases.find(row => row.name === 'age-extinction').events.find(row => row.type === 'observe').outstandingEnergy = 0;},
    missingReceipt: copy => {const rows = copy.cases[0].events; rows.splice(rows.findIndex(row => row.type === 'physical'),1);},
    missingRole: copy => {copy.cases.pop();},
    missingProbe: copy => {copy.probes.pop();},
    source: copy => {delete copy.sources['engine.mjs'];},
    denominator: copy => {copy.cases[0].endpoint.founders = 1;},
    horizon: copy => {copy.cases[0].ticks = 3;},
    savedWeight: copy => {copy.cases.find(row => row.name === 'phase-candidate').finalCheckpoint.state.savedModels.A['1'][0] += .1;},
    probeRefill: copy => {probe(copy,'C').events[0].world.world.flies[0].energy += 1;},
    probeWeights: copy => {probe(copy,'C').events.at(-1).learners['1'].weights[0] += .1;},
    probeReset: copy => {probe(copy,'reset').result.resetInitializationOperations = 0;},
    probeUnusedCircuit: copy => {probe(copy,'accept').events[0].learners['1'].weights = [1];},
    probeDebt: copy => {copy.probes.find(row => row.parent === 'partial-mortality').events[0].startingDebt = 0;},
    probeHorizon: copy => {probe(copy,'C').ticks = 1;},
    pairedWorld: copy => {probe(copy,'C').events[0].world.world.food[0].x += 1;}
  };
  for (const [name,change] of Object.entries(mutate)) {
    const copy = structuredClone(record); change(copy); writeFileSync(path,JSON.stringify(copy));
    const result = check('scripts/audit-tick-cue.py',path);
    assert.notEqual(result.status,0,`${name} accepted`); assert.match(result.stderr,/AssertionError/,`${name}: ${result.stderr}`);
  }
});
