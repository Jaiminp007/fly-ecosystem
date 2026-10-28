import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-probe-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
function bytes(value){
  if(value===null||typeof value==='boolean')return 1;if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}
  if(typeof value==='string')return 4+Buffer.byteLength(value);if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);
  return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);
}
function advance(value){let next=value;next^=next<<13;next^=next>>>17;next^=next<<5;return next>>>0;}
function motorUpdate(previous,current,terminal){
  const index=Math.floor(current.replayRngState/4294967296*current.memory.length),record=current.memory[index];assert.ok(record);
  return 78+(terminal?0:87)+3+312+(previous.memory.length<32?0:10)+9+78+(record.terminal?0:87)+68+(terminal?39:0);
}
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const rows=[];
for(const arm of protocol.cases.map(item=>item.label)){
  const start=read(join(base,arm+'-start.json')),final=read(join(base,arm+'-final.json')),states=structuredClone(start.state.learners),pricing=start.state.pricing;
  const ledger=Object.fromEntries(Object.entries(states).map(([id,state])=>{
    const fly=start.world.world.flies.find(item=>item.id===Number(id));return [id,{debt:state.charge.outstandingEnergy,incurred:state.charge.incurredEnergy,paid:state.charge.paidEnergy,operations:state.charge.operationsBilled,energy:fly?.energy??0}];
  }));
  const pending={},routes={present:0,absent:0};let decisions=0,receipts=0,observations=0,switches=0,terminals=0;
  const stream=createReadStream(join(base,arm+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    const event=JSON.parse(line);
    if(event.type==='decision'){
      const id=event.id,previous=states[id],current=event.auditState,balance=ledger[id],own=event.own,{fly,sensed,food}=event.auditSpatial;
      assert.equal(own.agentId,id);assert.ok(!pending[id]);close(own.energy,balance.energy-balance.debt);
      const route=own.odorPresent?'present':'absent',bankBefore=previous.banks[route],bankAfter=current.banks[route];
      assert.equal(event.choice.route,route);assert.equal(current.route,route);
      const switched=previous.route!==null&&previous.route!==route;
      if(switched){
        const old=previous.banks[previous.route],after=current.banks[previous.route];assert.equal(after.pending,null);
        assert.equal(after.skippedBoundaryTransitions,old.skippedBoundaryTransitions+Number(old.pending!==null));
        assert.equal(after.work.scalarOperations-old.work.scalarOperations,40);assert.ok(after.eligibility.flat().every(value=>value===0));
        assert.deepEqual(after.weights,old.weights);switches++;
      }
      const raw=own.raw,phi=[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),own.contactPresent?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,own.contactPresent?raw[13]*.25:0];
      const values=bankAfter.weights.map(weights=>weights.reduce((sum,weight,index)=>sum+weight*phi[index],0));
      let best=2;for(let index=1;index>=0;index--)if(values[index]>values[best])best=index;
      const first=advance(bankBefore.rngState),second=advance(first),action=bankBefore.acquisition&&first/4294967296<.1?Math.floor(second/4294967296*3):best;
      assert.equal(bankAfter.rngState,second);assert.equal(event.choice.proposed,action);assert.equal(event.choice.action,action);
      if(bankBefore.acquisition){assert.equal(bankAfter.pending.action,action);assert.equal(bankAfter.pending.tick,event.tick);assert.deepEqual(bankAfter.pending.phi,phi);}else assert.equal(bankAfter.pending,null);
      assert.equal(event.outputs[1],event.choice.move);assert.equal(event.outputs[2],event.choice.accept?1:-1);
      const candidates=food.filter(patch=>Math.hypot(patch.x-fly.x,patch.y-fly.y)<=fly.sense),ordered=items=>items.map(item=>JSON.stringify(item)).sort();
      assert.deepEqual(ordered(candidates),ordered(sensed));
      const points=[],cosine=Math.cos(fly.heading),sine=Math.sin(fly.heading);
      for(const patch of sensed)if(patch.amount>.06){const dx=patch.x-fly.x,dy=patch.y-fly.y;points.push([dx*cosine+dy*sine,-dx*sine+dy*cosine,patch.amount]);}
      assert.deepEqual(points,current.spatialPoints);
      let contactWork=1+6*food.length;for(const patch of food)if((patch.x-fly.x)**2+(patch.y-fly.y)**2<=225)contactWork++;
      let recommendationWork=4*points.length;
      for(let firstIndex=0;firstIndex<points.length;firstIndex++)for(let secondIndex=firstIndex+1;secondIndex<points.length;secondIndex++){
        const left=points[firstIndex],right=points[secondIndex],separation=Math.abs(left[0]-right[0]);recommendationWork+=3;
        if(separation>32)continue;recommendationWork+=3;if(Math.hypot(separation,left[1]-right[1])<=30)recommendationWork+=9;
      }
      let motorWork=14+78+2+14+3+4;
      if(bankBefore.pending){motorWork+=2;if(bankBefore.acquisition)motorWork+=motorUpdate(bankBefore,bankAfter,false);}
      const tasteWork=6+(own.odorPresent?29:0)+7+4,steeringWork=current.steering.work.scalarOperations-previous.steering.work.scalarOperations;
      const expected=2+sensed.length+9*points.length+contactWork+1+1+(switched?40:0)+motorWork+tasteWork+recommendationWork+15+14+steeringWork+10;
      assert.equal(current.work.scalarOperations-previous.work.scalarOperations,expected,`${arm} body ${id} tick ${event.tick}`);
      assert.equal(bytes(current),event.storageBytes);const due=(event.work-balance.operations)*pricing.operationEnergy+event.storageBytes*pricing.byteEnergyPerSecond*.1;
      balance.debt+=due;balance.incurred+=due;balance.operations=event.work;close(event.requestedExtra,balance.debt);
      close(current.charge.outstandingEnergy,balance.debt);close(current.charge.incurredEnergy,balance.incurred);
      states[id]=current;pending[id]=event;routes[route]++;decisions++;
    }else if(event.type==='physical'){
      const id=event.agentId,balance=ledger[id];assert.equal(pending[id].tick,event.tick);close(event.initialEnergy,balance.energy);
      assert.ok(event.paidExtra>=0&&event.paidExtra<=balance.debt+1e-9);balance.debt=Math.max(0,balance.debt-event.paidExtra);balance.paid+=event.paidExtra;balance.energy=event.finalEnergy;
      close(event.finalEnergy,event.initialEnergy-event.cost+event.beneficialEaten-event.toxinDamage);receipts++;
    }else{
      assert.equal(event.type,'observe');const own=event.own,id=own.agentId,previous=states[id],current=event.auditState,decision=pending[id],balance=ledger[id],route=previous.route;
      assert.equal(decision.tick,own.tick);close(own.energy,(own.terminal?0:balance.energy)-balance.debt);
      let expected=1+3;const tasteExample=decision.choice.move===-1&&decision.choice.accept&&decision.own.contactPresent&&decision.own.odorPresent&&own.lastFood!==0;
      if(previous.acquisition&&tasteExample)expected+=6+3+(previous.taste.memory.length<32?0:10)+2*(29+48)+9;
      const bankBefore=previous.banks[route],bankAfter=current.banks[route];
      if(own.terminal&&bankBefore.pending){expected+=2;if(bankBefore.acquisition)expected+=motorUpdate(bankBefore,bankAfter,true);terminals++;}
      expected+=current.steering.work.scalarOperations-previous.steering.work.scalarOperations;
      assert.equal(current.work.scalarOperations-previous.work.scalarOperations,expected,`${arm} observe body ${id} tick ${own.tick}`);
      const due=(current.work.scalarOperations-balance.operations)*pricing.operationEnergy;assert.ok(due>=0);
      balance.debt+=due;balance.incurred+=due;balance.operations=current.work.scalarOperations;
      close(current.charge.outstandingEnergy,balance.debt);close(current.charge.incurredEnergy,balance.incurred);close(current.charge.paidEnergy,balance.paid);
      states[id]=current;delete pending[id];observations++;
    }
  }
  assert.equal(Object.keys(pending).length,0);assert.equal(decisions,receipts);assert.equal(decisions,observations);
  for(const [id,state]of Object.entries(final.state.learners)){
    assert.deepEqual(state,states[id]);const balance=ledger[id];close(state.charge.outstandingEnergy,balance.debt);close(state.charge.paidEnergy,balance.paid);assert.equal(state.charge.operationsBilled,balance.operations);
  }
  rows.push({arm,decisions,receipts,observations,routes,switches,terminals,traceSha256:digest.digest('hex')});
}
const report={schema:1,passed:true,rows,scope:'Independent routing, executed speed, observation membership, declared operation increments, encoded storage, payment and debt reconstruction from logged fixture state. Not independent TD-weight replay, physical dynamics or general cost adequacy.'};
writeFileSync(join(base,'probe-work-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
