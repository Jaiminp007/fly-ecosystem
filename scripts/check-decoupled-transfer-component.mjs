import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/decoupled-transfer-component/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)));
const protocol=read(join(base,'protocol.json'));for(const [name,digest]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),digest);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(base,'sources/learning/odor-routed-experiment.mjs')).href);let replays=0,decisions=0,receipts=0,assignments=0;const rows=[];
for(const input of protocol.inputs){
  const anchors={};for(const phase of ['A','B','D']){const data=readFileSync(join(root,input.anchors[phase].path));assert.equal(hash(data),input.anchors[phase].sha256);anchors[phase]=JSON.parse(data);}
  const row=read(join(base,'rows',input.history.seed+'.json'));
  for(const phase of ['transfer']){let common=null;
    for(const arm of protocol.arms){
      const label=input.history.seed+'-'+phase+'-'+arm,initial=read(join(base,'starts',label+'.json')),final=read(join(base,'finals',label+'.json'));
      const run=OdorRoutedExperiment.fork(anchors.D,{phase,seed:input.history.probeSeeds[phase],mode:'current',modelAnchor:anchors.A,steeringMode:'learned',compactFrozen:true});
      for(const fly of run.world.flies){
        const state=run.learners[fly.id],taste=anchors[arm[0]].state.learners[fly.id],steering=anchors[arm[1]].state.learners[fly.id];
        for(const route of ['present','absent']){assert.deepEqual(anchors.A.state.learners[fly.id].banks[route].weights,anchors.B.state.learners[fly.id].banks[route].weights);assert.deepEqual(anchors.A.state.learners[fly.id].banks[route].weights,anchors.D.state.learners[fly.id].banks[route].weights);}
        state.taste.weights=structuredClone(taste.taste.weights);state.cueTaste.weights=structuredClone(taste.cueTaste.weights);state.cueTaste.residuals=structuredClone(taste.cueTaste.residuals);state.steering.weights=structuredClone(steering.steering.weights);state.steering.contextWeights=structuredClone(steering.steering.contextWeights);
        assert.equal(state.work.scalarOperations,state.charge.operationsBilled);state.work.scalarOperations+=326;state.charge.storageBytes=0;
        const due=326*run.pricing.operationEnergy;state.charge.operationsBilled+=326;state.charge.outstandingEnergy+=due;state.charge.incurredEnergy+=due;assignments++;
      }
      assert.deepEqual(run.checkpoint(false),initial);const worldHash=hash(JSON.stringify(initial.world));if(common===null)common=worldHash;else assert.equal(worldHash,common);
      const digest=createHash('sha256'),stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>digest.update(chunk));const pending={},storage={},paid={};let events=0;
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
        const event=JSON.parse(line);events++;
        if(event.type==='decision'){assert.ok(!pending[event.id]);pending[event.id]=event.tick;storage[event.id]=(storage[event.id]??0)+event.storageBytes*run.pricing.byteEnergyPerSecond*.1;
          assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);decisions++;}
        else if(event.type==='physical'){assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];paid[event.agentId]=(paid[event.agentId]??0)+event.paidExtra;receipts++;}
      }
      assert.equal(Object.keys(pending).length,0);assert.equal(events,row.phases[phase].arms[arm].trace.events);assert.equal(digest.digest('hex'),row.phases[phase].arms[arm].trace.sha256);
      for(const [id,state]of Object.entries(final.state.learners)){const prior=initial.state.learners[id],charge=state.charge;
        close(charge.incurredEnergy,prior.charge.incurredEnergy+(state.work.scalarOperations-prior.charge.operationsBilled)*run.pricing.operationEnergy+(storage[id]??0));
        close(charge.paidEnergy,prior.charge.paidEnergy+(paid[id]??0));close(charge.outstandingEnergy,charge.incurredEnergy-charge.paidEnergy);assert.equal(charge.operationsBilled,state.work.scalarOperations);
        assert.deepEqual(state.taste.weights,prior.taste.weights);assert.deepEqual(state.cueTaste.weights,prior.cueTaste.weights);assert.deepEqual(state.cueTaste.residuals,prior.cueTaste.residuals);assert.deepEqual(state.steering.weights,prior.steering.weights);assert.deepEqual(state.steering.contextWeights,prior.steering.contextWeights);
      }
      const replay=createHash('sha256');let replayEvents=0;run.attach(event=>{replay.update(JSON.stringify(event)+'\n');replayEvents++;});const endpoint=run.advance(protocol.ticks);run.attach(null);
      assert.deepEqual(endpoint,row.phases[phase].arms[arm].endpoint);assert.deepEqual(JSON.parse(JSON.stringify(run.checkpoint(false))),final);assert.equal(replayEvents,events);assert.equal(replay.digest('hex'),row.phases[phase].arms[arm].trace.sha256);replays++;
    }
    const arms=row.phases[phase].arms;
    for(const metric of ['energy','netIntake','survivors']){
      const value=arm=>{const endpoint=arms[arm].endpoint;if(metric==='energy')return endpoint.budgetAdjustedEnergyPerFounder;if(metric==='survivors')return endpoint.survivors;const stats=endpoint.statistics[phase]??{intake:0,toxin:0};return (stats.intake-stats.toxin)/endpoint.founders;};
      const expected={BminusA:value('DB')-value('DA'),DminusB:value('DD')-value('DB'),DminusA:value('DD')-value('DA')};
      for(const [key,number]of Object.entries(expected))close(number,row.phases[phase][metric][key]);
    }
  }
  rows.push(row);
  console.log(JSON.stringify({seed:input.history.seed,replays,decisions}));
}
const result=read(join(base,'results.json'));for(const phase of ['transfer'])for(const metric of ['energy','netIntake','survivors'])for(const key of ['BminusA','DminusB','DminusA']){
  const values=rows.map(row=>row.phases[phase][metric][key]);close(result.phases[phase][metric][key].mean,values.reduce((sum,value)=>sum+value,0)/values.length);assert.equal(result.phases[phase][metric][key].positiveHistories,values.filter(value=>value>0).length);
}
assert.equal(decisions,receipts);const report={schema:1,passed:true,replays,decisions,receipts,assignments,scope:'Independent component assignment, outcome arithmetic and setup billing, frozen weights, reported ledgers and exact captured-source replay; not independent physics or complete low-level energy adequacy.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));


