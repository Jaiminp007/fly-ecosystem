import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/target-taste-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
const protocol=read(join(base,'protocol.json'));assert.equal(hash(readFileSync(join(root,protocol.bankPath))),protocol.bankSha256);
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const captured=name=>pathToFileURL(join(base,'sources',name)).href;
const {OdorRoutedExperiment}=await import(captured('learning/odor-routed-experiment.mjs'));
const {CoverageExperiment}=await import(captured('learning/coverage-experiment.mjs'));
const {freezeCoverageBody}=await import(captured('learning/coverage-sarsa.mjs'));
const {billSarsaWork}=await import(captured('learning/sarsa-experiment.mjs'));
let decisions=0,receipts=0,links=0,probeStarts=0;
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json'));
  for(const arm of protocol.arms){
    const prefix=history.seed+'-'+arm,anchor=phase=>read(join(base,'anchors',prefix+'-'+phase+'.json'));
    const initial=new OdorRoutedExperiment({history,acquisitionGeometry:'continual',spatialSelector:'incremental',steeringLearner:'cue-shared',contactCueMode:'filter',targetCueMode:arm});
    assert.deepEqual(initial.checkpoint(false),read(join(base,'starts',prefix+'-acquire-A.json')));links++;
    for(const [index,phase]of ['A','B','C','D'].entries())if(row.arms[arm].anchorPhases.includes(phase)){
      const current=anchor(phase);assert.deepEqual(current,read(join(base,'finals',prefix+'-acquire-'+phase+'.json')));links++;
      if(index<3){const next=['B','C','D'][index],path=join(base,'starts',prefix+'-acquire-'+next+'.json');
        if(row.traces[prefix+'-acquire-'+next]){
          if(phase==='A'){
            const run=OdorRoutedExperiment.restore(current);
            for(const fly of run.world.flies){const state=run.learners[fly.id];for(const motor of Object.values(state.banks)){const before=motor.work.scalarOperations;freezeCoverageBody(motor);state.work.scalarOperations+=motor.work.scalarOperations-before;}state.charge.storageBytes=0;billSarsaWork(state,run.pricing);}
            assert.deepEqual(run.checkpoint(false),read(path));
          }else assert.deepEqual(current,read(path));links++;
        }
      }
    }
    if(row.arms[arm].anchorPhases.includes('D'))for(const [key,entry]of Object.entries(row.arms[arm].probes))if(entry){
      const [phase,mode]=key.split(/-(.+)/),seed=history.probeSeeds[phase],physical=anchor('D');let run;
      if(mode==='native-full')run=CoverageExperiment.fork({...structuredClone(physical),kind:'coverage-world'},{phase,seed,mode:'native-full'});
      else run=OdorRoutedExperiment.fork(physical,{phase,seed,mode:mode==='reset'?'reset':'current',modelAnchor:['A','B'].includes(mode)?anchor(mode):null,steeringMode:['native','guarded'].includes(mode)?mode:'learned',compactFrozen:true});
      assert.deepEqual(run.checkpoint(false),read(join(base,'starts',prefix+'-probe-'+key+'.json')));assert.equal(hash(JSON.stringify(run.world.checkpoint())),entry.startWorldSha256);probeStarts++;
      if(mode!=='native-full')for(const fly of run.world.flies){
        const state=run.learners[fly.id],source=(['A','B'].includes(mode)?anchor(mode):physical).state.learners[fly.id];
        if(mode==='reset'){
          assert.ok(state.steering.weights.flat().every(value=>value===0));if(state.steering.contextWeights)assert.ok(state.steering.contextWeights.flat(2).every(value=>value===0));
        }else{
          assert.deepEqual(state.steering.weights,source.steering.weights);if(state.steering.contextWeights)assert.deepEqual(state.steering.contextWeights,source.steering.contextWeights);
        }
      }
    }
  }
  for(const [label,trace]of Object.entries(row.traces)){
    const initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json')),pricing=initial.state.pricing;
    const storage={},paid={},pending={},counts={},digest=createHash('sha256');let events=0;
    const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*pricing.byteEnergyPerSecond*.1;
        if(event.steering){
          assert.equal(event.own.agentId,event.id);assert.ok(event.steering.action===0||event.available);assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);
          const count=counts[event.id]??={decisions:0,available:0,native:0,midpoint:0,present:[0,0,0],absent:[0,0,0]};
          count.decisions++;count.available+=Number(event.available);count[event.steering.action?'midpoint':'native']++;count[event.choice.route][event.choice.action]++;
        }
        decisions++;
      }else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);assert.deepEqual(counts,trace.counts);
    for(const [id,state]of Object.entries(final.state.learners)){
      const prior=initial.state.learners[id],charge=state.charge;
      close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*pricing.operationEnergy+(storage[id]??0));
      close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
      if(final.state.probe&&state.steering){assert.deepEqual(state.steering.weights,prior.steering.weights);if(state.steering.contextWeights)assert.deepEqual(state.steering.contextWeights,prior.steering.contextWeights);for(const route of ['present','absent'])assert.deepEqual(state.banks[route].weights,prior.banks[route].weights);assert.deepEqual(state.taste.weights,prior.taste.weights);}
    }
  }
  console.log(JSON.stringify({seed:history.seed,decisions,links,probeStarts}));
}
assert.equal(decisions,receipts);const report={schema:1,passed:true,decisions,receipts,checkpointLinks:links,probeStarts,
  scope:'Trace hashes, executed actions, captured-source model ancestry and reported-work/storage/payment ledgers; not independent physics, complete own-credit reconstruction or low-level cost adequacy.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
