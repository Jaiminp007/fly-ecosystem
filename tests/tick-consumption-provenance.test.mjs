import test from 'node:test';
import assert from 'node:assert/strict';
import {TickCueExperiment} from '../learning/tick-cue-experiment.mjs';
import {instrumentConsumption,recordedCandidate} from '../scripts/tick-consumption-provenance.mjs';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {gzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
const config={history: {seed: 17001,cueSeed: 17002,resourceSeeds: [17003,17004,17005,17006],shuffleSeed: 17007,nullSeed: 17008},
  reference: {founders: 2,actorParameters: {},parameters: {actuator: 'move'}},pricing: {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)},arm: 'acceptStationary'};

test('observer instrumentation exactly preserves physics and catches intake excluded by the .06 sensing threshold', () => {
  const run=new TickCueExperiment(config);
  for (const [index,fly] of run.world.flies.entries()) {fly.x=index ? 800:100; fly.y=index ? 500:100; fly.energy=50; fly.genome.traits.speed=0;}
  for (const patch of run.world.food) Object.assign(patch,{amount: 0,regrowth: 0});
  Object.assign(run.world.food[0],{x: 100,y: 100,amount: .01,cueId: 1,cue: [1,-1,1,-1],valence: 1});
  Object.assign(run.world.food[1],{x: 130,y: 100,amount: .8,cueId: 2,cue: [-1,1,-1,1],valence: -1});
  run.world.initialEnergy=run.world.energy(); run.startingEnergy=100;
  const twin=TickCueExperiment.restore(run.checkpoint()),records=[],remove=instrumentConsumption(run,row=>records.push(row));
  run.advance(3); remove(); twin.advance(3);
  assert.deepEqual(run.checkpoint(),twin.checkpoint());
  const first=records.find(v=>v.agentId===1);
  assert.equal(first.sourceCueId,2); assert.equal(first.sourceValence,-1); assert.equal(first.consumed.length,1);
  assert.equal(first.consumed[0].cueId,1); assert.equal(first.consumed[0].valence,1);
  assert.ok(first.consumed[0].amountAtSensing<.06); assert.equal(first.consumed[0].distanceAtSensing,0);
  assert.deepEqual(first.before,first.after);
});

test('recorded candidate reader preserves UTF-8 when a checkpoint character crosses a gzip output chunk',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'provenance-utf8-'));
  try {
    const start=JSON.stringify({type:'main-start',arm:'candidate',checkpoint:{value:1}})+'\n';
    const prefix='{"type":"main-end","arm":"candidate","checkpoint":{"text":"';
    const text='x'.repeat(16383-Buffer.byteLength(start+prefix))+'·';
    const final={text},bytes=Buffer.from(start+JSON.stringify({type:'main-end',arm:'candidate',checkpoint:final})+'\n');
    const path=join(directory,'events.gz');writeFileSync(path,gzipSync(bytes));
    const record=await recordedCandidate(path);assert.deepEqual(record.final,final);assert.ok(!JSON.stringify(record.final).includes('\ufffd'));
  }finally{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});}
});

test('independent provenance arithmetic rejects amount, geometry, cue-label and stationary-position corruption',()=>{
  const directory=mkdtempSync(join(tmpdir(),'provenance-audit-'));
  const python=process.env.SARSA_AUDIT_PYTHON || resolve('.venv-research/Scripts/python.exe');
  try {
    const patch={x:100,y:100},body={id:1},row={agentId:1,tick:1,choice:[0,-1,1,-1,0],sourceCueId:2,sourceValence:-1,
      before:{x:100,y:100},after:{x:100,y:100},consumed:[{index:0,amount:.01,cueId:1,valence:1,amountAtSensing:.01,distanceAtSensing:0,distanceAtIntake:0}]};
    const histories=Array.from({length:8},(_,index)=>({seed:17001+index,initialCheckpoint:{world:{world:{flies:[body],food:[patch]}}},records:[structuredClone(row)]}));
    const record={kind:'tick-consumption-provenance',protocolSha256:'test',resultsSha256:'test',histories};
    const input={kind:'tick-policy-diagnosis-input',protocolSha256:'test',resultsSha256:'test',histories:histories.map(h=>({seed:h.seed,founderIds:[1],
      codebook:{A:[{id:1,valence:1},{id:2,valence:-1}]},cueIntakeCells:{A:[{label:-1,action:2,beneficialReceipts:1,harmfulReceipts:0,beneficialEaten:.01,harmfulEaten:0}]}}))};
    const inputPath=join(directory,'input.json'),path=join(directory,'record.json');writeFileSync(inputPath,JSON.stringify(input));
    const check=()=>spawnSync(python,['-B','scripts/audit-tick-consumption-provenance.py',path,inputPath,'--output',join(directory,`${Date.now()}-${Math.random()}.json`)],{encoding:'utf8'});
    writeFileSync(path,JSON.stringify(record));const valid=check();assert.equal(valid.status,0,valid.stderr);
    for(const mutate of [r=>{r.histories[0].records[0].consumed[0].amount=.02;},r=>{r.histories[0].records[0].consumed[0].distanceAtSensing=1;},
      r=>{r.histories[0].records[0].sourceValence=1;},r=>{r.histories[0].records[0].after.x=101;},r=>{r.histories[0].records=[];}]){
      const copy=structuredClone(record);mutate(copy);writeFileSync(path,JSON.stringify(copy));const rejected=check();assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/AssertionError/);
    }
  }finally{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});}
});
