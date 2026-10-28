import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/supported-steering-development/20261026-v1'),read=path=>JSON.parse(existsSync(path)?readFileSync(path,'utf8'):gunzipSync(readFileSync(path+'.gz')).toString()),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
function features(cue){return [1,...cue,cue[0]*cue[1],cue[0]*cue[2],cue[0]*cue[3],cue[1]*cue[2],cue[1]*cue[3],cue[2]*cue[3]];}
function index(cue){return cue.reduce((sum,value,position)=>sum+(value>0?2**position:0),0);}
function logits(state,cue){const phi=features(cue);let dot=0;for(let position=0;position<11;position++)dot+=state.weights[position]*phi[position];const shared=Math.log(3)+dot/Math.sqrt(11);return {shared,full:shared+state.residuals[index(cue)]};}
function probability(state,cue,policy){if(cue.every(value=>value===0))return 1;const values=logits(state,cue),logit=values.shared+Number(policy==='shared-plus-cue')*(values.full-values.shared);return .05+.9/(1+Math.exp(-logit));}
function random(state){let seed=state.rngState;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;state.rngState=seed>>>0;state.work.scalarOperations+=7;return state.rngState/4294967296;}
let book=null;const categories={current:{A:0,B:0,other:0},replay:{A:0,B:0,other:0}};
function category(cue){for(const phase of ['A','B'])if(book[phase].some(item=>item.bits.every((value,index)=>value===cue[index])))return phase;return 'other';}
function learn(state,example){const record={agentId:state.agentId,tick:example.tick,phi:features(example.cue),target:example.target};state.work.scalarOperations+=20;state.seen++;state.lastTick=example.tick;
  const retention=random(state),replay=random(state),recent=random(state),coin=random(state);if(state.reservoir.length<32){state.reservoir.push(structuredClone(record));state.work.scalarOperations++;}else{const position=Math.floor(retention*state.seen);state.work.scalarOperations+=2;if(position<32){state.reservoir[position]=structuredClone(record);state.work.scalarOperations++;}}
  if(state.recent.length===8){state.recent.shift();state.work.scalarOperations+=8;}state.recent.push(structuredClone(record));state.work.scalarOperations++;
  const selected=Math.floor(replay*state.reservoir.length),recentIndex=Math.floor(recent*state.recent.length),coinRecent=coin<.5;assert.ok(recentIndex>=0&&typeof coinRecent==='boolean');state.work.scalarOperations+=5;
  categories.current[category(record.phi.slice(1,5))]++;categories.replay[category(state.reservoir[selected].phi.slice(1,5))]++;
  for(const sample of [record,state.reservoir[selected]]){const cue=sample.phi.slice(1,5),slot=index(cue),values=logits(state,cue),sharedError=sample.target-1/(1+Math.exp(-values.shared)),fullError=sample.target-1/(1+Math.exp(-values.full)),step=.5*sharedError/Math.sqrt(11),residualStep=.5*fullError;
    for(let position=0;position<11;position++)state.weights[position]=Math.max(-8,Math.min(8,state.weights[position]+step*sample.phi[position]));state.residuals[slot]=Math.max(-8,Math.min(8,state.residuals[slot]+residualStep));state.work.scalarOperations+=125;state.updates++;}
}
let replays=0,decisions=0,sensorChecks=0,scoreChecks=0,examples=0;
for(const history of protocol.histories){const row=read(join(base,'rows',history.seed+'.json'));
  for(const arm of ['protect'])for(const [phaseIndex,phase]of [[1,'B']]){
    const label=history.seed+'-'+arm+'-acquire-'+phase,trace=row.traces[label];if(!trace)continue;const initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),run=OdorRoutedExperiment.restore(initial),models=Object.fromEntries(Object.entries(initial.state.learners).map(([id,state])=>[id,structuredClone(state.cueTaste)])),counts={},pending={};assert.equal(run.cueTastePolicy,'shared-plus-cue');book=initial.state.codebook;
    const original=run.world.sensors.bind(run.world);Object.defineProperty(run.world,'sensors',{enumerable:false,configurable:true,value:(fly,spatial,agents,challenge)=>{let sensed=[];const state=run.learners[fly.id],before=state.work.scalarOperations;
      const raw=original(fly,{nearby:(body,radius)=>{sensed=spatial.nearby(body,radius);return sensed;}},agents,challenge),expected=sensed.filter(patch=>patch.amount>.06).map(patch=>phase==='D'?[0,0,0,0]:[...patch.cue]);assert.deepEqual(state.targetCues,expected);assert.equal(state.work.scalarOperations-before,4+2*sensed.length+14*expected.length);sensorChecks++;return raw;}});
    const digest=createHash('sha256');let events=0;run.attach(event=>{digest.update(JSON.stringify(event)+'\n');events++;
      if(event.type==='decision'){decisions++;const state=run.learners[event.id];assert.equal(event.storageBytes,bytes(state));assert.deepEqual(JSON.parse(JSON.stringify(state.cueTaste)),JSON.parse(JSON.stringify(models[event.id])));assert.ok(!pending[event.id]);pending[event.id]=event;
        const estimate=probability(models[event.id],event.own.cue,'shared-plus-cue');assert.ok(Math.abs(event.choice.feedProbability-estimate)<1e-12);assert.equal(event.choice.accept,state.taste.rngState/4294967296<estimate);
        if(event.available){const scores=event.recommendation.pair.map(position=>probability(models[event.id],state.targetCues[position],'shared-plus-cue'));for(let position=0;position<2;position++)assert.ok(Math.abs(scores[position]-event.targetEvaluation.scores[position])<1e-12);assert.equal(event.targetEvaluation.reject,scores[0]+scores[1]<1);scoreChecks++;}else assert.equal(event.targetEvaluation,null);
        assert.equal(event.steering.action,event.steering.proposed);assert.equal(state.steering.pending.action,event.steering.action);
      }else if(event.type==='observe'){const id=event.own.agentId,decision=pending[id];assert.ok(decision);assert.equal(decision.tick,event.own.tick);delete pending[id];
        if(decision.choice.move===-1&&decision.choice.accept&&decision.own.odorPresent&&decision.own.contactPresent&&decision.own.contactHomogeneous&&event.own.lastFood!==0){learn(models[id],{agentId:id,tick:event.own.tick,cue:decision.own.cue,target:Number(event.own.lastFood>0)});counts[id]=(counts[id]??0)+1;examples++;}
        assert.deepEqual(JSON.parse(JSON.stringify(run.learners[id].cueTaste)),JSON.parse(JSON.stringify(models[id])));
      }
    });
    const endpoint=run.advance(protocol.phaseTicks[phaseIndex]);run.attach(null);assert.deepEqual(endpoint,row.arms[arm].acquisition[phase]);assert.deepEqual(JSON.parse(JSON.stringify(run.checkpoint(false))),final);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);assert.equal(Object.keys(pending).length,0);
    for(const [id,state]of Object.entries(final.state.learners)){assert.deepEqual(state.cueTaste,JSON.parse(JSON.stringify(models[id])));assert.equal(state.tasteExamples-initial.state.learners[id].tasteExamples,counts[id]??0);}replays++;
  }
  console.log(JSON.stringify({seed:history.seed,replays,decisions,examples}));
}
const report={schema:1,passed:true,replays,decisions,sensorChecks,scoreChecks,examples,categories,checkerSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent own-credit, decoupled SGD/RNG, taste predictions, target cues, sensor work, encoded storage and exact captured-source acquisition replay; not independent physics or hardware energy.'};
writeFileSync(join(base,'taste-replay-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));

