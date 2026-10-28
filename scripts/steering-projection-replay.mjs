import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSteeringMeanProjection,projectOwnSteeringIncrement} from '../learning/steering-mean-projection.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/decoupled-cue-development/20261026-v1'),transfer=join(root,'evidence/decoupled-transfer-stage/20261026-v1'),output=join(root,'evidence/steering-projection-replay/20261026-v1');
assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),sourceProtocol=read(join(source,'protocol.json')),transferProtocol=read(join(transfer,'protocol.json'));
const paths=['scripts/steering-projection-replay.mjs','learning/steering-mean-projection.mjs','learning/own-steering.mjs','learning/sarsa-experiment.mjs','docs/STEERING_PROJECTION_REPLAY_PLAN.md'];
const files=Object.fromEntries(paths.map(path=>[path,sha(readFileSync(join(root,path)))]));
const protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),transferProtocol:sha(readFileSync(join(transfer,'protocol.json'))),files,scope:'Selected factual open-loop development diagnostic; not paid physical behavior or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
for(const path of paths){const target=join(output,'sources',path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,path)),{flag:'wx'});}
const route=cue=>cue.every(value=>value===0)?0:1+cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);
const values=(model,slot,features)=>model.weights.map((row,action)=>row.reduce((sum,value,index)=>sum+(value+model.contextWeights[slot][action][index])*features[index],0));
const difference=(model,features)=>{const predicted=values(model,0,features);return predicted[1]-predicted[0];};
const close=(first,second)=>assert.ok(Math.abs(first-second)<1e-10+1e-10*Math.max(Math.abs(first),Math.abs(second)));
async function events(path,compressed,expected,consume){
  const digest=createHash('sha256'),stream=compressed?createReadStream(path).pipe(createGunzip()):createReadStream(path);let count=0;
  stream.on('data',chunk=>digest.update(chunk));for await(const line of createInterface({input:stream,crlfDelay:Infinity})){consume(JSON.parse(line));count++;}
  assert.equal(digest.digest('hex'),expected.sha256);assert.equal(count,expected.events);
}
const rows=[];
for(const history of sourceProtocol.histories){
  const original=read(join(source,'rows',history.seed+'.json')),trow=read(join(transfer,'rows',history.seed+'.json')),tinput=transferProtocol.inputs.find(input=>input.history.seed===history.seed);assert.ok(tinput);
  const anchors={};for(const phase of ['B','C','D']){const bytes=readFileSync(join(root,tinput.anchors[phase].path));assert.equal(sha(bytes),tinput.anchors[phase].sha256);anchors[phase]=JSON.parse(bytes);}
  const agents={};for(const fly of anchors.D.world.world.flies){const model=anchors.B.state.learners[fly.id].steering;assert.ok(model.pending);agents[fly.id]={baseline:structuredClone(model),projected:structuredClone(model),reference:structuredClone(model),memory:createSteeringMeanProjection(fly.id),td:[0,0],updates:0,support:[0,0]};}
  for(const phase of ['A','B']){const label=history.seed+'-shared-plus-cue-acquire-'+phase;
    await events(join(source,'traces',label+'.jsonl.gz'),true,original.traces[label],event=>{const agent=agents[event.id];if(event.type!=='decision'||!agent||event.tick>=agent.reference.pending.tick)return;
      projectOwnSteeringIncrement(agent.memory,{agentId:event.id,tick:event.tick,action:event.steering.action,features:event.features},Array(8).fill(0));agent.support[event.steering.action]++;});}
  const label=history.seed+'-shared-plus-cue-acquire-C';
  await events(join(source,'traces',label+'.jsonl.gz'),true,original.traces[label],event=>{const agent=agents[event.id];if(event.type!=='decision'||!agent)return;const nextRoute=route(event.own.cue);
    for(const [index,model]of [agent.baseline,agent.projected].entries()){
      const pending=model.pending;assert.ok(pending);assert.equal(event.tick,pending.tick+1);const prediction=values(model,pending.route,pending.features)[pending.action],next=values(model,nextRoute,event.features),delta=(event.own.energy-pending.energy)/120+Math.exp(-1/256)*(event.available?Math.max(...next):next[0])-prediction;
      const increment=pending.features.map(feature=>.025*delta*feature),shared=index===0?increment:projectOwnSteeringIncrement(agent.memory,{agentId:event.id,tick:pending.tick,action:pending.action,features:pending.features},increment);
      for(let position=0;position<8;position++){const action=pending.action;model.weights[action][position]=Math.max(-8,Math.min(8,model.weights[action][position]+shared[position]));const bank=model.contextWeights[pending.route][action];bank[position]=Math.max(-8,Math.min(8,bank[position]+increment[position]));}
      agent.td[index]+=delta*delta;model.pending={tick:event.tick,energy:event.own.energy,route:nextRoute,action:event.steering.action,features:[...event.features]};
    }
    agent.updates++;const predicted=values(agent.baseline,nextRoute,event.features);for(let action=0;action<2;action++)close(predicted[action],event.steering.predictions[action]);
  });
  for(const [id,agent]of Object.entries(agents)){const expected=anchors.C.state.learners[id].steering;for(let action=0;action<2;action++)for(let index=0;index<8;index++){close(agent.baseline.weights[action][index],expected.weights[action][index]);for(let slot=0;slot<17;slot++)close(agent.baseline.contextWeights[slot][action][index],expected.contextWeights[slot][action][index]);}}
  const evaluation={};for(const arm of ['DB','DC']){let count=0,baseline=0,projected=0;
    await events(join(transfer,'traces',history.seed+'-transfer-'+arm+'.jsonl'),false,trow.phases.transfer.arms[arm].trace,event=>{if(event.type!=='decision')return;const agent=agents[event.id];assert.ok(agent);assert.deepEqual(event.own.cue,[0,0,0,0]);const reference=difference(agent.reference,event.features);baseline+=Math.abs(difference(agent.baseline,event.features)-reference);projected+=Math.abs(difference(agent.projected,event.features)-reference);count++;});
    assert.ok(count>0);evaluation[arm]={count,baseline:baseline/count,projected:projected/count};}
  const entries=Object.values(agents),updates=entries.reduce((sum,agent)=>sum+agent.updates,0),td=[0,1].map(index=>entries.reduce((sum,agent)=>sum+agent.td[index],0)/updates);
  const row={seed:history.seed,agents:entries.length,updates,support:[0,1].map(action=>entries.reduce((sum,agent)=>sum+agent.support[action],0)),td,evaluation,memoryBytes:entries.reduce((sum,agent)=>sum+encodedStateBytes(agent.memory),0),declaredOperations:entries.reduce((sum,agent)=>sum+agent.memory.work.scalarOperations,0)};
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(row,null,2)+'\n',{flag:'wx'});rows.push(row);console.log(JSON.stringify(row));
}
const driftWins=Object.fromEntries(['DB','DC'].map(arm=>[arm,rows.filter(row=>row.evaluation[arm].projected<row.evaluation[arm].baseline).length])),tdWins=rows.filter(row=>row.td[1]<=row.td[0]).length;
const result={schema:1,qualified:false,driftWins,tdWins,screenPassed:rows.length===8&&driftWins.DB>=6&&driftWins.DC>=6&&tdWins>=6,scope:protocol.scope};writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
