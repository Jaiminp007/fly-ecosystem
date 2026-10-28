import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1'),output=join(root,'evidence/own-steering-delayed-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
mkdirSync(join(root,'evidence/own-steering-delayed-census'),{recursive:true});mkdirSync(output,{recursive:false});
const manifest={schema:1,kind:'factual-own-delayed-return',horizon:16,discount:Math.exp(-1/256),developmentProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),
  designSha256:hash(readFileSync(join(root,'docs/OWN_STEERING_DELAYED_RETURN_DESIGN.md'))),sourceSha256:hash(readFileSync(fileURLToPath(import.meta.url))),
  scope:'Observed actual-action trajectories, not randomized comparisons, fixed-speed outcomes or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const rows=[];
for(const history of protocol.histories){
  const seed=history.seed,label=seed+'-acquire-learned',row=read(join(base,'rows',seed+'.json')),expected=row.traces[label];
  const windows={},last={},bins={},stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',block=>digest.update(block));
  let events=0,decisions=0,transitions=0,completed=0,terminal=0;
  function advance(id,energy,tick,dead){
    const previous=last[id];assert.ok(previous);const change=energy-previous.energy,remaining=[];
    for(const window of windows[id]){
      if(window.steps===0)window.oneStep=change;
      window.returnEnergy+=window.factor*change;window.factor*=manifest.discount;window.steps++;
      window.crossed ||= window.phase==='A'?tick>512:window.phase==='B'?tick>1024:false;
      if(window.steps===manifest.horizon||dead){
        const key=window.phase+'-'+window.action+'-'+(window.contact?'contact':'no-contact')+'-'+(window.crossed?'cross':'within');
        const bin=bins[key]??={count:0,oneStepEnergy:0,returnEnergy:0,steps:0,terminal:0};
        bin.count++;bin.oneStepEnergy+=window.oneStep;bin.returnEnergy+=window.returnEnergy;bin.steps+=window.steps;bin.terminal+=Number(dead);
        completed++;terminal+=Number(dead);
      }else remaining.push(window);
    }
    windows[id]=remaining;transitions++;
  }
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);events++;
    if(event.type==='decision'){
      const id=event.id,own=event.own;assert.equal(own.agentId,id);assert.equal(own.tick,event.tick);
      if(last[id]){assert.equal(event.tick,last[id].tick+1);advance(id,own.energy,event.tick,false);}
      windows[id]??=[];windows[id].push({phase:event.tick<=512?'A':event.tick<=1024?'B':'C',action:event.choice.action,contact:own.contactPresent,
        steps:0,returnEnergy:0,factor:1,oneStep:0,crossed:false});last[id]={tick:event.tick,energy:own.energy};decisions++;
    }else if(event.type==='observe'&&event.own.terminal){
      const id=event.own.agentId;assert.equal(event.own.tick,last[id].tick);advance(id,event.own.energy,event.own.tick,true);delete last[id];delete windows[id];
    }
  }
  assert.equal(events,expected.events);assert.equal(digest.digest('hex'),expected.sha256);
  const censored=Object.values(windows).reduce((sum,list)=>sum+list.length,0);assert.equal(completed+censored,decisions);
  const result={seed,decisions,transitions,completed,terminal,censored,bins,traceSha256:expected.sha256};
  writeFileSync(join(output,seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify({seed,decisions,transitions,completed,terminal,censored}));
}
const bins={};for(const row of rows)for(const [key,value]of Object.entries(row.bins)){
  const sum=bins[key]??={count:0,oneStepEnergy:0,returnEnergy:0,steps:0,terminal:0};for(const field of Object.keys(sum))sum[field]+=value[field];
}
const result={schema:1,qualified:false,histories:rows.length,decisions:rows.reduce((sum,row)=>sum+row.decisions,0),completed:rows.reduce((sum,row)=>sum+row.completed,0),
  terminal:rows.reduce((sum,row)=>sum+row.terminal,0),censored:rows.reduce((sum,row)=>sum+row.censored,0),bins,scope:manifest.scope};
writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
