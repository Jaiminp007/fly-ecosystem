import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {tickEngineeringRecord} from '../scripts/tick-actor-critic-engineering.mjs';

const python = process.env.SARSA_AUDIT_PYTHON || process.env.PYTHON || 'python';
const root = resolve('.');
const audit = (path, output = null) => spawnSync(python,['-B','scripts/audit-tick-actor-critic.py',path,
  ...(output ? ['--output',output] : [])],{cwd: root,encoding: 'utf8'});
const clean = directory => {
  assert.equal(dirname(resolve(directory)),resolve(tmpdir()));
  rmSync(directory,{recursive: true,force: true});
};

test('independent Python reconstructs every engineering event and source-bound record exactly regenerates', () => {
  const directory = mkdtempSync(join(tmpdir(),'tick-ac-audit-'));
  try {
    const path = join(directory,'record.json'), output = join(directory,'audit.json');
    const generated = spawnSync(process.execPath,['scripts/tick-actor-critic-engineering.mjs','--output',path],{cwd: root,encoding: 'utf8'});
    assert.equal(generated.status,0,generated.stderr);
    const text = readFileSync(path,'utf8'), record = JSON.parse(text);
    assert.deepEqual(record,tickEngineeringRecord());
    const result = audit(path,output); assert.equal(result.status,0,result.stderr);
    const checked = JSON.parse(readFileSync(output,'utf8'));
    assert.equal(checked.passed,true); assert.equal(checked.fixtures,4);
    assert.equal(checked.decisions,19); assert.equal(checked.transitions,14);
    assert.equal(checked.events,record.fixtures.reduce((total,fixture) => total+fixture.events.length,0));
    const saved = readFileSync(output,'utf8'); assert.notEqual(audit(path,output).status,0);
    assert.equal(readFileSync(output,'utf8'),saved);
    assert.notEqual(spawnSync(process.execPath,['scripts/tick-actor-critic-engineering.mjs','--output',path],{cwd: root}).status,0);
    assert.equal(readFileSync(path,'utf8'),text);
  } finally {clean(directory);}
});

test('independent checker rejects altered rewards, choices, sensors, gradients, work, debt, motor, hashes and missing coverage', () => {
  const directory = mkdtempSync(join(tmpdir(),'tick-ac-mutations-'));
  try {
    const record = tickEngineeringRecord(), path = join(directory,'mutated.json');
    const first = (copy,kind) => copy.fixtures[0].events.find(event => event.type === kind);
    const mutations = {
      reward: copy => {copy.fixtures[0].events.find(event => event.type === 'choose' && event.transitions.length).transitions[0].reward += .01;},
      choice: copy => {first(copy,'choose').action = (first(copy,'choose').action+1)%4;},
      sensor: copy => {first(copy,'choose').own.raw[0] = -.8;},
      gradient: copy => {first(copy,'choose').state.pending.actorGradient[0] += .01;},
      work: copy => {first(copy,'motor').state.work.scalarOperations++;},
      fractionalWork: copy => {first(copy,'motor').state.work.scalarOperations += .0000001;},
      debt: copy => {first(copy,'charge').state.charge.outstandingEnergy += .01;},
      motor: copy => {first(copy,'motor').outputs[0] += .1;},
      motorAction: copy => {const event = first(copy,'motor'); event.action = (event.action+2)%4; event.outputs[1] = event.action >= 2 ? -1 : 0;},
      source: copy => {copy.sources['learning/tick-actor-critic.mjs'] = '0'.repeat(64);},
      missingEvent: copy => {copy.fixtures[0].events.splice(1,1);},
      missingFixture: copy => {copy.fixtures.pop();},
      endpoint: copy => {copy.fixtures[0].finalState.weights[0] += .01;},
      terminal: copy => {copy.fixtures[2].events.find(event => event.type === 'observe' && event.own.terminal).own.terminal = false;}
    };
    for (const [name,mutate] of Object.entries(mutations)) {
      const changed = structuredClone(record); mutate(changed); writeFileSync(path,JSON.stringify(changed));
      const result = audit(path); assert.notEqual(result.status,0,`${name} accepted\n${result.stdout}`);
      assert.match(result.stderr,/AssertionError/,`${name}: ${result.stderr}`);
    }
  } finally {clean(directory);}
});
