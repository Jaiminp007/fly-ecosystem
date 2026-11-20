// RSI-SELF V1b fixtures (G7 gate). Zero bank worlds: synthetic states/records,
// temp-dir bank, fixture-world stepping. Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {proposeV1b,applyItemValues,selfProposeV1b,randomApplyV1b,scoreRsiSelfV1b,
  rsiSelfV1bBank,S2_CHECKPOINTS,S2_ITEMS,S2_ADOPT_FRAC} from '../scripts/rsi-self-v1b.mjs';

const D=3;
const mkRecs=(n,phi,target)=>Array.from({length:n},()=>({phi:[...phi],target,slot:0}));
const mkMixedRecs=()=>[...Array.from({length:10},()=>({phi:[1,0,0],target:0,slot:0})),...Array.from({length:10},()=>({phi:[1,0,0],target:1,slot:0}))];
const mkState=(rate,recs,prev)=>({
  config:{selfMod:true,tasteDimensions:D,tasteRate:rate,streams:1,phaseSlots:1,
    surpriseGain:0.5,surpriseWindow:16,marginWidth:0,marginBoost:0,replayRate:1,
    consolidationRate:0,slowAnchorStrength:0},
  weights:{taste:[0,0,0]},
  older:[],recent:recs,
  work:{scalarOperations:0,surpriseBoosts:0,tasteLiveUpdates:0,liveUpdates:0,replayUpdates:0},
  priorLogit:0,surpriseEma:0.05,surpriseTimer:0,feedRngState:12345,
  selfMod:{prevTestErr:prev,proposals:[]},
});

test('choice: round-robin item by checkpoint index; worse intensifies, else attenuates, first attenuates',()=>{
  assert.deepEqual(proposeV1b(0.5,0.1,0),{item:'rate',intensify:true});
  assert.deepEqual(proposeV1b(0.5,0.9,1),{item:'gain',intensify:false});
  assert.deepEqual(proposeV1b(0.5,null,2),{item:'margin',intensify:false});
  assert.deepEqual(proposeV1b(0.5,0.5,3),{item:'rate',intensify:false});
  assert.deepEqual(proposeV1b(0.5,0.1,4),{item:'gain',intensify:true});
  assert.deepEqual(proposeV1b(0.5,0.9,5),{item:'margin',intensify:false});
  assert.deepEqual(applyItemValues('rate',true,{rate:1,gain:0.5,width:0,boost:0}),{rate:2,gain:0.5,width:0,boost:0});
  assert.deepEqual(applyItemValues('rate',false,{rate:0.04,gain:0.5,width:0,boost:0}),{rate:0.05,gain:0.5,width:0,boost:0});
  assert.deepEqual(applyItemValues('gain',true,{rate:1,gain:0.5,width:0,boost:0}),{rate:1,gain:1,width:0,boost:0});
  assert.deepEqual(applyItemValues('gain',false,{rate:1,gain:0.5,width:0,boost:0}),{rate:1,gain:0.25,width:0,boost:0});
  assert.deepEqual(applyItemValues('margin',true,{rate:1,gain:0.5,width:0,boost:0}),{rate:1,gain:0.5,width:0.1,boost:1.0});
  assert.deepEqual(applyItemValues('margin',false,{rate:1,gain:0.5,width:0.1,boost:1.0}),{rate:1,gain:0.5,width:0,boost:0});
});

test('sandbox executes gain/margin variants with exact billing',()=>{
  const g=mkState(1,mkMixedRecs(),0);
  const rg=selfProposeV1b(g,512,1);
  assert.equal(rg.item,'gain');
  assert.equal(rg.decision,'adopt');
  assert.equal(rg.propVals.gain,1.0);
  assert.equal(g.config.surpriseGain,1.0);
  assert.equal(g.config.tasteRate,1);
  const m=mkState(1,mkMixedRecs(),0);
  const before=m.work.scalarOperations;
  const rm=selfProposeV1b(m,768,2);
  assert.equal(rm.item,'margin');
  assert.deepEqual([rm.propVals.width,rm.propVals.boost],[0.1,1.0]);
  assert.equal(m.work.scalarOperations-before,2*(rm.fitN+rm.testN)*(D+1));
  assert.equal(rm.fitN,12);
  assert.equal(rm.testN,8);
});

test('random control applies blindly with logged flip and only the draw billed',()=>{
  const st=mkState(1,mkRecs(20,[1,0,0],1),null);
  const before=st.work.scalarOperations;
  const r=randomApplyV1b(st,256,0);
  assert.equal(r.item,'rate');
  assert.equal(r.decision,'applied');
  assert.equal(typeof r.flip,'boolean');
  assert.equal(r.errInc,null);
  assert.equal(r.errCand,null);
  assert.equal(st.config.tasteRate,r.flip?2:0.5);
  assert.equal(st.work.scalarOperations-before,7);
});

test('spent bank 397001-397036 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-spend maintenance: the V1b bank built cleanly pre-spend and is now
  // spent; the builder must refuse to rebuild it anywhere. Same standing
  // rule as the V1a guard: bank-build fixtures are single-use; after the
  // authorized spend they convert to rebuild-refusal guards.
  const dir=mkdtempSync(join(tmpdir(),'rsi-self-v1b-bank-guard-'));
  assert.throws(()=>rsiSelfV1bBank(join(dir,'protocol.json')),/already used in prior evidence/);
});

test('hook bit-identity re-verified with six checkpoints on fixture world',()=>{
  const history={seed:399011,cueSeed:399012,resourceSeeds:[399013,399014,399015,399016]};
  const mk=()=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
  const a=mk();a.advance(600);const ea=a.endpoint();
  const b=mk();
  for(let t=0;t<600&&!b.finished;t++){
    if(S2_CHECKPOINTS.includes(b.world.tick))
      for(const fly of b.world.flies)assert.equal(b.learners[fly.id].config.selfMod,false);
    if(!b.step())break;
  }
  const eb=b.endpoint();
  assert.equal(eb.budgetAdjustedEnergyPerFounder,ea.budgetAdjustedEnergyPerFounder);
  assert.equal(eb.scalarOperations,ea.scalarOperations);
  for(const id of a.founderIds)assert.deepEqual(b.learners[id].weights.taste,a.learners[id].weights.taste);
});

const BASE={rate:1,gain:0.5,width:0,boost:0};
const mkBRow=(arm,seed,level,byCp)=>({history:{seed},arm,
  proposals:Object.entries(byCp).flatMap(([cpi,decs])=>{const cp=S2_CHECKPOINTS[cpi];const item=S2_ITEMS[cpi%3];
    return decs.map((d,i)=>{const inc=d.inc??BASE;
      return {tick:cp,agentId:i+1,item,intensify:d.dir,...(d.decision==='applied'?{flip:d.dir}:{}),incVals:{...inc},
        propVals:d.decision==='skip'?null:applyItemValues(item,d.dir,inc),
        fitN:(d.decision==='skip'||d.decision==='applied')?0:12,
        testN:(d.decision==='skip'||d.decision==='applied')?0:8,
        errInc:(d.decision==='skip'||d.decision==='applied')?null:1,
        errCand:(d.decision==='skip'||d.decision==='applied')?null:(d.decision==='adopt'?0.9:1),
        decision:d.decision};});}),
  endpoint:{budgetAdjustedEnergyPerFounder:level}});
const GOSELF={
  0:[{dir:true,decision:'adopt'}],
  1:[{dir:true,decision:'adopt'}],
  2:[{dir:false,decision:'keep'}],
  3:[{dir:false,inc:{rate:2,gain:1,width:0,boost:0},decision:'keep'}],
  4:[{dir:false,inc:{rate:2,gain:1,width:0,boost:0},decision:'keep'}],
  5:[{dir:false,decision:'keep'}]};

test('scorer V1b branches: GO+label, NOGOs, INVALID, INCOMPLETE',()=>{
  const seeds=[397001,397010,397019,397028];
  const goSelf=seeds.map(s=>mkBRow('selfmod',s,1.0,GOSELF));
  const goRand=seeds.map(s=>mkBRow('random',s,0.5,{0:[{dir:true,decision:'applied'}]}));
  const goFix=seeds.map(s=>mkBRow('fixed',s,1.0,{}));
  const go=scoreRsiSelfV1b([...goSelf,...goRand,...goFix]);
  assert.equal(go.go,true);
  assert.equal(go.g6label,'selection signal');
  assert.ok(go.verdict.startsWith('PHASE-B-GO'));
  assert.equal(go.persistent,8);
  assert.deepEqual([...go.persistItems].sort(),['gain','rate']);
  const flat=scoreRsiSelfV1b([...goSelf.map(r=>({...r,endpoint:{budgetAdjustedEnergyPerFounder:0.7}})),...goRand,...goFix]);
  assert.equal(flat.go,false);
  assert.equal(flat.verdict,'PHASE-B-NOGO');
  const bad=scoreRsiSelfV1b([...goSelf.map(r=>r.history.seed===397001
    ?{...r,proposals:r.proposals.map(q=>({...q,decision:'keep'}))}:r),...goRand,...goFix]);
  assert.equal(bad.go,false);
  assert.equal(bad.verdict,'INVALID');
  const rev={
    0:[{dir:true,decision:'adopt'}],
    1:[{dir:false,decision:'keep'}],
    2:[{dir:false,decision:'keep'}],
    3:[{dir:false,inc:{rate:2,gain:0.5,width:0,boost:0},decision:'adopt'}],
    4:[{dir:false,decision:'keep'}],
    5:[{dir:false,decision:'keep'}]};
  const revRows=[mkBRow('selfmod',397001,1.0,rev),mkBRow('selfmod',397010,1.0,rev),
    ...seeds.slice(2).map(s=>mkBRow('selfmod',s,1.0,{0:[{dir:false,decision:'keep'}],1:[{dir:false,decision:'keep'}],2:[{dir:false,decision:'keep'}],3:[{dir:false,decision:'keep'}],4:[{dir:false,decision:'keep'}],5:[{dir:false,decision:'keep'}]})),
    ...goRand,...goFix];
  const revS=scoreRsiSelfV1b(revRows);
  assert.equal(revS.persistent,2);
  assert.equal(revS.go,false);
  assert.equal(revS.verdict,'PHASE-B-NOGO');
});
