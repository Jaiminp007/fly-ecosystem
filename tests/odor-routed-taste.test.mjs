import test from 'node:test';
import assert from 'node:assert/strict';
import {createOdorRoutedTasteBody,chooseOdorRoutedTaste,observeOdorRoutedTaste,freezeOdorRoutedTaste} from '../learning/odor-routed-taste.mjs';
import {billSarsaWork,chargeForStep,encodedStateBytes} from '../learning/sarsa-experiment.mjs';

const pricing={operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)};
const raw=Array(17).fill(0);raw[16]=1;
test('odor-free experience credits actual speed and bills both banks',()=>{
  const state=createOdorRoutedTasteBody(1,256121);
  for(let tick=1;tick<=4;tick++){
    const own={agentId:1,tick,energy:65-tick,raw,cue:[0,0,0,0],contactPresent:true,odorPresent:false};
    const choice=chooseOdorRoutedTaste(state,own,{fixedMove:1});assert.equal(choice.route,'absent');assert.equal(choice.action,2);assert.ok(choice.accept);
    const bill=chargeForStep(state,pricing);bill.afterEnergyCharge({paid:bill.energyCost});
    observeOdorRoutedTaste(state,{agentId:1,tick,energy:65-tick,lastFood:1,terminal:false});billSarsaWork(state,pricing);
  }
  assert.equal(state.banks.absent.transitions,3);assert.equal(state.banks.present.transitions,0);assert.equal(state.tasteExamples,0);
  assert.ok(state.banks.absent.memory.every(record=>record.action===2&&record.agentId===1));
  assert.ok(state.charge.storageBytes>=encodedStateBytes(state.banks));assert.equal(state.charge.operationsBilled,state.work.scalarOperations);
});
test('cue credit remains factual and freezes with both routed motors',()=>{
  const state=createOdorRoutedTasteBody(1,256122);
  for(let tick=1;tick<=40;tick++){
    const choice=chooseOdorRoutedTaste(state,{agentId:1,tick,energy:65,raw,cue:[1,1,1,1],contactPresent:true,odorPresent:true},{fixedMove:-1});
    observeOdorRoutedTaste(state,{agentId:1,tick,energy:65,lastFood:choice.accept?1:0,terminal:false});
  }
  assert.ok(state.tasteExamples>0);assert.ok(state.taste.memory.every(record=>record.agentId===1));
  freezeOdorRoutedTaste(state);const before=structuredClone({taste:state.taste.weights,present:state.banks.present.weights,absent:state.banks.absent.weights});
  const choice=chooseOdorRoutedTaste(state,{agentId:1,tick:41,energy:65,raw,cue:[0,0,0,0],contactPresent:false,odorPresent:false});
  observeOdorRoutedTaste(state,{agentId:1,tick:41,energy:65,lastFood:choice.accept?1:0,terminal:false});
  assert.deepEqual({taste:state.taste.weights,present:state.banks.present.weights,absent:state.banks.absent.weights},before);
});
test('identity taste code: an update on one cue leaves every other cue unchanged',async()=>{
  const {predictTargetTaste}=await import('../learning/odor-routed-taste.mjs');
  const cues=Array.from({length:16},(_,i)=>Array.from({length:4},(_,b)=>(i>>b&1)?1:-1));
  const walsh=c=>Array.from({length:16},(_,m)=>{let v=1;for(let b=0;b<4;b++)if(m>>b&1)v*=c[b];return v;});
  const identity=createOdorRoutedTasteBody(1,256121,{tasteCode:'identity'}),pairwise=createOdorRoutedTasteBody(1,256121);
  assert.equal(identity.taste.weights.length,16);assert.equal(pairwise.taste.weights.length,11);assert.equal(pairwise.taste.code,undefined);
  const before=cues.map(c=>predictTargetTaste(identity,c));
  // A learning step moves weights along the trained cue's feature vector.
  identity.taste.weights=walsh(cues[5]).map(v=>2*v);
  const after=cues.map(c=>predictTargetTaste(identity,c));
  assert.ok(after[5]>before[5]+.1);
  for(let i=0;i<16;i++)if(i!==5)assert.ok(Math.abs(after[i]-before[i])<1e-12,'cue '+i+' moved');
  assert.throws(()=>createOdorRoutedTasteBody(1,256121,{tasteCode:'identity',splitTaste:true}));
});
test('taste program knobs: omitted fields keep the original constants',()=>{
  const plain=createOdorRoutedTasteBody(1,256121),explicit=createOdorRoutedTasteBody(1,256121,{tasteProgram:{}});
  assert.equal(plain.taste.step,undefined);assert.equal(explicit.taste.step,.5);assert.equal(explicit.taste.replays,1);assert.equal(explicit.taste.memoryCap,32);assert.equal(explicit.taste.prior,Math.log(3));
  assert.throws(()=>createOdorRoutedTasteBody(1,256121,{tasteProgram:{unknown:1}}));
  assert.throws(()=>createOdorRoutedTasteBody(1,256121,{tasteProgram:{step:0}}));
});
