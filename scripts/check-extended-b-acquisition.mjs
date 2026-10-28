import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/extended-b-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
function bytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);}
function probability(weights,cue){if(cue.every(value=>value===0))return 1;const bits=cue,features=[1,...bits,bits[0]*bits[1],bits[0]*bits[2],bits[0]*bits[3],bits[1]*bits[2],bits[1]*bits[3],bits[2]*bits[3]];let dot=0;for(let index=0;index<11;index++)dot+=weights[index]*features[index];return .05+.9/(1+Math.exp(-Math.log(3)-dot/Math.sqrt(11)));}
let replays=0,decisions=0,sensorChecks=0,scoreChecks=0,vetoes=0,masked=0;
for(const history of protocol.histories){const row=read(join(base,'rows',history.seed+'.json'));
  for(const arm of protocol.arms)for(const [index,phase]of ['A','B','C','D'].entries()){
    const label=history.seed+'-'+arm+'-acquire-'+phase,trace=row.traces[label];if(!trace)continue;
    const initial=read(join(base,'starts',label+'.json')),run=OdorRoutedExperiment.restore(initial),final=read(join(base,'finals',label+'.json'));assert.equal(run.targetCueMode,arm);
    const original=run.world.sensors.bind(run.world);
    Object.defineProperty(run.world,'sensors',{enumerable:false,configurable:true,value:(fly,spatial,agents,challenge)=>{let sensed=[];const state=run.learners[fly.id],before=state.work.scalarOperations;
      const raw=original(fly,{nearby:(body,radius)=>{sensed=spatial.nearby(body,radius);return sensed;}},agents,challenge),expected=sensed.filter(patch=>patch.amount>.06).map(patch=>phase==='D'?[0,0,0,0]:[...patch.cue]);
      assert.deepEqual(state.targetCues,expected);assert.equal(state.work.scalarOperations-before,4+2*sensed.length+14*expected.length);sensorChecks++;if(phase==='D')masked+=expected.length;return raw;}});
    const digest=createHash('sha256');let events=0;run.attach(event=>{digest.update(JSON.stringify(event)+'\n');events++;if(event.type!=='decision')return;decisions++;const state=run.learners[event.id];assert.equal(event.storageBytes,bytes(state));
      if(event.available){const scores=event.recommendation.pair.map(position=>probability(state.taste.weights,state.targetCues[position]));for(let position=0;position<2;position++)assert.ok(Math.abs(scores[position]-event.targetEvaluation.scores[position])<1e-12);
        assert.equal(event.targetEvaluation.reject,scores[0]+scores[1]<1);const veto=arm==='filter'&&event.targetEvaluation.reject&&event.steering.proposed===1;assert.equal(event.steering.action,veto?0:event.steering.proposed);vetoes+=Number(veto);scoreChecks++;
      }else assert.equal(event.targetEvaluation,null);
      assert.ok(state.steering.pending);assert.equal(state.steering.pending.action,event.steering.action);
    });
    const endpoint=run.advance(protocol.phaseTicks[index]);run.attach(null);assert.deepEqual(endpoint,row.arms[arm].acquisition[phase]);assert.deepEqual(JSON.parse(JSON.stringify(run.checkpoint(false))),final);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);replays++;
  }
  console.log(JSON.stringify({seed:history.seed,replays,decisions,vetoes}));
}
const report={schema:1,passed:true,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),replays,decisions,sensorChecks,scoreChecks,vetoes,masked,scope:'Independent target cues, masking, sensor work, own taste scoring, pending executed action, encoded state and captured-source acquisition replay; not independent physics or hardware energy.'};
writeFileSync(join(base,'acquisition-readback-v2.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
