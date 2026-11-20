// RSI-SELF V1d fixtures (G7 gate). Zero bank worlds: synthetic states/records,
// temp-dir bank, fixture-world stepping. Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {proposeV1d,applyItemValues,fitCloneV1d,selfProposeV1d,randomApplyV1d,copiedApplyV1d,scoreRsiSelfV1d,
  rsiSelfV1dBank,S4_CHECKPOINTS,S4_ITEMS,S4_ADOPT_FRAC} from '../scripts/rsi-self-v1d.mjs';

const D=3;
const mkRecs=(n,phi,target)=>Array.from({length:n},()=>({phi:[...phi],target,slot:0}));
const mkMixedRecs=()=>[...Array.from({length:10},()=>({phi:[1,0,0],target:0,slot:0})),...Array.from({length:10},()=>({phi:[1,0,0],target:1,slot:0}))];
const mkState=(rate,recs,prev)=>({
  config:{selfMod:true,tasteDimensions:D,tasteRate:rate,streams:1,phaseSlots:1,
    surpriseGain:0.5,surpriseWindow:16,marginWidth:0,marginBoost:0,replayRate:1,replayPasses:4,replayStrata:1,replaySkip:0,replaySurpriseGain:0,replayTournament:1,
    consolidationRate:0,slowAnchorStrength:0},
  weights:{taste:[0,0,0]},
  older:[],recent:recs,
  work:{scalarOperations:0,surpriseBoosts:0,tasteLiveUpdates:0,liveUpdates:0,replayUpdates:0,replaySkips:0,replaySurpriseBoosts:0,evictSwaps:0},
  priorLogit:0,surpriseEma:0.05,surpriseTimer:0,feedRngState:12345,replayRngState:6789,
  selfMod:{prevTestErr:prev,proposals:[]},
});

test('choice: round-robin item by checkpoint index; worse intensifies, else attenuates, first attenuates',()=>{
  assert.deepEqual(proposeV1d(0.5,0.1,0),{item:'rate',intensify:true});
  assert.deepEqual(proposeV1d(0.5,0.9,1),{item:'gain',intensify:false});
  assert.deepEqual(proposeV1d(0.5,null,2),{item:'margin',intensify:false});
  assert.deepEqual(proposeV1d(0.5,0.5,3),{item:'rate',intensify:false});
  assert.deepEqual(proposeV1d(0.5,0.1,4),{item:'gain',intensify:true});
  assert.deepEqual(proposeV1d(0.5,0.9,5),{item:'margin',intensify:false});
  assert.deepEqual(applyItemValues('rate',true,{rate:1,gain:0.5,width:0,boost:0}),{rate:2,gain:0.5,width:0,boost:0});
  assert.deepEqual(applyItemValues('rate',false,{rate:0.04,gain:0.5,width:0,boost:0}),{rate:0.05,gain:0.5,width:0,boost:0});
  assert.deepEqual(applyItemValues('gain',true,{rate:1,gain:0.5,width:0,boost:0}),{rate:1,gain:1,width:0,boost:0});
  assert.deepEqual(applyItemValues('gain',false,{rate:1,gain:0.5,width:0,boost:0}),{rate:1,gain:0.25,width:0,boost:0});
  assert.deepEqual(applyItemValues('margin',true,{rate:1,gain:0.5,width:0,boost:0}),{rate:1,gain:0.5,width:0.1,boost:1.0});
  assert.deepEqual(applyItemValues('margin',false,{rate:1,gain:0.5,width:0.1,boost:1.0}),{rate:1,gain:0.5,width:0,boost:0});
});

test('sandbox executes gain/margin variants with exact billing',()=>{
  const g=mkState(1,mkMixedRecs(),0);
  const rg=selfProposeV1d(g,512,1);
  assert.equal(rg.item,'gain');
  assert.equal(rg.decision,'adopt');
  assert.equal(rg.propVals.gain,1.0);
  assert.equal(g.config.surpriseGain,1.0);
  assert.equal(g.config.tasteRate,1);
  const m=mkState(1,mkMixedRecs(),0);
  const before=m.work.scalarOperations;
  const rm=selfProposeV1d(m,768,2);
  assert.equal(rm.item,'margin');
  assert.deepEqual([rm.propVals.width,rm.propVals.boost],[0.1,1.0]);
  assert.equal(m.work.scalarOperations-before,2*(rm.fitN*(1+4)+rm.testN)*(D+1));
  assert.equal(rm.fitN,12);
  assert.equal(rm.testN,8);
});

test('random control applies blindly with logged flip and only the draw billed',()=>{
  const st=mkState(1,mkRecs(20,[1,0,0],1),null);
  const before=st.work.scalarOperations;
  const r=randomApplyV1d(st,256,0);
  assert.equal(r.item,'rate');
  assert.equal(r.decision,'applied');
  assert.equal(typeof r.flip,'boolean');
  assert.equal(r.errInc,null);
  assert.equal(r.errCand,null);
  assert.equal(st.config.tasteRate,r.flip?2:0.5);
  assert.equal(st.work.scalarOperations-before,7);
});

test('spent bank 400001-400072 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-spend maintenance: the V1d bank built cleanly pre-spend and is now
  // spent; the builder must refuse to rebuild it anywhere. Standing rule
  // (fourth instance).
  const dir=mkdtempSync(join(tmpdir(),'rsi-self-v1d-bank-guard-'));
  assert.throws(()=>rsiSelfV1dBank(join(dir,'protocol.json')),/already used in prior evidence/);
});

test('hook bit-identity re-verified with six checkpoints on fixture world',()=>{
  const history={seed:399011,cueSeed:399012,resourceSeeds:[399013,399014,399015,399016]};
  const mk=()=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
  const a=mk();a.advance(600);const ea=a.endpoint();
  const b=mk();
  for(let t=0;t<600&&!b.finished;t++){
    if(S4_CHECKPOINTS.includes(b.world.tick))
      for(const fly of b.world.flies)assert.equal(b.learners[fly.id].config.selfMod,false);
    if(!b.step())break;
  }
  const eb=b.endpoint();
  assert.equal(eb.budgetAdjustedEnergyPerFounder,ea.budgetAdjustedEnergyPerFounder);
  assert.equal(eb.scalarOperations,ea.scalarOperations);
  for(const id of a.founderIds)assert.deepEqual(b.learners[id].weights.taste,a.learners[id].weights.taste);
});

const BASE={rate:1,gain:0.5,width:0,boost:0};
const mkCRow=(arm,seed,level,byCp)=>({history:{seed},arm,
  proposals:Object.entries(byCp).flatMap(([cpi,decs])=>{const cp=S4_CHECKPOINTS[cpi];const item=S4_ITEMS[cpi%3];
    return decs.map((d,i)=>{const inc=d.inc??BASE;
      const isCopy=d.decision==='copied';
      return {tick:cp,agentId:i+1,item,intensify:isCopy?null:d.dir,...(d.decision==='applied'?{flip:d.dir}:{}),...(isCopy?{noop:d.noop,sourceCp:d.sourceCp}:{}),incVals:{...inc},
        propVals:d.decision==='skip'?null:(isCopy?{...d.vals}:applyItemValues(item,d.dir,inc)),
        fitN:(isCopy||d.decision==='skip'||d.decision==='applied')?0:12,
        testN:(isCopy||d.decision==='skip'||d.decision==='applied')?0:8,
        errInc:(isCopy||d.decision==='skip'||d.decision==='applied')?null:1,
        errCand:(isCopy||d.decision==='skip'||d.decision==='applied')?null:(d.decision==='adopt'?0.9:1),
        decision:d.decision};});}),
  endpoint:{budgetAdjustedEnergyPerFounder:level}});
const GOSELF={
  0:[{dir:true,decision:'adopt'}],
  1:[{dir:true,decision:'adopt'}],
  2:[{dir:false,decision:'keep'}],
  3:[{dir:false,inc:{rate:2,gain:1,width:0,boost:0},decision:'keep'}],
  4:[{dir:false,inc:{rate:2,gain:1,width:0,boost:0},decision:'keep'}],
  5:[{dir:false,decision:'keep'}]};

test('faithful mix: clone shows live AND replay updates, live state untouched',()=>{
  const recs=mkMixedRecs();
  const st=mkState(1,recs,0);
  const wBefore=JSON.stringify(st.weights.taste),opsBefore=st.work.scalarOperations;
  const clone=structuredClone(st);
  fitCloneV1d(clone,recs.slice(0,12));
  assert.ok(clone.work.tasteLiveUpdates>0,'no live updates ran in sandbox fit');
  assert.ok(clone.work.replayUpdates>0,'no replay updates ran in sandbox fit');
  assert.equal(JSON.stringify(st.weights.taste),wBefore);
  assert.equal(st.work.scalarOperations,opsBefore);
});
const GOSELF_C={
  0:[{decision:'copied',noop:true,sourceCp:null,inc:BASE,vals:BASE}],
  1:[{decision:'copied',noop:false,sourceCp:256,inc:BASE,vals:{rate:2,gain:0.5,width:0,boost:0}}],
  2:[{decision:'copied',noop:false,sourceCp:512,inc:{rate:2,gain:0.5,width:0,boost:0},vals:{rate:1,gain:1,width:0,boost:0}}],
  3:[{decision:'copied',noop:true,sourceCp:768,inc:{rate:1,gain:1,width:0,boost:0},vals:{rate:1,gain:1,width:0,boost:0}}],
  4:[{decision:'copied',noop:true,sourceCp:1024,inc:{rate:1,gain:1,width:0,boost:0},vals:{rate:1,gain:1,width:0,boost:0}}],
  5:[{decision:'copied',noop:true,sourceCp:1280,inc:{rate:1,gain:1,width:0,boost:0},vals:{rate:1,gain:1,width:0,boost:0}}]};
test('copied control: lagged mirror, cp_0 and dead mirrors no-op, meter untouched',()=>{
  const st=mkState(1,mkMixedRecs(),0);
  const before=st.work.scalarOperations;
  const mir=new Map([['7:256',{rate:2,gain:0.5,width:0,boost:0}]]);
  const r0=copiedApplyV1d(st,7,256,0,mir);
  assert.equal(r0.decision,'copied');
  assert.equal(r0.noop,true);
  assert.equal(r0.sourceCp,null);
  assert.deepEqual(r0.propVals,{rate:1,gain:0.5,width:0,boost:0});
  assert.equal(st.config.tasteRate,1);
  const r1=copiedApplyV1d(st,7,512,1,mir);
  assert.equal(r1.noop,false);
  assert.equal(r1.sourceCp,256);
  assert.deepEqual(r1.propVals,{rate:2,gain:0.5,width:0,boost:0});
  assert.equal(st.config.tasteRate,2);
  const st2=mkState(1,mkMixedRecs(),0);
  const rd=copiedApplyV1d(st2,99,768,2,mir);
  assert.equal(rd.noop,true);
  assert.equal(st2.config.tasteRate,1);
  assert.equal(r1.intensify,null);
  assert.equal(r1.fitN,0);
  assert.equal(r1.errInc,null);
  assert.equal(st.work.scalarOperations-before,0);
});
test('scorer V1d branches: GO+labels, NOGOs, INVALID, INCOMPLETE',()=>{
  const seeds=[400001,400010,400019,400028,400037,400046,400055,400064];
  const goSelf=seeds.map(s=>mkCRow('selfmod',s,1.0,GOSELF));
  const goRand=seeds.map(s=>mkCRow('random',s,0.5,{0:[{dir:true,decision:'applied'}]}));
  const goFix=seeds.map(s=>mkCRow('fixed',s,1.0,{}));
  const goCopy=seeds.map(s=>mkCRow('copied',s,1.0,GOSELF_C));
  const go=scoreRsiSelfV1d([...goSelf,...goRand,...goFix,...goCopy]);
  assert.equal(go.go,true);
  assert.equal(go.g6label,'selection signal');
  assert.ok(go.verdict.startsWith('PHASE-D-GO'));
  assert.equal(go.persistent,16);
  assert.deepEqual([...go.persistItems].sort(),['gain','rate']);
  assert.ok(Math.abs(go.g6b.selfmodVsCopied)<1e-9);
  const flat=scoreRsiSelfV1d([...goSelf.map(r=>({...r,endpoint:{budgetAdjustedEnergyPerFounder:0.7}})),...goRand,...goFix,...goCopy]);
  assert.equal(flat.go,false);
  assert.equal(flat.verdict,'PHASE-D-NOGO');
  const bad=scoreRsiSelfV1d([...goSelf.map(r=>r.history.seed===400001
    ?{...r,proposals:r.proposals.map(q=>({...q,decision:'keep'}))}:r),...goRand,...goFix,...goCopy]);
  assert.equal(bad.go,false);
  assert.equal(bad.verdict,'INVALID');
  const rev={
    0:[{dir:true,decision:'adopt'}],
    1:[{dir:false,decision:'keep'}],
    2:[{dir:false,decision:'keep'}],
    3:[{dir:false,inc:{rate:2,gain:0.5,width:0,boost:0},decision:'adopt'}],
    4:[{dir:false,decision:'keep'}],
    5:[{dir:false,decision:'keep'}]};
  const keepAll={0:[{dir:false,decision:'keep'}],1:[{dir:false,decision:'keep'}],2:[{dir:false,decision:'keep'}],3:[{dir:false,decision:'keep'}],4:[{dir:false,decision:'keep'}],5:[{dir:false,decision:'keep'}]};
  const revC={
    0:[{decision:'copied',noop:true,sourceCp:null,inc:BASE,vals:BASE}],
    1:[{decision:'copied',noop:false,sourceCp:256,inc:BASE,vals:{rate:2,gain:0.5,width:0,boost:0}}],
    2:[{decision:'copied',noop:true,sourceCp:512,inc:{rate:2,gain:0.5,width:0,boost:0},vals:{rate:2,gain:0.5,width:0,boost:0}}],
    3:[{decision:'copied',noop:true,sourceCp:768,inc:{rate:2,gain:0.5,width:0,boost:0},vals:{rate:2,gain:0.5,width:0,boost:0}}],
    4:[{decision:'copied',noop:false,sourceCp:1024,inc:{rate:2,gain:0.5,width:0,boost:0},vals:{rate:1,gain:0.5,width:0,boost:0}}],
    5:[{decision:'copied',noop:true,sourceCp:1280,inc:{rate:1,gain:0.5,width:0,boost:0},vals:{rate:1,gain:0.5,width:0,boost:0}}]};
  const keepC={
    0:[{decision:'copied',noop:true,sourceCp:null,inc:BASE,vals:BASE}],
    1:[{decision:'copied',noop:true,sourceCp:256,inc:BASE,vals:BASE}],
    2:[{decision:'copied',noop:true,sourceCp:512,inc:BASE,vals:BASE}],
    3:[{decision:'copied',noop:true,sourceCp:768,inc:BASE,vals:BASE}],
    4:[{decision:'copied',noop:true,sourceCp:1024,inc:BASE,vals:BASE}],
    5:[{decision:'copied',noop:true,sourceCp:1280,inc:BASE,vals:BASE}]};
  const revRows=[mkCRow('selfmod',400001,1.0,rev),mkCRow('selfmod',400010,1.0,rev),
    ...seeds.slice(2).map(s=>mkCRow('selfmod',s,1.0,keepAll)),
    ...goRand,...goFix,
    mkCRow('copied',400001,1.0,revC),mkCRow('copied',400010,1.0,revC),
    ...seeds.slice(2).map(s=>mkCRow('copied',s,1.0,keepC))];
  const revS=scoreRsiSelfV1d(revRows);
  assert.equal(revS.persistent,2);
  assert.equal(revS.go,false);
  assert.equal(revS.verdict,'PHASE-D-NOGO');
});
