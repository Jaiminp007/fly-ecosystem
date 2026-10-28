import test from 'node:test';
import assert from 'node:assert/strict';
import {PURSUIT_ARMS,pursuitMotor,simulatePursuitAuthority} from '../learning/pursuit-authority.mjs';
import {motorPrimitive} from '../learning/cue-foraging.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';

const engineeringProtocol={reference:{founders:2,actorParameters:{},parameters:{actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99}},
  pricing:{byteEnergyPerSecond:1e-5/(17*8),operationEnergy:5e-6/17}};
const engineeringHistory={seed:115,cueSeed:116,resourceSeeds:[117,118,119,120],shuffleSeed:121,nullSeed:122,transferSeed:123};
function sensors(bearing=null,left=0,right=0){const raw=Array(17).fill(0);if(bearing!==null){raw[0]=Math.cos(bearing);raw[1]=Math.max(0,-Math.sin(bearing));raw[2]=Math.max(0,Math.sin(bearing));}raw[10]=left;raw[11]=right;return raw;}

test('pursuit motor freezes front, back, exact angular threshold and absent-wall laws',()=>{
  assert.deepEqual(pursuitMotor(sensors(0),1),{outputs:[0,0,1,-1,0],operations:16});
  assert.deepEqual(pursuitMotor(sensors(Math.PI),1),{outputs:[1,-1,1,-1,0],operations:16});
  assert.deepEqual(pursuitMotor(sensors(-Math.PI),1),{outputs:[1,-1,1,-1,0],operations:16});
  for(const sign of [-1,1]){
    assert.deepEqual(pursuitMotor(sensors(sign*.28),1).outputs,[sign,0,1,-1,0]);
    assert.equal(pursuitMotor(sensors(sign*(.28+1e-12)),1).outputs[1],-1);
    const inside=pursuitMotor(sensors(sign*(.28-1e-12)),1).outputs;
    assert.equal(inside[1],0);assert.ok(Math.abs(inside[0])<1);
  }
  for(const action of [-1,1])for(const [left,right] of [[0,0],[1,0],[0,1],[1,1]]){
    assert.deepEqual(pursuitMotor(sensors(null,left,right),action),{outputs:[Math.tanh(1.8*(left-right)),0,action,-1,0],operations:9});
  }
  assert.deepEqual(pursuitMotor(sensors(.7,1,0),1),pursuitMotor(sensors(.7,0,1),1));
  assert.throws(()=>pursuitMotor(sensors(),0));
});

test('pursuit refusal reverses the sensed vector and disables eating',()=>{
  assert.deepEqual(pursuitMotor(sensors(0),-1),{outputs:[1,-1,-1,-1,0],operations:16});
  assert.deepEqual(pursuitMotor(sensors(Math.PI/2),-1),{outputs:[-1,-1,-1,-1,0],operations:16});
  const behind=pursuitMotor(sensors(Math.PI),-1);
  assert.ok(Math.abs(behind.outputs[0])<1e-14);assert.deepEqual(behind.outputs.slice(1),[0,-1,-1,0]);
});

test('named engineering pursuit fixture regenerates exact traces, own RNG, all-founder receipts and work',()=>{
  const events=[],row=simulatePursuitAuthority(engineeringProtocol,engineeringHistory,event=>events.push(structuredClone(event)));
  const regenerated=[],repeat=simulatePursuitAuthority(engineeringProtocol,engineeringHistory,event=>regenerated.push(structuredClone(event)));
  assert.deepEqual(repeat,row);assert.deepEqual(regenerated,events);
  assert.deepEqual(Object.keys(row.arms),PURSUIT_ARMS);
  assert.equal(new Set(Object.values(row.arms).map(arm=>arm.initialWorldSha256)).size,1);
  for(const mode of PURSUIT_ARMS){
    const relevant=events.filter(event=>event.stage==='probe'&&event.arm===mode),start=relevant.find(event=>event.type==='start'),end=relevant.find(event=>event.type==='end');
    assert.equal(end.endpoint.founders,2);assert.equal(end.endpoint.survival,end.endpoint.survivors/2);
    assert.ok(Math.abs(end.endpoint.accountingResidual)<1e-6);
    const states=Object.values(end.learners);assert.equal(states.length,2);
    let totalWork=0,finalEnergy=0,totalDebt=0;
    for(const controller of states){
      const own=relevant.filter(event=>event.agentId===controller.agentId),decisions=own.filter(event=>event.type==='decision'),motors=own.filter(event=>event.type==='motor'),ledgers=own.filter(event=>event.type==='ledger');
      assert.ok(controller.decisions<=32);assert.equal(decisions.length,controller.decisions);assert.equal(motors.length,controller.ticks);
      let rng=(engineeringHistory.seed^Math.imul(controller.agentId,2654435761))>>>0||1,heldAction=1,lastDecision=null;
      for(const event of own){
        if(event.type==='decision'){
          assert.equal((event.tick-1537)%8,0);if(lastDecision!==null)assert.equal(event.tick-lastDecision,8);lastDecision=event.tick;
          if(mode==='random')rng=advanceRng(rng);
          heldAction=mode==='refuse'?-1:mode==='random'&&rng/4294967296<.5?-1:1;
          assert.equal(event.choice,heldAction);assert.equal(event.rngState,rng);assert.equal(event.previousIntake,undefined);
        }
        if(event.type==='motor'){
          const raw=Array(17).fill(0);[raw[0],raw[1],raw[2],raw[10],raw[11]]=event.sensors;
          const expected=mode==='legacyFast'?{outputs:motorPrimitive(raw,1,false),operations:6}:pursuitMotor(raw,heldAction);
          assert.equal(event.action,heldAction);assert.deepEqual(event.outputs,expected.outputs);assert.equal(event.operations,expected.operations);
        }
      }
      assert.equal(controller.rngState,rng);
      const work=motors.reduce((sum,event)=>sum+event.operations,0)+decisions.length*(mode==='random'?7:1);
      assert.equal(controller.work.scalarOperations,work);assert.equal(controller.charge.operationsBilled,work);totalWork+=work;
      assert.equal(ledgers.reduce((sum,event)=>sum+event.steps,0),controller.ticks);
      const byteSeconds=ledgers.reduce((sum,event)=>sum+event.byteSeconds,0);
      assert.ok(Math.abs(controller.charge.incurredEnergy-work*engineeringProtocol.pricing.operationEnergy-byteSeconds*engineeringProtocol.pricing.byteEnergyPerSecond)<1e-8);
      assert.ok(Math.abs(controller.charge.incurredEnergy-controller.charge.paidEnergy-controller.charge.outstandingEnergy)<1e-8);
      assert.ok(Math.abs(ledgers.reduce((sum,event)=>sum+event.paidExtra,0)-controller.charge.paidEnergy)<1e-8);
      if(controller.ticks){assert.ok(controller.charge.storageBytes>0);assert.equal(ledgers[0].initialEnergy,start.bodyEnergy[controller.agentId]);finalEnergy+=ledgers.at(-1).finalEnergy;}
      else {assert.equal(controller.charge.incurredEnergy,0);assert.equal(controller.dead,true);}
      totalDebt+=controller.charge.outstandingEnergy;assert.equal(controller.weights,undefined);
      for(const ledger of ledgers)assert.ok(Math.abs(ledger.finalEnergy-(ledger.initialEnergy-ledger.cost+ledger.beneficialEaten-ledger.discarded))<1e-8);
    }
    assert.equal(end.endpoint.scalarOperations,totalWork);assert.equal(end.endpoint.outstandingEnergy,totalDebt);
    assert.ok(Math.abs(end.endpoint.budgetAdjustedEnergyPerFounder-(finalEnergy-start.initialEnergy-totalDebt)/2)<1e-8);
    assert.ok(relevant.some(event=>event.type==='motor'));
  }
});

test('named engineering extinction fixture never revives founders or bills dead probe states',()=>{
  const events=[],row=simulatePursuitAuthority({...engineeringProtocol,pricing:{operationEnergy:100,byteEnergyPerSecond:100}},engineeringHistory,event=>events.push(structuredClone(event)));
  assert.equal(row.warmup.endpoint.survivors,0);
  for(const mode of PURSUIT_ARMS){
    const endpoint=row.arms[mode].endpoint;
    assert.equal(endpoint.founders,2);assert.equal(endpoint.survivors,0);assert.equal(endpoint.survival,0);assert.equal(endpoint.budgetAdjustedEnergyPerFounder,0);
    assert.equal(endpoint.scalarOperations,0);assert.equal(endpoint.outstandingEnergy,0);assert.ok(Math.abs(endpoint.accountingResidual)<1e-6);
    const end=events.find(event=>event.stage==='probe'&&event.arm===mode&&event.type==='end');
    for(const controller of Object.values(end.learners)){
      assert.equal(controller.dead,true);assert.equal(controller.ticks,0);assert.equal(controller.decisions,0);assert.equal(controller.lastDecisionTick,0);assert.equal(controller.lastObservedTick,1536);
      assert.deepEqual(controller.charge,{operationsBilled:0,outstandingEnergy:0,incurredEnergy:0,paidEnergy:0,storageBytes:0});
    }
  }
  assert.equal(events.filter(event=>event.stage==='probe'&&['decision','motor','ledger'].includes(event.type)).length,0);
});
