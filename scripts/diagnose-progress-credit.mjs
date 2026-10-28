// Small factual replay of one DEVELOPMENT trajectory, not a qualification run.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {tasteDevelopmentSources} from './taste-development.mjs';
import {digest} from '../learning/intervention-study.mjs';
const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
assert.ok(args.includes('--input')&&args.includes('--output'));
const input=resolve(value('--input')),output=resolve(value('--output'));assert.ok(!existsSync(output));
const read=p=>JSON.parse(readFileSync(p,'utf8')),attempt=read(join(input,'attempt.json')),protocol=read(join(input,'protocol.json'));
const history=protocol.histories[Number(args.includes('--index')?value('--index'):0)];
assert.equal(attempt.learnerOptions.motorRule,'progress');
const currentSources=tasteDevelopmentSources();
for(const[name,hash]of Object.entries(attempt.sourceSha256))assert.equal(currentSources[name],hash,'Main replay source changed: '+name);
const start=performance.now(),examples=[];let pending=null;
const run=new TasteExperiment({history,arm:'candidate',learnerOptions:attempt.learnerOptions,cruiseSpeed:attempt.cruiseSpeed,emit:event=>{
  if(event.type==='update'&&event.event.type==='motor-progress')pending=event.event;
  if(event.type==='decision'&&pending){
    assert.equal(pending.record.tick,event.own.tick-1);
    examples.push({tick:pending.record.tick,id:event.own.agentId,admitted:pending.admitted,target:pending.target,proximityChange:pending.progress,
      signedFood:event.own.raw[13],beforeProximity:pending.record.proximity,afterProximity:event.own.raw[3]});pending=null;
  }
}});
run.advance(attempt.ticks);const original=read(join(input,'rows',`${history.seed}.json`)).arms.candidate.endpoint;
assert.deepEqual(run.endpoint(),original,'Diagnostic replay changed the development trajectory');
const admitted=examples.filter(e=>e.admitted),arrivals=admitted.filter(e=>e.signedFood>0),rejectedArrivals=arrivals.filter(e=>e.target===0);
const result={schema:1,kind:'factual-progress-credit-diagnosis',history,exactCandidateEndpoint:true,endpoint:original,
  admitted:admitted.length,beneficialArrivals:arrivals.length,beneficialArrivalsLabeledWait:rejectedArrivals.length,
  lostTargetOnBeneficialArrival:rejectedArrivals.filter(e=>e.afterProximity<e.beforeProximity).length,
  examples:rejectedArrivals.slice(0,24),wallSeconds:(performance.now()-start)/1000,
  sourceSha256:currentSources,observerSha256:digest(readFileSync(new URL(import.meta.url))),
  scope:'One reused development history, actual labels and next own sensations. Association/credit diagnosis only; no remedy performance, qualification or RSI claim.'};
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
