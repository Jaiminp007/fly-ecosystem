import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {certifyFrozenNativeSteering} from '../learning/native-steering-certificate.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-shared-transfer-components/20261026-v1'),output=join(root,'evidence/native-steering-certificate/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const prior=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(prior.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const captured=name=>pathToFileURL(join(base,'sources',name)).href;
const {OdorRoutedExperiment}=await import(captured('learning/odor-routed-experiment.mjs'));
const {incrementalOverlapRecommendation}=await import(captured('learning/incremental-overlap.mjs'));
const names=['scripts/measure-native-steering-certificate.mjs','learning/native-steering-certificate.mjs','tests/native-steering-certificate.test.mjs','docs/NATIVE_STEERING_CERTIFICATE_DESIGN.md'];
const sources=Object.fromEntries(names.map(name=>[name,hash(readFileSync(join(root,name)))]));
write(join(output,'protocol.json'),{schema:1,priorProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),sourceSha256:sources,inputs:prior.inputs,arms:['full','residual-only'],
  scope:'Post-outcome observer certificate and conservative same-state declared-cost estimate; no physical optimization or qualification.'});
for(const name of names){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of prior.inputs)for(const arm of ['full','residual-only']){
  const label=input.history.seed+'-'+arm,startPath=join(base,'starts',label+'.json'),finalPath=join(base,'finals',label+'.json'),start=read(startPath),final=read(finalPath),studyRow=read(join(base,'rows',input.history.seed+'.json'));
  const run=OdorRoutedExperiment.restore(start),counts={decisions:0,certified:0,wallProofs:0,boundProofs:0,actualNative:0,certificateOperations:0,avoidedLowerOperations:0,proofByteTicks:0},focal={};
  const traceDigest=createHash('sha256');let events=0;
  run.attach(event=>{
    const text=JSON.stringify(event)+'\n';traceDigest.update(text);events++;
    if(event.type!=='decision')return;
    const state=run.learners[event.id],work={scalarOperations:0},proof={},safe=certifyFrozenNativeSteering(state.steering,event.own,work,proof);
    const actual=event.steering.action;counts.decisions++;counts.actualNative+=Number(actual===0);counts.certificateOperations+=work.scalarOperations;
    counts.proofByteTicks+=4+Buffer.byteLength('nativeProof')+encodedStateBytes(proof);
    const own=focal[event.id]??={decisions:0,certified:0,wallProofs:0,boundProofs:0,certificateOperations:0,avoidedLowerOperations:0,proofByteTicks:0};
    own.decisions++;own.certificateOperations+=work.scalarOperations;own.proofByteTicks+=4+Buffer.byteLength('nativeProof')+encodedStateBytes(proof);
    if(safe){
      assert.equal(actual,0);if(proof.reason===1)assert.equal(event.guard.wall,true);
      const selectorWork={scalarOperations:0},scratch=structuredClone(state.scratch),points=state.spatialPoints;
      assert.deepEqual(incrementalOverlapRecommendation(points,selectorWork,scratch),event.recommendation);
      const avoided=2+9*points.length+selectorWork.scalarOperations+15;counts.certified++;own.certified++;
      counts.wallProofs+=Number(proof.reason===1);own.wallProofs+=Number(proof.reason===1);counts.boundProofs+=Number(proof.reason===2);own.boundProofs+=Number(proof.reason===2);
      counts.avoidedLowerOperations+=avoided;own.avoidedLowerOperations+=avoided;
    }
  });
  run.advance(256);run.attach(null);assert.deepEqual(run.checkpoint(false),final);assert.equal(events,studyRow.arms[arm].trace.events);assert.equal(traceDigest.digest('hex'),studyRow.arms[arm].trace.sha256);
  const pricing=start.state.pricing,netOperationDelta=counts.certificateOperations+2*counts.certified-counts.avoidedLowerOperations;
  const declaredEnergyDelta=netOperationDelta*pricing.operationEnergy+counts.proofByteTicks*pricing.byteEnergyPerSecond*.1;
  const row={seed:input.history.seed,arm,startSha256:hash(readFileSync(startPath)),finalSha256:hash(readFileSync(finalPath)),counts,focal,netOperationDelta,declaredEnergyDelta};
  write(join(output,'rows',input.history.seed+'-'+arm+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:row.seed,arm,counts,declaredEnergyDelta}));
}
const totals={};for(const arm of ['full','residual-only']){
  const sum={decisions:0,certified:0,wallProofs:0,boundProofs:0,actualNative:0,certificateOperations:0,avoidedLowerOperations:0,proofByteTicks:0,netOperationDelta:0,declaredEnergyDelta:0};
  for(const row of rows.filter(value=>value.arm===arm)){for(const key of ['decisions','certified','wallProofs','boundProofs','actualNative','certificateOperations','avoidedLowerOperations','proofByteTicks'])sum[key]+=row.counts[key];sum.netOperationDelta+=row.netOperationDelta;sum.declaredEnergyDelta+=row.declaredEnergyDelta;}
  totals[arm]=sum;
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
write(join(output,'results.json'),{schema:1,totals,scope:'Observer-only certified action and conservative same-state declared-cost bound; not physical outcomes or low-level energy proof.'});console.log(JSON.stringify(totals));
