import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-shared-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
function route(cue){assert.ok(Array.isArray(cue)&&cue.length===4);if(cue.every(value=>value===0))return 0;assert.ok(cue.every(value=>value===-1||value===1));return 1+cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);}
function advance(seed){let value=seed;value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;}
function scores(state,context,features){return state.weights.map((row,action)=>row.reduce((sum,weight,index)=>sum+(weight+state.contextWeights[context][action][index])*features[index],0));}
function update(state,energy,nextContext,nextFeatures,available,terminal){
  const prior=state.pending,prediction=scores(state,prior.route,prior.features)[prior.action],next=terminal?0:scores(state,nextContext,nextFeatures);
  const bootstrap=terminal?0:available?Math.max(...next):next[0],delta=(energy-prior.energy)/120+Math.exp(-1/256)*bootstrap-prediction;
  for(let index=0;index<8;index++){
    const increment=.025*delta*prior.features[index];state.weights[prior.action][index]=Math.max(-8,Math.min(8,state.weights[prior.action][index]+increment));
    state.contextWeights[prior.route][prior.action][index]=Math.max(-8,Math.min(8,state.contextWeights[prior.route][prior.action][index]+increment));
  }
  state.work.scalarOperations+=terminal?129:177;state.updates++;state.pending=null;
}
let decisions=0,updates=0,terminalUpdates=0,crossCue=0;
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json'));
  for(const [label,trace]of Object.entries(row.traces))if(label.includes('-cue-shared-')&&!label.endsWith('-native-full')){
    const initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json'));
    const states=Object.fromEntries(Object.entries(initial.state.learners).map(([id,state])=>[id,structuredClone(state.steering)])),pending={};
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);
      if(event.type==='decision'){
        const state=states[event.id],context=route(event.own.cue);assert.ok(!pending[event.id]);state.work.scalarOperations+=9;
        if(state.pending){assert.equal(state.pending.tick+1,event.tick);crossCue+=Number(state.pending.route!==context);update(state,event.own.energy,context,event.features,event.available,false);updates++;}
        const predictions=scores(state,context,event.features),best=event.available&&predictions[1]>predictions[0]?1:0;
        state.rngState=advance(state.rngState);const proposed=state.acquisition&&event.available&&state.rngState/4294967296<.1?1-best:best;
        const action=initial.state.steeringMode==='native'?0:initial.state.steeringMode==='guarded'?Number(event.available):proposed;
        assert.deepEqual(event.steering,{action,proposed,predictions});
        state.pending=state.acquisition?{tick:event.tick,energy:event.own.energy,route:context,action,features:event.features}:null;
        state.work.scalarOperations+=57+(state.acquisition?8:0);state.lastDecisionTick=event.tick;pending[event.id]=event.tick;decisions++;
      }else if(event.type==='observe'){
        const id=event.own.agentId,state=states[id];assert.equal(pending[id],event.own.tick);
        if(event.own.terminal){if(state.pending){assert.equal(state.pending.tick,event.own.tick);update(state,event.own.energy,null,null,false,true);updates++;terminalUpdates++;}state.dead=true;}
        delete pending[id];
      }
    }
    assert.equal(digest.digest('hex'),trace.sha256);assert.equal(Object.keys(pending).length,0);
    for(const [id,state]of Object.entries(final.state.learners))assert.deepEqual(states[id],state.steering);
  }
  console.log(JSON.stringify({seed:history.seed,decisions,updates,crossCue}));
}
const report={schema:1,passed:true,decisions,updates,terminalUpdates,crossCue,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),
  scope:'Post-outcome independent factual cue routing, executed steering, TD updates, RNG and declared steering work; not independent physics, all-component costs or statistical qualification.'};
writeFileSync(join(base,'learning-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
