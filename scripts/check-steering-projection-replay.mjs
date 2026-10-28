import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
function createSteeringMeanProjection(agentId){return {agentId,means:[Array(8).fill(0),Array(8).fill(0)],counts:[0,0],lastTick:null,work:{scalarOperations:18}};}
function projectOwnSteeringIncrement(state,own,increment){
  assert.equal(state.agentId,own.agentId);assert.ok(state.lastTick===null||own.tick>state.lastTick);
  const mean=state.means[own.action];let dot=0,norm=0;
  for(let index=0;index<8;index++){norm+=mean[index]*mean[index];dot+=mean[index]*increment[index];}
  const scale=norm>0?dot/norm:0,result=increment.map((value,index)=>value-scale*mean[index]),count=state.counts[own.action]+1;
  state.means[own.action]=mean.map((value,index)=>value+(own.features[index]-value)/count);state.counts[own.action]=count;state.lastTick=own.tick;state.work.scalarOperations+=128;return result;
}
function encodedStateBytes(value){if(value===null||typeof value==='boolean')return 1;if(typeof value==='number')return 8;if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+encodedStateBytes(item),0);return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+encodedStateBytes(item),0);}

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/decoupled-cue-development/20261026-v1'),transfer=join(root,'evidence/decoupled-transfer-stage/20261026-v1'),output=join(root,'evidence/steering-projection-replay/20261026-v1');
assert.ok(existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),sourceProtocol=read(join(source,'protocol.json')),transferProtocol=read(join(transfer,'protocol.json'));
const protocol=read(join(output,'protocol.json'));assert.equal(protocol.sourceProtocol,sha(readFileSync(join(source,'protocol.json'))));assert.equal(protocol.transferProtocol,sha(readFileSync(join(transfer,'protocol.json'))));for(const [path,digest]of Object.entries(protocol.files))assert.equal(sha(readFileSync(join(output,'sources',path))),digest);
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
  assert.deepEqual(row,read(join(output,history.seed+'.json')));rows.push(row);console.log(JSON.stringify({seed:row.seed,updates:row.updates}));
}
const driftWins=Object.fromEntries(['DB','DC'].map(arm=>[arm,rows.filter(row=>row.evaluation[arm].projected<row.evaluation[arm].baseline).length])),tdWins=rows.filter(row=>row.td[1]<=row.td[0]).length;
const result={schema:1,qualified:false,driftWins,tdWins,screenPassed:rows.length===8&&driftWins.DB>=6&&driftWins.DC>=6&&tdWins>=6,scope:protocol.scope};assert.deepEqual(result,read(join(output,'results.json')));const report={schema:1,passed:true,histories:rows.length,updates:rows.reduce((sum,row)=>sum+row.updates,0),scope:'Separate projection/encoding implementation and recorded factual replay; no independent physics, hardware pricing or provenance beyond stored trace hashes.'};writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));

