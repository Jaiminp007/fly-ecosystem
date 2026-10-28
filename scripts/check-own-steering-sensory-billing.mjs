import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-fixture/20261026-v4');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
function bytes(value){
  if(value===null||typeof value==='boolean')return 1;
  if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}
  if(typeof value==='string')return 4+Buffer.byteLength(value);
  if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);
  return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);
}
const protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(root,name))),expected);
const rows=[];
for(const arm of protocol.arms){
  const start=read(join(base,arm+'-start.json')),final=read(join(base,arm+'-final.json')),pricing=start.state.pricing;
  const ledger=Object.fromEntries(Object.entries(start.state.learners).map(([id,state])=>{
    const fly=start.world.world.flies.find(item=>item.id===Number(id));
    return [id,{debt:state.charge.outstandingEnergy,incurred:state.charge.incurredEnergy,paid:state.charge.paidEnergy,operations:state.charge.operationsBilled,energy:fly.energy,lastCost:fly.lastEnergyCost??0}];
  }));
  const flies=Object.fromEntries(start.world.world.flies.map(fly=>[fly.id,fly])),pending={};let decisions=0,receipts=0,observations=0;
  const tape=readFileSync(join(base,arm+'.jsonl'));
  for(const line of tape.toString().trimEnd().split('\n')){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const state=event.auditState,balance=ledger[event.id],raw=event.own.raw,points=state.spatialPoints;
      assert.equal(event.own.agentId,event.id);assert.ok(!pending[event.id]);close(event.own.energy,balance.energy-balance.debt);
      let score=0,point=[0,0],pair=[-1,-1];
      for(const [forward,lateral,amount]of points){const value=amount/(Math.hypot(forward,lateral)+20);if(value>score){score=value;point=[forward,lateral];}}
      for(let first=0;first<points.length;first++)for(let second=first+1;second<points.length;second++){
        const left=points[first],right=points[second];if(Math.hypot(left[0]-right[0],left[1]-right[1])>30)continue;
        const candidate=[(left[0]+right[0])/2,(left[1]+right[1])/2],value=(left[2]+right[2])/(Math.hypot(...candidate)+20);
        if(value>score){score=value;point=candidate;pair=[first,second];}
      }
      assert.deepEqual(event.recommendation.pair,pair);assert.deepEqual(event.recommendation.point,point);close(event.recommendation.score,score);
      close(state.lastCost,balance.lastCost);
      const required=balance.lastCost*(Math.abs(Math.atan2(point[1],point[0]))/.28+Math.max(0,Math.hypot(...point)-15)/(flies[event.id].genome.traits.speed*.1));
      close(event.guard.requiredEnergy,required);assert.equal(event.guard.wall,raw[10]!==0||raw[11]!==0);assert.equal(event.guard.viable,event.own.energy>required);
      const size=bytes(state);assert.equal(size,event.storageBytes);assert.equal(event.work,state.work.scalarOperations);assert.ok(event.work>=balance.operations);
      const due=(event.work-balance.operations)*pricing.operationEnergy+size*pricing.byteEnergyPerSecond*.1;
      balance.debt+=due;balance.incurred+=due;balance.operations=event.work;close(event.requestedExtra,balance.debt);
      close(state.charge.outstandingEnergy,balance.debt);close(state.charge.incurredEnergy,balance.incurred);assert.equal(state.charge.operationsBilled,balance.operations);
      pending[event.id]=event.tick;decisions++;
    }else if(event.type==='physical'){
      const balance=ledger[event.agentId];assert.equal(pending[event.agentId],event.tick);
      close(event.initialEnergy,balance.energy);assert.ok(event.paidExtra>=0&&event.paidExtra<=balance.debt+1e-9);
      balance.debt=Math.max(0,balance.debt-event.paidExtra);balance.paid+=event.paidExtra;balance.energy=event.finalEnergy;balance.lastCost=event.cost;
      close(event.finalEnergy,event.initialEnergy-event.cost+event.beneficialEaten-event.toxinDamage);receipts++;
    }else{
      assert.equal(event.type,'observe');const own=event.own,state=event.auditState,balance=ledger[own.agentId];assert.equal(pending[own.agentId],own.tick);delete pending[own.agentId];
      close(own.energy,(own.terminal?0:balance.energy)-balance.debt);
      const due=(state.work.scalarOperations-balance.operations)*pricing.operationEnergy;assert.ok(due>=0);
      balance.debt+=due;balance.incurred+=due;balance.operations=state.work.scalarOperations;
      close(state.charge.outstandingEnergy,balance.debt);close(state.charge.incurredEnergy,balance.incurred);close(state.charge.paidEnergy,balance.paid);
      assert.equal(state.charge.operationsBilled,balance.operations);observations++;
    }
  }
  assert.equal(Object.keys(pending).length,0);
  for(const [id,balance]of Object.entries(ledger)){
    const charge=final.state.learners[id].charge;close(charge.outstandingEnergy,balance.debt);close(charge.incurredEnergy,balance.incurred);close(charge.paidEnergy,balance.paid);
    assert.equal(charge.operationsBilled,balance.operations);
  }
  rows.push({arm,decisions,receipts,observations,traceSha256:hash(tape)});
}
const report={schema:1,passed:true,rows,scope:'Independent exhaustive midpoint scoring from logged points, guard, canonical storage encoding, reported-work charges, receipt and terminal-debt ledger. Does not independently reconstruct sensing, the reported operation totals, or physical dynamics.'};
writeFileSync(join(base,'billing-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
