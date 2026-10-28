import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1'),output=join(root,'evidence/own-steering-delayed-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const spec=read(join(output,'protocol.json')),protocol=read(join(base,'protocol.json')),summary=read(join(output,'results.json'));
assert.equal(hash(readFileSync(join(base,'protocol.json'))),spec.developmentProtocolSha256);
assert.equal(hash(readFileSync(join(root,'scripts/census-own-steering-delayed.mjs'))),spec.sourceSha256);
assert.equal(hash(readFileSync(join(root,'docs/OWN_STEERING_DELAYED_RETURN_DESIGN.md'))),spec.designSha256);
const totals={};let decisions=0,completed=0,censored=0;
for(const history of protocol.histories){
  const seed=history.seed,name=seed+'-acquire-learned',development=read(join(base,'rows',seed+'.json')),expected=read(join(output,seed+'.json'));
  const trajectories={},stream=createReadStream(join(base,'traces',name+'.jsonl')),digest=createHash('sha256');stream.on('data',block=>digest.update(block));let events=0;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;
    if(event.type==='decision'){
      const list=trajectories[event.id]??=[];list.push({tick:event.tick,energy:event.own.energy,action:event.choice.action,contact:event.own.contactPresent});
    }else if(event.type==='observe'&&event.own.terminal){
      const list=trajectories[event.own.agentId];assert.equal(list.at(-1).tick,event.own.tick);list.at(-1).terminalEnergy=event.own.energy;
    }
  }
  assert.equal(digest.digest('hex'),development.traces[name].sha256);assert.equal(events,development.traces[name].events);
  const bins={};let count=0,complete=0,censor=0,terminal=0;
  for(const list of Object.values(trajectories))for(let start=0;start<list.length;start++){
    const first=list[start],phase=first.tick<=512?'A':first.tick<=1024?'B':'C',limit=phase==='A'?512:phase==='B'?1024:Infinity;
    let sum=0,oneStep=0,factor=1,steps=0,dead=false,crossed=false;
    for(let offset=0;offset<spec.horizon;offset++){
      const current=list[start+offset],next=list[start+offset+1];assert.ok(current);
      let energy,tick;
      if(next){assert.equal(next.tick,current.tick+1);energy=next.energy;tick=next.tick;}
      else if(Object.hasOwn(current,'terminalEnergy')){energy=current.terminalEnergy;tick=current.tick;dead=true;}
      else break;
      const delta=energy-current.energy;if(offset===0)oneStep=delta;sum+=factor*delta;factor*=spec.discount;steps++;crossed ||= tick>limit;
      if(dead)break;
    }
    count++;
    if(steps<spec.horizon&&!dead){censor++;continue;}
    const key=phase+'-'+first.action+'-'+(first.contact?'contact':'no-contact')+'-'+(crossed?'cross':'within');
    const bin=bins[key]??={count:0,oneStepEnergy:0,returnEnergy:0,steps:0,terminal:0};
    bin.count++;bin.oneStepEnergy+=oneStep;bin.returnEnergy+=sum;bin.steps+=steps;bin.terminal+=Number(dead);complete++;terminal+=Number(dead);
  }
  assert.equal(count,expected.decisions);assert.equal(complete,expected.completed);assert.equal(censor,expected.censored);assert.equal(terminal,expected.terminal);
  assert.deepEqual(Object.keys(bins).sort(),Object.keys(expected.bins).sort());
  for(const [key,bin]of Object.entries(bins)){
    const sum=totals[key]??={count:0,oneStepEnergy:0,returnEnergy:0,steps:0,terminal:0};
    for(const [field,value]of Object.entries(bin)){close(value,expected.bins[key][field]);sum[field]+=value;}
  }
  decisions+=count;completed+=complete;censored+=censor;
}
assert.equal(decisions,summary.decisions);assert.equal(completed,summary.completed);assert.equal(censored,summary.censored);
for(const [key,bin]of Object.entries(totals))for(const [field,value]of Object.entries(bin))close(value,summary.bins[key][field]);
const report={schema:1,passed:true,decisions,completed,censored,scope:'Independent buffered-trajectory reconstruction of discounted factual returns; not causal inference, TD replay or physics validation.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
