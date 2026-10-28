import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-probe-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
function motorUpdate(previous,current,terminal){
  const index=Math.floor(current.replayRngState/4294967296*current.memory.length),replayed=current.memory[index];
  assert.ok(replayed);
  return 78+(terminal?0:87)+3+312+(previous.memory.length<32?0:10)+9+78+(replayed.terminal?0:87)+68+(terminal?39:0);
}
const rows=[];
for(const arm of protocol.cases.map(item=>item.label)){
  const start=read(join(base,arm+'-start.json')),states=structuredClone(start.state.learners),pending={};
  let decisions=0,observations=0,motorUpdates=0,tasteUpdates=0;
  const stream=createReadStream(join(base,arm+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const previous=states[event.id],current=event.auditState,{fly,sensed,food}=event.auditSpatial,points=current.spatialPoints;
      let contactWork=1+6*food.length;
      for(const patch of food)if((patch.x-fly.x)**2+(patch.y-fly.y)**2<=225)contactWork++;
      const spatialWork=2+sensed.length+9*points.length;
      let recommendationWork=4*points.length;
      for(let first=0;first<points.length;first++)for(let second=first+1;second<points.length;second++){
        const left=points[first],right=points[second],separation=Math.abs(left[0]-right[0]);recommendationWork+=3;
        if(separation>32)continue;recommendationWork+=3;
        if(Math.hypot(separation,left[1]-right[1])<=30)recommendationWork+=9;
      }
      let motorWork=14+78+2+14+3+4;
      if(previous.pending){motorWork+=2;if(previous.acquisition){motorWork+=motorUpdate(previous,current,false);motorUpdates++;}}
      const tasteWork=6+(event.own.odorPresent?29:0)+7+4;
      const steeringWork=current.steering.work.scalarOperations-previous.steering.work.scalarOperations;
      const expected=spatialWork+contactWork+1+motorWork+tasteWork+recommendationWork+15+14+steeringWork+10;
      assert.equal(current.work.scalarOperations-previous.work.scalarOperations,expected,`${arm} body ${event.id} tick ${event.tick}`);
      states[event.id]=current;pending[event.id]=event;decisions++;
    }else if(event.type==='observe'){
      const own=event.own,previous=states[own.agentId],current=event.auditState,decision=pending[own.agentId];
      let expected=1+3;
      const tasteExample=decision.choice.move===-1&&decision.choice.accept&&decision.own.contactPresent&&decision.own.odorPresent&&own.lastFood!==0;
      if(previous.acquisition&&tasteExample){expected+=6+3+(previous.taste.memory.length<32?0:10)+2*(29+48)+9;tasteUpdates++;}
      if(own.terminal&&previous.pending){expected+=2;if(previous.acquisition){expected+=motorUpdate(previous,current,true);motorUpdates++;}}
      expected+=current.steering.work.scalarOperations-previous.steering.work.scalarOperations;
      assert.equal(current.work.scalarOperations-previous.work.scalarOperations,expected,`${arm} observe body ${own.agentId} tick ${own.tick}`);
      states[own.agentId]=current;delete pending[own.agentId];observations++;
    }
  }
  assert.equal(Object.keys(pending).length,0);
  rows.push({arm,decisions,observations,motorUpdates,tasteUpdates,traceSha256:digest.digest('hex')});
}
const report={schema:1,passed:true,rows,scope:'Independent branch-by-branch reconstruction of declared controller scalar-operation increments on logged snapshots, including motor replay and taste-credit branches. Relies on logged state and existing cost convention; does not prove convention prices every low-level operation or physical dynamics.'};
writeFileSync(join(base,'probe-work-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
