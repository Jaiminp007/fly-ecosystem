import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/guarded-overlap/20261026-v2');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=1e-8+1e-10*Math.max(Math.abs(actual),Math.abs(expected)),actual+' != '+expected);
function bytes(value){
  if(value===null||typeof value==='boolean')return 1;
  if(typeof value==='number'){assert.ok(Number.isFinite(value));return 8;}
  if(typeof value==='string')return 4+Buffer.byteLength(value);
  if(Array.isArray(value))return 4+value.reduce((sum,item)=>sum+bytes(item),0);
  return 4+Object.entries(value).reduce((sum,[key,item])=>sum+4+Buffer.byteLength(key)+bytes(item),0);
}
const protocol=read(join(base,'protocol.json')),result=read(join(base,'results.json')),effects={native:[],'bare-full':[]};let decisions=0,receipts=0;
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
for(const input of protocol.inputs){
  for(const field of ['anchor','bare'])assert.equal(hash(readFileSync(join(root,input[field]))),input[field+'Sha256']);
  const seed=input.history.seed,row=read(join(base,'rows',seed+'.json')),anchor=read(join(root,input.anchor));
  for(const [arm,mode]of [['guarded',1],['unguarded',2],['native',0]]){
    const final=read(join(base,'finals',seed+'-'+arm+'.json')),states=final.state.controllers,pricing=final.state.pricing,ledger={},pending={};
    const totals={decisions:0,midpointRecommendations:0,midpointExecuted:0,intake:0,physicalCosts:0,wallBlocked:0,energyBlocked:0};
    for(const [body,state]of Object.entries(states)){
      assert.equal(state.mode,mode);const old=anchor.state.learners[body],fly=anchor.world.world.flies.find(fly=>fly.id===Number(body));
      const oldDue=(old.work.scalarOperations-old.charge.operationsBilled)*pricing.operationEnergy;
      ledger[body]={debt:old.charge.outstandingEnergy+oldDue,incurred:old.charge.incurredEnergy+oldDue,paid:old.charge.paidEnergy,operations:0,lastCost:fly?.lastEnergyCost??0,energy:fly?.energy??0};
    }
    const hasher=createHash('sha256'),stream=createReadStream(join(base,'traces',seed+'-'+arm+'.jsonl'));stream.on('data',chunk=>hasher.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);
      if(event.type==='decision'){
        const body=String(event.id),state=states[body],balance=ledger[body];assert.ok(!pending[body]);
        let score=0,point=[0,0],pair=[-1,-1];
        for(const [forward,lateral,amount]of event.points){const candidate=amount/(Math.hypot(forward,lateral)+20);if(candidate>score){score=candidate;point=[forward,lateral];}}
        for(let first=0;first<event.points.length;first++)for(let second=first+1;second<event.points.length;second++){
          const left=event.points[first],right=event.points[second];if(Math.hypot(left[0]-right[0],left[1]-right[1])>30)continue;
          const candidatePoint=[(left[0]+right[0])/2,(left[1]+right[1])/2],candidate=(left[2]+right[2])/(Math.hypot(...candidatePoint)+20);
          if(candidate>score){score=candidate;point=candidatePoint;pair=[first,second];}
        }
        assert.deepEqual(event.pair,pair);close(event.score,score);close(event.point[0],point[0]);close(event.point[1],point[1]);
        close(event.lastCost,balance.lastCost);close(event.ownEnergy,balance.energy-balance.debt);close(event.speed,state.speed);
        const required=event.lastCost*(Math.abs(Math.atan2(point[1],point[0]))/.28+Math.max(0,Math.hypot(...point)-15)/(event.speed*.1));
        const wall=event.raw[10]!==0||event.raw[11]!==0,viable=event.ownEnergy>required,recommended=pair[0]>=0,execute=recommended&&(mode===2||mode===1&&!wall&&viable);
        close(event.guard.requiredEnergy,required);assert.equal(event.guard.wall,wall);assert.equal(event.guard.viable,viable);assert.equal(event.midpoint,execute);
        const distance=Math.hypot(...point),sine=execute&&distance>0?point[1]/distance:event.raw[2]-event.raw[1];
        close(event.outputs[0],Math.tanh(2*sine+1.8*(event.raw[10]-event.raw[11])));assert.deepEqual(event.outputs.slice(1),[1,1,-1,0]);
        const size=bytes(state)+28*(event.points.length-state.points.length);assert.equal(size,event.storageBytes);
        assert.ok(event.operations>=balance.operations);const due=(event.operations-balance.operations)*pricing.operationEnergy+size*pricing.byteEnergyPerSecond*.1;
        close(event.requestedExtra,balance.debt+due);balance.incurred+=due;balance.debt+=due;balance.operations=event.operations;pending[body]=event;
        totals.decisions++;totals.midpointRecommendations+=Number(recommended);totals.midpointExecuted+=Number(execute);totals.wallBlocked+=Number(recommended&&wall);totals.energyBlocked+=Number(recommended&&!viable);decisions++;
      }else{
        assert.equal(event.type,'physical');const body=String(event.agentId),decision=pending[body],balance=ledger[body];assert.equal(event.tick,decision.tick);delete pending[body];
        close(event.initialEnergy,balance.energy);assert.ok(event.paidExtra>=0&&event.paidExtra<=balance.debt+1e-10);balance.debt=Math.max(0,balance.debt-event.paidExtra);balance.paid+=event.paidExtra;balance.energy=event.finalEnergy;balance.lastCost=event.cost;
        close(event.finalEnergy,event.initialEnergy-event.cost+event.beneficialEaten-event.toxinDamage);totals.intake+=event.beneficialEaten;totals.physicalCosts+=event.cost;receipts++;
      }
    }
    assert.equal(hasher.digest('hex'),row.traceHashes[arm]);assert.equal(Object.keys(pending).length,0);
    for(const [body,state]of Object.entries(states)){
      const balance=ledger[body];close(state.charge.incurredEnergy,balance.incurred);close(state.charge.paidEnergy,balance.paid);close(state.charge.outstandingEnergy,balance.debt);assert.equal(state.work.scalarOperations,balance.operations);assert.equal(state.charge.operationsBilled,balance.operations);
    }
    const endpoint=row.arms[arm],living=final.world.world.flies;assert.equal(endpoint.survivors,living.length);close(endpoint.physicalEnergy,living.reduce((sum,fly)=>sum+fly.energy,0));
    close(endpoint.outstandingEnergy,Object.values(ledger).reduce((sum,balance)=>sum+balance.debt,0));
    close(endpoint.budgetAdjustedEnergyPerFounder,(endpoint.physicalEnergy-endpoint.startingEnergy-endpoint.outstandingEnergy+endpoint.startingDebt)/endpoint.founders);
    for(const [field,value]of Object.entries(totals)){close(endpoint.statistics[field],value);close(final.state.statistics[field],value);}
  }
  for(const name of Object.keys(effects)){
    const energy=row.arms.guarded.budgetAdjustedEnergyPerFounder-row.arms[name].budgetAdjustedEnergyPerFounder,survivors=row.arms.guarded.survivors-row.arms[name].survivors;
    close(row.effects[name].energy,energy);assert.equal(row.effects[name].survivors,survivors);effects[name].push({energy,survivors});
  }
}
for(const [name,values]of Object.entries(effects)){
  close(result.comparisons[name].meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/8);assert.equal(result.comparisons[name].positiveHistories,values.filter(value=>value.energy>0).length);assert.equal(result.comparisons[name].survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));
}
assert.equal(decisions,receipts);assert.equal(result.promisingHeadroom,false);assert.equal(result.qualified,false);
const report={schema:1,passed:true,decisions,receipts,scope:'Separate implementation of all midpoint selection, wall/travel guard decisions, own receipt provenance, commands, dynamic encoded-list storage, reported-work/debt ledgers, endpoints and effects. No learner/engine imports; not independent spatial-query metering or physics.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
