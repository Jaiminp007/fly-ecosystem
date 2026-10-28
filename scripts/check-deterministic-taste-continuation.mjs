import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,createReadStream} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/deterministic-taste-continuation/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)));
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
function probability(weights,cue){if(cue.every(value=>value===0))return 1;const bits=cue,features=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]];let dot=0;for(let index=0;index<11;index++)dot+=weights[index]*features[index];return .05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11)));}
const protocol=read(join(base,'protocol.json'));for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);let decisions=0,receipts=0,replays=0,sensorChecks=0,creditChecks=0;const rows=[];
for(const input of protocol.inputs){const saved=read(join(root,input.start));assert.equal(hash(readFileSync(join(root,input.start))),input.startSha256);const row=read(join(base,'rows',input.history.seed+'.json'));let common=null;
  for(const arm of protocol.arms){let previousFinal=null;
    for(const [index,phase]of ['B','C','D'].entries()){
      const label=input.history.seed+'-'+arm+'-'+phase,entry=row.arms[arm].phases[phase];if(!entry)continue;
      const initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),run=OdorRoutedExperiment.restore(initial);assert.equal(run.tasteDecisionMode,arm);
      if(phase==='B'){const expected=structuredClone(saved);expected.state.tasteDecisionMode=arm;assert.deepEqual(initial,expected);const worldHash=hash(JSON.stringify(initial.world));if(common===null)common=worldHash;else assert.equal(worldHash,common);}
      else assert.deepEqual(initial,previousFinal);
      const digest=createHash('sha256'),stream=createReadStream(join(base,'traces',label+'.jsonl.gz')).pipe(createGunzip()),pending={},storage={},paid={};stream.on('data',chunk=>digest.update(chunk));let events=0;
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);events++;
        if(event.type==='decision'){assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*run.pricing.byteEnergyPerSecond*.1;decisions++;}
        else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}}
      assert.equal(Object.keys(pending).length,0);assert.equal(events,entry.trace.events);assert.equal(digest.digest('hex'),entry.trace.sha256);
      for(const [id,state]of Object.entries(final.state.learners)){const previous=initial.state.learners[id],charge=state.charge;close(charge.incurredEnergy,previous.charge.incurredEnergy+(state.work.scalarOperations-previous.charge.operationsBilled)*run.pricing.operationEnergy+(storage[id]??0));close(charge.paidEnergy,previous.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);}
      const original=run.world.sensors.bind(run.world);Object.defineProperty(run.world,'sensors',{enumerable:false,configurable:true,value:(fly,spatial,agents,challenge)=>{let sensed=[];const state=run.learners[fly.id],before=state.work.scalarOperations;
        const raw=original(fly,{nearby:(body,radius)=>{sensed=spatial.nearby(body,radius);return sensed;}},agents,challenge),expected=sensed.filter(patch=>patch.amount>.06).map(patch=>phase==='D'?[0,0,0,0]:[...patch.cue]);
        assert.deepEqual(state.targetCues,expected);assert.equal(state.work.scalarOperations-before,4+2*sensed.length+14*expected.length);sensorChecks++;return raw;}});
      const replay=createHash('sha256');let replayEvents=0;run.attach(event=>{replay.update(JSON.stringify(event)+'\n');replayEvents++;if(event.type!=='decision')return;
        const state=run.learners[event.id],estimate=probability(state.taste.weights,event.own.cue);close(event.choice.tasteEstimate,estimate);
        const accept=arm==='threshold'?estimate>.5:state.taste.rngState/4294967296<estimate;assert.equal(event.choice.accept,accept);close(event.choice.feedProbability,arm==='threshold'?Number(accept):estimate);
        assert.equal(state.credit.pending.action,(event.choice.move===-1?2:0)+(accept?0:1));assert.equal(state.steering.pending.action,event.steering.action);assert.equal(event.storageBytes,bytes(state));creditChecks++;
      });
      const endpoint=run.advance(protocol.ticks[index]);run.attach(null);assert.deepEqual(endpoint,entry.endpoint);assert.deepEqual(JSON.parse(JSON.stringify(run.checkpoint(false))),final);assert.equal(replayEvents,events);assert.equal(replay.digest('hex'),entry.trace.sha256);previousFinal=final;replays++;
    }
  }
  const sample=row.arms.sample.phases.B.endpoint,threshold=row.arms.threshold.phases.B.endpoint,complete=sample.tick===1536&&threshold.tick===1536;
  if(complete){close(row.bEffect.energy,threshold.budgetAdjustedEnergyPerFounder-sample.budgetAdjustedEnergyPerFounder);assert.equal(row.bEffect.survivors,threshold.survivors-sample.survivors);close(row.bEffect.netIntake,(threshold.statistics.B.intake-threshold.statistics.B.toxin-sample.statistics.B.intake+sample.statistics.B.toxin)/threshold.founders);}else assert.equal(row.bEffect,null);
  rows.push(row);console.log(JSON.stringify({seed:input.history.seed,replays,decisions}));
}
const summary=read(join(base,'results.json')).summary,values=rows.map(row=>row.bEffect);assert.equal(summary.complete,values.every(Boolean));assert.equal(summary.positiveHistories,values.filter(value=>value&&value.energy>0).length);
if(summary.complete){close(summary.meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/values.length);assert.equal(summary.survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));close(summary.meanNetIntake,values.reduce((sum,value)=>sum+value.netIntake,0)/values.length);}
for(const arm of protocol.arms){assert.equal(summary.dHistories[arm],rows.filter(row=>row.arms[arm].phases.D?.endpoint.tick===2304).length);assert.equal(summary.dSurvivors[arm],rows.reduce((sum,row)=>sum+(row.arms[arm].phases.D?.endpoint.survivors??0),0));}
assert.equal(decisions,receipts);const report={schema:1,passed:true,replays,decisions,receipts,sensorChecks,creditChecks,scope:'Matched-start, factual taste decision/RNG, pending credit, target cues, sensor work, encoded storage, ledgers and exact replay; not independent physics or hardware energy.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
