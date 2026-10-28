import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/target-taste-headroom/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)));
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
function probability(weights,cue){if(cue.every(value=>value===0))return 1;const bits=cue,features=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]];let dot=0;for(let index=0;index<11;index++)dot+=weights[index]*features[index];return .05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11)));}
const protocol=read(join(base,'protocol.json'));for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href),{CoverageExperiment}=await import(pathToFileURL(join(base,'sources/learning/coverage-experiment.mjs')).href);let replays=0,decisions=0,receipts=0,sensorChecks=0,scoreChecks=0,rejections=0;const rows=[];
for(const input of protocol.inputs){
  const anchors={};for(const phase of ['A','B','D']){const data=readFileSync(join(root,input.anchors[phase].path));assert.equal(hash(data),input.anchors[phase].sha256);anchors[phase]=JSON.parse(data);}
  const row=read(join(base,'rows',input.history.seed+'.json'));
  for(const phase of protocol.phases){let common=null;
    for(const arm of protocol.arms){const label=input.history.seed+'-'+phase+'-'+arm,initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json'));let run;
      if(arm==='native-full')run=CoverageExperiment.fork({...structuredClone(anchors.D),kind:'coverage-world'},{phase,seed:input.history.probeSeeds[phase],mode:'native-full'});
      else run=OdorRoutedExperiment.fork(anchors.D,{phase,seed:input.history.probeSeeds[phase],mode:arm==='reset'?'reset':'current',modelAnchor:arm==='reset'||phase==='transfer'?null:anchors[phase],steeringMode:'learned',compactFrozen:true,targetCueMode:arm==='observe'?'observe':'filter'});
      assert.deepEqual(run.checkpoint(false),initial);const worldHash=hash(JSON.stringify(initial.world));if(common===null)common=worldHash;else assert.equal(worldHash,common);
      const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256'),storage={},paid={},pending={};stream.on('data',chunk=>digest.update(chunk));let events=0;
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);events++;
        if(event.type==='decision'){assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*run.pricing.byteEnergyPerSecond*.1;decisions++;}
        else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}}
      assert.equal(Object.keys(pending).length,0);assert.equal(events,row.phases[phase].arms[arm].trace.events);assert.equal(digest.digest('hex'),row.phases[phase].arms[arm].trace.sha256);
      for(const [id,state]of Object.entries(final.state.learners)){const previous=initial.state.learners[id],charge=state.charge;close(charge.incurredEnergy,previous.charge.incurredEnergy+(state.work.scalarOperations-previous.charge.operationsBilled)*run.pricing.operationEnergy+(storage[id]??0));close(charge.paidEnergy,previous.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);}
      if(arm!=='native-full'){
        const original=run.world.sensors.bind(run.world);Object.defineProperty(run.world,'sensors',{enumerable:false,configurable:true,value:(fly,index,agents,challenge)=>{let sensed=[];const state=run.learners[fly.id],before=state.work.scalarOperations;
          const raw=original(fly,{nearby:(body,radius)=>{sensed=index.nearby(body,radius);return sensed;}},agents,challenge),expected=sensed.filter(patch=>patch.amount>.06).map(patch=>phase==='transfer'?[0,0,0,0]:[...patch.cue]);
          assert.deepEqual(state.targetCues,expected);assert.equal(state.work.scalarOperations-before,4+2*sensed.length+14*expected.length);sensorChecks++;return raw;}});
      }
      const replay=createHash('sha256');let replayEvents=0;run.attach(event=>{replay.update(JSON.stringify(event)+'\n');replayEvents++;if(arm==='native-full'||event.type!=='decision')return;
        const state=run.learners[event.id];assert.equal(event.storageBytes,bytes(state));if(event.available){const scores=event.recommendation.pair.map(index=>probability(state.taste.weights,state.targetCues[index]));scores.forEach((value,index)=>close(value,event.targetEvaluation.scores[index]));
          assert.equal(event.targetEvaluation.reject,scores[0]+scores[1]<1);const expected=arm!=='observe'&&event.targetEvaluation.reject?0:event.steering.proposed;assert.equal(event.steering.action,expected);scoreChecks++;if(event.targetEvaluation.reject)rejections++;
        }else assert.equal(event.targetEvaluation,null);
      });
      const endpoint=run.advance(protocol.ticks);run.attach(null);assert.deepEqual(endpoint,row.phases[phase].arms[arm].endpoint);assert.deepEqual(run.checkpoint(false),final);assert.equal(replayEvents,events);assert.equal(replay.digest('hex'),row.phases[phase].arms[arm].trace.sha256);replays++;
    }
  }
  rows.push(row);console.log(JSON.stringify({seed:input.history.seed,replays,decisions,scoreChecks}));
}
const result=read(join(base,'results.json'));for(const phase of protocol.phases)for(const control of ['observe','reset','native-full']){const values=rows.map(row=>{const candidate=row.phases[phase].arms.filter.endpoint,reference=row.phases[phase].arms[control].endpoint,effect=row.phases[phase].effects[control];close(effect.energy,candidate.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder);assert.equal(effect.survivors,candidate.survivors-reference.survivors);return effect;});const summary=result.phases[phase][control];close(summary.meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/values.length);assert.equal(summary.positiveHistories,values.filter(value=>value.energy>0).length);assert.equal(summary.survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));}
assert.equal(decisions,receipts);const report={schema:1,passed:true,replays,decisions,receipts,sensorChecks,scoreChecks,rejections,scope:'Captured-source replay, independent cue/mask, sensor work, prediction/action, encoded state, ledger and outcome arithmetic; not independent physics or actual hardware energy.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
