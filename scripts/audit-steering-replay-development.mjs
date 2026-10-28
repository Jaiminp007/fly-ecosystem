import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const captured=name=>pathToFileURL(join(base,'sources',name)).href;
const {OdorRoutedExperiment}=await import(captured('learning/odor-routed-experiment.mjs'));
const {CoverageExperiment}=await import(captured('learning/coverage-experiment.mjs'));
const {freezeCoverageBody}=await import(captured('learning/coverage-sarsa.mjs'));
const {billSarsaWork}=await import(captured('learning/sarsa-experiment.mjs'));
function advance(seed){let value=seed;value^=value<<13;value^=value>>>17;value^=value<<5;return value>>>0;}
function values(state,features){return state.weights.map(row=>row.reduce((sum,value,index)=>sum+value*features[index],0));}
function update(state,record,rate){
  const predicted=values(state,record.features)[record.action],next=record.terminal?0:values(state,record.nextFeatures);
  const target=record.terminal?0:record.available?Math.max(...next):next[0];
  const error=record.reward+Math.exp(-1/256)*target-predicted;
  state.weights[record.action]=state.weights[record.action].map((weight,index)=>Math.max(-8,Math.min(8,weight+rate*error*record.features[index])));
}
function transition(state,energy,features,available,terminal){
  const pending=state.pending,record={agentId:state.agentId,tick:pending.tick,action:pending.action,features:pending.features,
    nextFeatures:terminal?null:features,available:terminal?false:available,reward:(energy-pending.energy)/120,terminal};
  update(state,record,.05);state.updates++;state.seen++;state.work.scalarOperations+=(terminal?12:20)+(terminal?76:108)+2;
  if(state.memory.length<32)state.memory.push(record);
  else{state.retentionRngState=advance(state.retentionRngState);const index=Math.floor(state.retentionRngState/4294967296*state.seen);state.work.scalarOperations+=10;if(index<32)state.memory[index]=record;}
  state.replayRngState=advance(state.replayRngState);const sample=state.memory[Math.floor(state.replayRngState/4294967296*state.memory.length)];
  update(state,sample,.01);state.replayUpdates++;state.pending=null;state.work.scalarOperations+=9+(sample.terminal?76:108);
}
let decisions=0,updates=0,terminals=0,links=0,probes=0;const rows=[];
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json'));
  for(const arm of protocol.arms){
    const anchor=phase=>read(join(base,'anchors',history.seed+'-'+arm+'-'+phase+'.json'));
    const start=label=>read(join(base,'starts',label+'.json'));
    const final=label=>read(join(base,'finals',label+'.json'));
    const prefix=history.seed+'-'+arm,acquisition=phase=>prefix+'-acquire-'+phase;
    const initial=new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringLearner:arm});
    assert.deepEqual(initial.checkpoint(false),start(acquisition('A')));links++;
    for(const [index,phase]of ['A','B','C','D'].entries())if(row.arms[arm].anchorPhases.includes(phase)){
      const current=anchor(phase);assert.deepEqual(current,final(acquisition(phase)));links++;
      if(index<3){
        const following=['B','C','D'][index];if(row.traces[acquisition(following)]){
          if(phase==='A'){
            const run=OdorRoutedExperiment.restore(current);
            for(const fly of run.world.flies){const state=run.learners[fly.id];for(const motor of Object.values(state.banks)){const prior=motor.work.scalarOperations;freezeCoverageBody(motor);state.work.scalarOperations+=motor.work.scalarOperations-prior;}state.charge.storageBytes=0;billSarsaWork(state,run.pricing);}
            assert.deepEqual(run.checkpoint(false),start(acquisition(following)));
          }else assert.deepEqual(current,start(acquisition(following)));
          links++;
        }
      }
    }
    if(row.arms[arm].anchorPhases.includes('D'))for(const [key,entry]of Object.entries(row.arms[arm].probes))if(entry){
      const [phase,mode]=key.split(/-(.+)/),seed=history.probeSeeds[phase],label=prefix+'-probe-'+key,physical=anchor('D');let run;
      if(mode==='native-full')run=CoverageExperiment.fork({...structuredClone(physical),kind:'coverage-world'},{phase,seed,mode:'native-full'});
      else run=OdorRoutedExperiment.fork(physical,{phase,seed,mode:mode==='reset'?'reset':'current',modelAnchor:mode==='earlier'?anchor(phase):null,steeringMode:['native','guarded'].includes(mode)?mode:'learned'});
      assert.deepEqual(run.checkpoint(false),start(label));assert.equal(hash(JSON.stringify(run.world.checkpoint())),entry.startWorldSha256);probes++;
      if(mode!=='native-full')for(const fly of run.world.flies){
        const actual=run.learners[fly.id],source=(mode==='earlier'?anchor(phase):physical).state.learners[fly.id];
        if(mode==='reset'){
          assert.ok(actual.steering.weights.flat().every(value=>value===0));assert.ok(actual.taste.weights.every(value=>value===0));
          for(const bank of Object.values(actual.banks))assert.ok(bank.weights.flat().every(value=>value===0));
        }else{
          assert.deepEqual(actual.steering.weights,source.steering.weights);assert.deepEqual(actual.taste.weights,source.taste.weights);
          for(const route of ['present','absent'])assert.deepEqual(actual.banks[route].weights,source.banks[route].weights);
        }
      }
    }
  }
  for(const [label,trace]of Object.entries(row.traces))if(label.includes('-replay-')&&!label.endsWith('-native-full')){
    const initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json'));
    const states=Object.fromEntries(Object.entries(initial.state.learners).map(([id,state])=>[id,structuredClone(state.steering)])),pending={};
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);
      if(event.type==='decision'){
        const state=states[event.id];assert.ok(!pending[event.id]);
        if(state.pending){assert.equal(state.pending.tick+1,event.tick);transition(state,event.own.energy,event.features,event.available,false);updates++;}
        const predictions=values(state,event.features),best=event.available&&predictions[1]>predictions[0]?1:0;
        state.rngState=advance(state.rngState);const proposed=state.acquisition&&event.available&&state.rngState/4294967296<.1?1-best:best;
        const action=initial.state.steeringMode==='native'?0:initial.state.steeringMode==='guarded'?Number(event.available):proposed;
        assert.deepEqual(event.steering,{action,proposed,predictions});
        state.pending=state.acquisition?{tick:event.tick,energy:event.own.energy,action,features:event.features}:null;
        state.work.scalarOperations+=state.acquisition?49:41;state.lastDecisionTick=event.tick;pending[event.id]=event.tick;decisions++;
      }else if(event.type==='observe'){
        const id=event.own.agentId,state=states[id];assert.equal(pending[id],event.own.tick);
        if(event.own.terminal){if(state.pending){assert.equal(state.pending.tick,event.own.tick);transition(state,event.own.energy,null,false,true);updates++;terminals++;}state.dead=true;}
        delete pending[id];
      }
    }
    assert.equal(digest.digest('hex'),trace.sha256);assert.equal(Object.keys(pending).length,0);
    for(const [id,state]of Object.entries(final.state.learners))assert.deepEqual(states[id],state.steering);
  }
  rows.push({seed:history.seed});console.log(JSON.stringify({seed:history.seed,decisions,updates,links,probes}));
}
const report={schema:1,passed:true,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),decisions,updates,terminalUpdates:terminals,checkpointLinks:links,probeStarts:probes,rows,
  scope:'Post-outcome independent replay-steering reconstruction and captured-source checkpoint/probe ancestry; not independent physics, complete sensing or general low-level cost adequacy.'};
writeFileSync(join(base,'steering-ancestry-readback-v2.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
