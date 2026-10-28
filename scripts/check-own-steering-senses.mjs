import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-fixture/20261026-v4');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(root,name))),expected);
const rows=[];
for(const arm of protocol.arms){
  const start=read(join(base,arm+'-start.json')),last=Object.fromEntries(Object.entries(start.state.learners).map(([id,state])=>[id,{work:state.work.scalarOperations,steering:state.steering.work.scalarOperations}]));
  const stream=createReadStream(join(base,arm+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let decisions=0,patches=0;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);
    if(event.type==='observe'){
      last[event.own.agentId]={work:event.auditState.work.scalarOperations,steering:event.auditState.steering.work.scalarOperations};continue;
    }
    if(event.type!=='decision')continue;
    const {fly,sensed,food}=event.auditSpatial,raw=event.own.raw;
    const nearby=food.filter(patch=>Math.hypot(patch.x-fly.x,patch.y-fly.y)<=fly.sense);
    const ordered=items=>items.map(item=>JSON.stringify(item)).sort();assert.deepEqual(ordered(sensed),ordered(nearby));
    const points=[],cosine=Math.cos(fly.heading),sine=Math.sin(fly.heading);
    let best=null,bestScore=0,nearContact=null,nearestContact=Infinity,contactWork=0;
    for(const patch of sensed){
      if(patch.amount<=.06)continue;
      const dx=patch.x-fly.x,dy=patch.y-fly.y,distance=Math.hypot(dx,dy),value=patch.amount/(distance+20);
      points.push([dx*cosine+dy*sine,-dx*sine+dy*cosine,patch.amount]);
      if(value>bestScore){bestScore=value;best=patch;}
      if(distance<=15&&distance<nearestContact){nearestContact=distance;nearContact=patch;}
    }
    assert.deepEqual(event.auditState.spatialPoints,points);
    const sensedCue=(nearContact??best)?.cue??[0,0,0,0];assert.deepEqual(fly.sensedCue,sensedCue);
    if(best){
      const bearing=Math.atan2(best.y-fly.y,best.x-fly.x)-fly.heading,foodSine=Math.sin(bearing);
      close(raw[0],Math.cos(bearing));close(raw[1],Math.max(0,-foodSine));close(raw[2],Math.max(0,foodSine));
      close(raw[3],1-Math.hypot(best.x-fly.x,best.y-fly.y)/fly.sense);
    }else assert.deepEqual(raw.slice(0,4),[0,0,0,0]);
    let contact=null,contactDistance=Infinity;
    for(const patch of food){
      const dx=patch.x-fly.x,dy=patch.y-fly.y,squared=dx*dx+dy*dy;contactWork+=6;
      if(squared<=225){contactWork++;if(squared<contactDistance){contactDistance=squared;contact=patch;}}
    }
    contactWork++;
    assert.equal(event.own.contactPresent,!!contact);assert.deepEqual(event.own.cue,contact?.cue??sensedCue);
    assert.equal(event.own.odorPresent,event.own.cue[0]!==0);
    let recommendationWork=4*points.length;
    for(let first=0;first<points.length;first++)for(let second=first+1;second<points.length;second++){
      const left=points[first],right=points[second],separation=Math.abs(left[0]-right[0]);recommendationWork+=3;
      if(separation>32)continue;recommendationWork+=3;
      if(Math.hypot(separation,left[1]-right[1])<=30)recommendationWork+=9;
    }
    const sensoryWork=2+sensed.length+9*points.length,steeringWork=event.steeringWork-last[event.id].steering;
    const minimum=sensoryWork+contactWork+1+recommendationWork+15+14+steeringWork+10;
    assert.ok(event.work-last[event.id].work>=minimum);
    decisions++;patches+=food.length;
  }
  rows.push({arm,decisions,worldPatchObservations:patches,traceSha256:digest.digest('hex')});
}
const report={schema:1,passed:true,rows,scope:'Reconstructs query membership, transformed patch points, food direction, cue/contact observation and an explicit work lower bound from logged sensing-time world snapshots. Does not independently replay physical state, reconstruct all controller operations, or prove snapshot provenance.'};
writeFileSync(join(base,'sensory-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
