import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1'),output=join(root,'evidence/own-steering-reward-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-10+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
mkdirSync(join(root,'evidence/own-steering-reward-census'),{recursive:true});mkdirSync(output,{recursive:false});
const manifest={schema:1,kind:'factual-own-motor-reward-census',sourceSha256:hash(readFileSync(fileURLToPath(import.meta.url))),designSha256:hash(readFileSync(join(root,'docs/OWN_STEERING_REWARD_DESIGN.md'))),
  developmentProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),scope:'Outcome-informed factual transitions, not a causal speed comparison or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
function features(own){const raw=own.raw;return [1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,own.contactPresent?raw[13]*.25:0];}
const rows=[];let totalVerified=0,totalTransitions=0;
for(const history of protocol.histories){
  const seed=history.seed,row=read(join(base,'rows',seed+'.json')),label=seed+'-acquire-learned',trace=row.traces[label];
  const snapshots=[['final',read(join(base,'finals',label+'.json'))],...row.anchorPhases.map(phase=>[phase,read(join(base,'anchors',seed+'-'+phase+'.json'))])];
  const required=new Map();let expectedRecords=0;
  for(const [name,checkpoint]of snapshots)for(const [id,state]of Object.entries(checkpoint.state.learners))for(const record of state.memory){
    assert.equal(record.agentId,Number(id));const key=id+':'+record.tick,items=required.get(key)??[];items.push({name,record});required.set(key,items);expectedRecords++;
  }
  const bins={},pending={},seen=new Set(),stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0,transitions=0,verified=0,terminal=0,boundary=0;
  function complete(previous,own,finished){
    assert.ok(previous.receipt);const start=previous.own,tick=previous.tick,phase=tick<=512?'A':tick<=1024?'B':'C';
    const key=phase+'-'+previous.choice.action+'-'+(start.contactPresent?'contact':'no-contact');
    const bin=bins[key]??={count:0,rewardEnergy:0,positive:0,beneficial:0,toxin:0,cost:0,terminal:0};
    const reward=(own.energy-start.energy)/120;bin.count++;bin.rewardEnergy+=reward*120;bin.positive+=Number(reward>0);
    bin.beneficial+=previous.receipt.beneficialEaten;bin.toxin+=previous.receipt.toxinDamage;bin.cost+=previous.receipt.cost;bin.terminal+=Number(finished);
    transitions++;terminal+=Number(finished);if(!finished&&(tick===512||tick===1024))boundary++;
    const recordKey=start.agentId+':'+tick,items=required.get(recordKey)??[];
    for(const item of items){
      const record=item.record;assert.equal(record.action,previous.choice.action);assert.equal(record.terminal,finished);close(record.reward,reward);
      const current=features(start),next=finished?Array(13).fill(0):features(own);
      for(let index=0;index<13;index++){close(record.phi[index],current[index]);close(record.nextPhi[index],next[index]);}
      verified++;
    }
    if(items.length)seen.add(recordKey);
  }
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;
    if(event.type==='decision'){
      const id=event.id,own=event.own;assert.equal(own.agentId,id);assert.equal(own.tick,event.tick);
      if(pending[id]){assert.equal(event.tick,pending[id].tick+1);complete(pending[id],own,false);}
      pending[id]=event;
    }else if(event.type==='physical'){
      const prior=pending[event.agentId];assert.ok(prior&&prior.tick===event.tick&&!prior.receipt);prior.receipt=event;
    }else if(event.type==='observe'&&event.own.terminal){
      const own=event.own,prior=pending[own.agentId];assert.ok(prior&&prior.tick===own.tick);complete(prior,own,true);delete pending[own.agentId];
    }
  }
  assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);assert.equal(verified,expectedRecords);assert.equal(seen.size,required.size);
  const result={seed,bins,transitions,terminal,boundary,censored:Object.keys(pending).length,retainedRecordsVerified:verified,traceSha256:trace.sha256};
  writeFileSync(join(output,seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);totalVerified+=verified;totalTransitions+=transitions;
  console.log(JSON.stringify({seed,transitions,terminal,censored:result.censored,retainedRecordsVerified:verified}));
}
const bins={};for(const row of rows)for(const [key,value]of Object.entries(row.bins)){
  const sum=bins[key]??={count:0,rewardEnergy:0,positive:0,beneficial:0,toxin:0,cost:0,terminal:0};for(const field of Object.keys(sum))sum[field]+=value[field];
}
const result={schema:1,passed:true,qualified:false,histories:rows.length,totalTransitions,totalVerified,bins,scope:manifest.scope};
writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
