import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/supported-steering-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),checkpoint=path=>JSON.parse(gunzipSync(readFileSync(path+'.gz')).toString()),hash=data=>createHash('sha256').update(data).digest('hex');
const protocol=read(join(base,'protocol.json'));for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);
const route=cue=>cue.every(value=>value===0)?0:1+cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);
const values=(model,slot,features)=>model.weights.map((row,action)=>row.reduce((sum,value,index)=>sum+(value+model.contextWeights[slot][action][index])*features[index],0));
const close=(left,right)=>assert.ok(Math.abs(left-right)<1e-10+1e-10*Math.max(Math.abs(left),Math.abs(right)));
let decisions=0,updates=0,terminalUpdates=0,replays=0;
function update(model,energy,nextRoute,nextFeatures,available,terminal){
  const pending=model.pending,prior=values(model,pending.route,pending.features)[pending.action],next=terminal?null:values(model,nextRoute,nextFeatures);
  const delta=(energy-pending.energy)/120+Math.exp(-1/256)*(terminal?0:available?Math.max(...next):next[0])-prior;
  for(let index=0;index<8;index++){
    const increment=.025*delta*pending.features[index],old=model.weights[pending.action][index],updated=Math.max(-8,Math.min(8,old+increment)),change=updated-old;
    model.weights[pending.action][index]=updated;const bank=model.contextWeights[pending.route][pending.action];bank[index]=Math.max(-8,Math.min(8,bank[index]+increment));
    for(let slot=0;slot<17;slot++)if(slot!==pending.route&&model.support[slot][pending.action]){
      const previous=model.contextWeights[slot][pending.action][index],compensated=Math.max(-8,Math.min(8,previous-change));
      model.contextWeights[slot][pending.action][index]=model.protectionMode==='protect'?compensated:previous;
    }
  }
  model.support[pending.route][pending.action]=true;
  model.pending=null;updates++;if(terminal)terminalUpdates++;
}
function compare(expected,actual){
  assert.deepEqual(expected.support,actual.support);for(let action=0;action<2;action++)for(let index=0;index<8;index++){
    close(expected.weights[action][index],actual.weights[action][index]);for(let slot=0;slot<17;slot++)close(expected.contextWeights[slot][action][index],actual.contextWeights[slot][action][index]);}
  assert.deepEqual(expected.pending,actual.pending);
}
for(const history of protocol.histories){const row=read(join(base,'rows',history.seed+'.json'));
  for(const arm of protocol.arms)for(const [phaseIndex,phase]of ['A','B','C','D'].entries()){
    const label=history.seed+'-'+arm+'-acquire-'+phase,trace=row.traces[label];if(!trace)continue;
    const initial=checkpoint(join(base,'starts',label+'.json')),final=checkpoint(join(base,'finals',label+'.json')),run=OdorRoutedExperiment.restore(initial),models=Object.fromEntries(Object.entries(initial.state.learners).map(([id,state])=>[id,structuredClone(state.steering)]));
    const digest=createHash('sha256');let events=0;run.attach(event=>{digest.update(JSON.stringify(event)+'\n');events++;
      if(event.type==='decision'){
        const model=models[event.id],slot=route(event.own.cue);assert.equal(model.agentId,event.id);
        if(model.pending){assert.equal(model.pending.tick+1,event.tick);update(model,event.own.energy,slot,event.features,event.available,false);}
        const predicted=values(model,slot,event.features);for(let action=0;action<2;action++)close(predicted[action],event.steering.predictions[action]);
        assert.equal(event.steering.action,event.steering.proposed);model.pending={tick:event.tick,energy:event.own.energy,route:slot,action:event.steering.action,features:[...event.features]};
        compare(model,run.learners[event.id].steering);decisions++;
      }else if(event.type==='observe'&&event.own.terminal){const model=models[event.own.agentId];if(model.pending){assert.equal(model.pending.tick,event.own.tick);update(model,event.own.energy,null,null,false,true);}compare(model,run.learners[event.own.agentId].steering);}
    });
    const endpoint=run.advance(protocol.phaseTicks[phaseIndex]);run.attach(null);assert.deepEqual(endpoint,row.arms[arm].acquisition[phase]);assert.deepEqual(JSON.parse(JSON.stringify(run.checkpoint(false))),final);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);replays++;
  }
  console.log(JSON.stringify({seed:history.seed,replays,decisions,updates}));
}
const report={schema:1,passed:true,replays,decisions,updates,terminalUpdates,checkerSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent own-pending-action support, compensation and steering weights, plus captured-source acquisition replay; not independent physics or hardware energy adequacy.'};
writeFileSync(join(base,'support-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));

