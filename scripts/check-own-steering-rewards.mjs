import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1'),output=join(root,'evidence/own-steering-reward-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const source=read(join(output,'protocol.json')),protocol=read(join(base,'protocol.json')),result=read(join(output,'results.json'));
assert.equal(hash(readFileSync(join(base,'protocol.json'))),source.developmentProtocolSha256);
assert.equal(hash(readFileSync(join(root,'scripts/census-own-steering-rewards.mjs'))),source.sourceSha256);
assert.equal(hash(readFileSync(join(root,'docs/OWN_STEERING_REWARD_DESIGN.md'))),source.designSha256);
const aggregate={};let transitions=0,verified=0;
for(const history of protocol.histories){
  const seed=history.seed,label=seed+'-acquire-learned',row=read(join(base,'rows',seed+'.json')),saved=read(join(output,seed+'.json'));
  const pending={},bins={};let count=0,terminal=0,boundary=0,events=0;
  function add(prior,energy,done){
    const phase=prior.tick<=512?'A':prior.tick<=1024?'B':'C',key=phase+'-'+prior.choice.action+'-'+(prior.own.contactPresent?'contact':'no-contact');
    const bin=bins[key]??={count:0,rewardEnergy:0,positive:0,beneficial:0,toxin:0,cost:0,terminal:0};
    const difference=energy-prior.own.energy;bin.count++;bin.rewardEnergy+=difference;bin.positive+=Number(difference>0);
    bin.beneficial+=prior.receipt.beneficialEaten;bin.toxin+=prior.receipt.toxinDamage;bin.cost+=prior.receipt.cost;bin.terminal+=Number(done);
    count++;terminal+=Number(done);boundary+=Number(!done&&(prior.tick===512||prior.tick===1024));
  }
  const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',block=>digest.update(block));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;
    if(event.type==='decision'){
      const old=pending[event.id];if(old){assert.equal(old.tick+1,event.tick);add(old,event.own.energy,false);}pending[event.id]=event;
    }else if(event.type==='physical'){
      assert.equal(pending[event.agentId].tick,event.tick);pending[event.agentId].receipt=event;
    }else if(event.type==='observe'&&event.own.terminal){
      const prior=pending[event.own.agentId];assert.equal(prior.tick,event.own.tick);add(prior,event.own.energy,true);delete pending[event.own.agentId];
    }
  }
  assert.equal(digest.digest('hex'),row.traces[label].sha256);assert.equal(events,row.traces[label].events);
  assert.equal(count,saved.transitions);assert.equal(terminal,saved.terminal);assert.equal(boundary,saved.boundary);assert.equal(Object.keys(pending).length,saved.censored);
  assert.deepEqual(Object.keys(bins).sort(),Object.keys(saved.bins).sort());
  for(const [key,bin]of Object.entries(bins)){
    const sum=aggregate[key]??={count:0,rewardEnergy:0,positive:0,beneficial:0,toxin:0,cost:0,terminal:0};
    for(const [field,value]of Object.entries(bin)){close(value,saved.bins[key][field]);sum[field]+=value;}
  }
  const snapshots=[read(join(base,'finals',label+'.json')),...row.anchorPhases.map(phase=>read(join(base,'anchors',seed+'-'+phase+'.json')))];
  const records=snapshots.reduce((sum,checkpoint)=>sum+Object.values(checkpoint.state.learners).reduce((total,state)=>total+state.memory.length,0),0);
  assert.equal(records,saved.retainedRecordsVerified);verified+=records;transitions+=count;
}
assert.equal(transitions,result.totalTransitions);assert.equal(verified,result.totalVerified);
for(const [key,bin]of Object.entries(aggregate))for(const [field,value]of Object.entries(bin))close(value,result.bins[key][field]);
const report={schema:1,passed:true,transitions,retainedRecordsCounted:verified,scope:'Independent factual budget-reward and receipt aggregation; counts retained entries but does not independently replay TD, memory-selection RNG or physics.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
