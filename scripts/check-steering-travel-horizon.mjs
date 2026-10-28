import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1'),output=join(root,'evidence/steering-travel-horizon/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(output,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(output,'sources',name))),expected);
const names=['base','geometry','delayed'];let training=0,evaluation=0,terminalRecords=0,censored=0;
for(const input of protocol.inputs){
  const weights={},previous={};let savedPrevious,snapshot;
  const body=id=>weights[id]??=Object.fromEntries(names.map(name=>[name,Array.from({length:2},()=>Array(name==='base'?8:11).fill(0))]));
  const row=read(join(output,'rows',input.history.seed+'.json')),models=read(join(output,'models',input.history.seed+'.json'));
  for(const phase of ['A','B','C','transfer']){
    if(phase==='C'){savedPrevious=structuredClone(previous);snapshot=JSON.stringify(weights);}
    if(phase==='transfer'){for(const key of Object.keys(previous))delete previous[key];Object.assign(previous,structuredClone(savedPrevious));}
    const train=phase==='A'||phase==='B',queues={},lastTicks={},stats=Object.fromEntries(names.map(name=>[name,{count:0,squaredError:0,actions:[0,0]}]));
    let phaseTerminal=0,phaseTraining={};
    const recordStream=createReadStream(join(output,'records',input.history.seed+'-'+phase+'.jsonl')),recordHash=createHash('sha256');recordStream.on('data',chunk=>recordHash.update(chunk));
    const records=createInterface({input:recordStream,crlfDelay:Infinity})[Symbol.asyncIterator]();
    const verify=async(prior,energy,terminal)=>{
      const next=await records.next();assert.ok(!next.done);const actual=JSON.parse(next.value),target=(energy-prior.energy)/120;
      const group=body(prior.agentId),phis={base:prior.features,geometry:[...prior.features,...prior.current],delayed:[...prior.features,...prior.delayed]},predictions={};
      for(const name of names){
        const phi=phis[name],selected=group[name][prior.action],prediction=selected.reduce((sum,value,index)=>sum+value*phi[index],0);predictions[name]=prediction;
        if(train){const norm=phi.reduce((sum,value)=>sum+value*value,1),step=.1*(target-prediction)/norm;
          for(let index=0;index<phi.length;index++)selected[index]=Math.max(-8,Math.min(8,selected[index]+step*phi[index]));}
        else{stats[name].count++;stats[name].actions[prior.action]++;stats[name].squaredError+=(prediction-target)**2;}
      }
      assert.deepEqual(actual,{...prior,phis,target,terminal,predictions});
      if(train){training++;phaseTraining[prior.agentId]=(phaseTraining[prior.agentId]??0)+1;}else evaluation++;
      if(terminal){terminalRecords++;phaseTerminal++;}
    };
    const inputStream=createReadStream(join(base,'traces',input.labels[phase].label+'.jsonl')),inputHash=createHash('sha256');inputStream.on('data',chunk=>inputHash.update(chunk));
    for await(const line of createInterface({input:inputStream,crlfDelay:Infinity})){
      const event=JSON.parse(line);
      if(event.type==='decision'){
        const id=event.id;body(id);queues[id]??=[];if(lastTicks[id]!==undefined)assert.equal(event.tick,lastTicks[id]+1);
        while(queues[id].length&&event.tick-queues[id][0].tick>=protocol.horizon){const prior=queues[id].shift();assert.equal(event.tick-prior.tick,protocol.horizon);await verify(prior,event.own.energy,false);}
        const point=event.recommendation.point,current=[Math.tanh(event.recommendation.score),...point.map(value=>Math.max(-1,Math.min(1,value/100)))],delayed=previous[id]??[0,0,0];
        queues[id].push({agentId:id,tick:event.tick,energy:event.own.energy,action:event.steering.action,features:event.features,current,delayed});previous[id]=current;lastTicks[id]=event.tick;
      }else if(event.type==='observe'&&event.own.terminal){const own=event.own;assert.equal(lastTicks[own.agentId],own.tick);
        for(const prior of queues[own.agentId])await verify(prior,own.energy,true);queues[own.agentId]=[];}
    }
    assert.equal((await records.next()).done,true);assert.equal(inputHash.digest('hex'),input.labels[phase].sha256);assert.equal(recordHash.digest('hex'),row.recordHashes[phase]);
    const missing=Object.values(queues).reduce((sum,queue)=>sum+queue.length,0);censored+=missing;
    assert.deepEqual(row.counts[phase],{terminalRecords:phaseTerminal,censored:missing,trainingByFounder:phaseTraining});
    for(const value of Object.values(stats))value.mse=value.count?value.squaredError/value.count:null;
    assert.deepEqual(row.statistics[phase],stats);if(!train)assert.equal(JSON.stringify(weights),snapshot);
  }
  for(const [id,group]of Object.entries(weights))for(const name of names)assert.deepEqual(group[name],models[id][name].weights);
  console.log(JSON.stringify({seed:input.history.seed,training,evaluation}));
}
const report={schema:1,passed:true,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),trainingReturns:training,evaluationReturns:evaluation,terminalRecords,censored,
  scope:'Post-outcome independent factual horizon provenance, delayed training, terminal absorption, frozen predictions and MSE; not independent physics, physical costs or action-causal value.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
