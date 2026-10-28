import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,copyFileSync,mkdirSync,rmSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createTickBody} from '../learning/tick-actor-critic.mjs';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {diagnosePolicyHistory} from '../learning/tick-policy-diagnosis.mjs';
import {evaluatePolicyFile} from '../scripts/tick-policy-diagnosis.mjs';
const python=process.env.SARSA_AUDIT_PYTHON || resolve('.venv-research/Scripts/python.exe');
function fixture() {
  const weights=createTickBody(1,1).weights,learned=[...weights];
  learned[137]=.4; learned[143]=-.3; learned[157]=.1; learned[160]=-.2; learned[17]+=.2;
  const raw=Array(17).fill(0); raw[4]=.5; raw[16]=1;
  return {schema: 1,kind: 'tick-policy-diagnosis-input',protocolSha256: 'test',resultsSha256: 'test',histories: [{seed: 250501,founderIds: [1],
    codebook: {A: [0,1,2,3].map((id)=>({id: id+1,bits: [id&1 ? 1:-1,id&2 ? 1:-1,1,-1],valence: id<2 ? -1:1}))},
    models: {initial: {1: weights},A: {1: learned},B: {1: weights},C: {1: learned},final: {1: weights}},
    contexts: [{agentId: 1,phase: 'A',tick: 1,edge: 'first',raw,sourceCue: [1,-1,1,-1],observation: cueObservation(raw,[1,-1,1,-1])}]}]};
}
test('observer policy diagnosis isolates heads, records actual changes and preserves every source model/context', () => {
  const input=fixture(),before=structuredClone(input),result=diagnosePolicyHistory(input.histories[0]);
  assert.deepEqual(input,before); assert.equal(result.rows.length,5);
  for (const row of result.rows) for (const v of row.predictions) {assert.equal(v.valueResetPolicyChange,0); assert.ok(v.headsResetToInitialDifference<1e-15);}
  assert.ok(result.rows.find(v=>v.version==='A').predictions.some(v=>v.totalVariationFromInitial>0));
  assert.ok(result.parameterChanges.find(v=>v.version==='A').groups.valueHead.l1>0);
  const bad=fixture(); bad.histories[0].contexts[0].observation[4]=1; assert.throws(()=>diagnosePolicyHistory(bad.histories[0]));
});
test('independent Python verifies conditional probes, rejects changed probabilities and cold-replays the captured closure', () => {
  const directory=mkdtempSync(join(tmpdir(),'policy-diagnosis-'));
  try {
    const input=join(directory,'input.json'),output=join(directory,'output.json'); writeFileSync(input,JSON.stringify(fixture()));
    const result=evaluatePolicyFile(input); writeFileSync(output,JSON.stringify(result));
    const run=(file,script=resolve('scripts/audit-tick-policy-diagnosis.py')) => spawnSync(python,['-B',script,input,file,'--output',join(directory,`${Date.now()}-${Math.random()}.json`)],{encoding: 'utf8'});
    const checked=run(output); assert.equal(checked.status,0,checked.stderr);
    for (const mutate of [r=>{r.histories[0].rows[0].predictions[0].probabilities[0]+=.1;},r=>{r.histories[0].parameterChanges.pop();},
      r=>{r.histories[0].rows[1].predictions[0].valueResetPolicyChange=.01;},r=>{delete r.sources['learning/tick-policy-diagnosis.mjs'];}]) {
      const altered=structuredClone(result); mutate(altered); const path=join(directory,'altered.json'); writeFileSync(path,JSON.stringify(altered));
      const rejected=run(path); assert.notEqual(rejected.status,0); assert.match(rejected.stderr,/AssertionError/);
    }
    const captured=join(directory,'sources');
    for (const name of Object.keys(result.sources)) {const target=resolve(captured,name); assert.ok(target.startsWith(resolve(captured)+sep)); mkdirSync(dirname(target),{recursive: true}); copyFileSync(name,target);}
    const replay=join(directory,'replayed.json'),node=spawnSync(process.execPath,[join(captured,'scripts/tick-policy-diagnosis.mjs'),input,replay],{encoding: 'utf8',cwd: directory});
    assert.equal(node.status,0,node.stderr); assert.equal(readFileSync(replay,'utf8'),JSON.stringify(result)+'\n');
    const checkedCopy=run(replay,join(captured,'scripts/audit-tick-policy-diagnosis.py')); assert.equal(checkedCopy.status,0,checkedCopy.stderr);
  } finally {assert.equal(dirname(resolve(directory)),resolve(tmpdir())); rmSync(directory,{recursive: true,force: true});}
});
