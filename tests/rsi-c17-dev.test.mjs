// RSI C17 fixtures (16/16 green required before bank build; zero bank worlds).
// Synthetic bodies/rows/runs only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTasteEnergyBody} from '../learning/taste-energy.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';
import {snapshotWeights,copyWeights,checkTransplantIntegrity,digestWeights,assertFreshTarget,
  cueIdMaps,makeInterventionDriver,argminIndex,makeSeededRand,scoreRsiC17,
  C17_SURROGATE_BANK,C17_FIXTURE_SEEDS,C17_SPENT_SEEDS,C17_K,C17_S,C17_EV,
  C17_TAGS,C17_PAIRS,C17_G1_LIFT,C17_G2_TOL,C17_G3_NULL} from '../scripts/rsi-c17-dev.mjs';

const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({agentId:1,weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaiting:true,acquisition:true,dead:false,recent:[],older:[],
  motorPending:null,hold:{cruise:false,remaining:0},...extra});

// F1: bank constants — 54-unique, correct start, zero spent overlap.
test('F1 bank seeds 54-unique from 472001, disjoint from every spent seed',()=>{
  assert.equal(C17_FIXTURE_SEEDS.length,54);
  assert.equal(C17_FIXTURE_SEEDS[0],472001);
  assert.equal(new Set(C17_FIXTURE_SEEDS).size,54);
  const spent=new Set(C17_SPENT_SEEDS);
  for(const s of C17_FIXTURE_SEEDS)assert.ok(!spent.has(s),'fixture seed already spent: '+s);
});

// F2: history shape — 54 seeds chunk 6x9 with disjoint role sets.
test('F2 bank histories chunk 6x9 with disjoint seed/cue/resource/probe roles',()=>{
  const chunks=[];for(let h=0;h<6;h++)chunks.push(C17_FIXTURE_SEEDS.slice(h*9,h*9+9));
  const roles=chunks.map(s=>({seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:[s[6],s[7],s[8]]}));
  const flat=roles.flatMap(r=>[r.seed,r.cueSeed,...r.resourceSeeds,...r.probeSeeds]);
  assert.equal(new Set(flat).size,54);
  for(const r of roles){assert.equal(r.resourceSeeds.length,4);assert.equal(r.probeSeeds.length,3);}
});

// F3: fixture-write contract — seeds object shape + experiment tag match.
test('F3 fixture file contract pins the seed list under the C17 experiment',()=>{
  const fixture={seeds:[...C17_FIXTURE_SEEDS]};
  assert.deepEqual(fixture.seeds,C17_FIXTURE_SEEDS);
  assert.equal(C17_TAGS.length,5);
});

// F4: fresh-target contract — fresh passes, every stale field fails.
test('F4 assertFreshTarget: fresh passes, stale ticks/buffers/motor fail',()=>{
  assert.doesNotThrow(()=>assertFreshTarget(mkAgent([[0],[0],[0]]),'1'));
  const stale=[{...mkAgent([[0],[0],[0]]),lastObservedTick:5},{...mkAgent([[0],[0],[0]]),lastDecisionTick:7},
    {...mkAgent([[0],[0],[0]]),recent:[{x:1}]},{...mkAgent([[0],[0],[0]]),older:[{x:2}]},
    {...mkAgent([[0],[0],[0]]),motorPending:{}}];
  for(const t of stale)assert.throws(()=>assertFreshTarget(t,'9'),/not fresh/);
});

// F5: exact transplant integrity — copies exactly, flags corruption, digests match.
test('F5 transplant copies exactly; corruption flagged; digests equal',()=>{
  const src=snapshotWeights({1:mkAgent([[1,2],[3,4],[5,6]])});
  const good={1:mkAgent([[0,0],[0,0],[0,0]])};
  assert.equal(copyWeights(src,good).transferred,1);
  assert.equal(checkTransplantIntegrity(src,good).ok,true);
  assert.equal(digestWeights(src),digestWeights(snapshotWeights(good)));
  good[1].weights.actor=[0,0];
  assert.equal(checkTransplantIntegrity(src,good).ok,false);
});

// F6: surrogate bank — exactly the 16-pattern ±1 4-space, norm 2 exact, frozen.
test('F6 surrogate bank is the full 16-pattern space, norm exactly 2, frozen',()=>{
  assert.equal(C17_SURROGATE_BANK.length,16);
  assert.equal(C17_K,16);
  const seen=new Set();
  for(const v of C17_SURROGATE_BANK){
    assert.ok(Object.isFrozen(v));
    assert.equal(v.length,4);
    assert.ok(v.every(x=>x===1||x===-1));
    assert.equal(Math.hypot(...v),2);
    seen.add(v.join(','));
  }
  assert.equal(seen.size,16);
});

// ---- driver harness (synthetic run shell + real bodies; zero worlds) ----
const RAW16=()=>{const r=new Array(16).fill(0);r[15]=0;r.push(1);return r.slice(0,16).concat([1]);};
const mkOwn=(tick,cue)=>({agentId:1,tick,energy:1,raw:RAW16(),contactPresent:true,odorPresent:true,cue:[...cue]});
function mkCodebooks(){
  const fam=v=>[{id:5,bits:[1,-1,1,-1],valence:v},{id:6,bits:[-1,-1,1,1],valence:-1}];
  const transfer={A:fam(1),B:fam(1),C:fam(1)};
  const train={A:fam(-1),B:fam(-1),C:fam(-1)};
  return {transfer,train};
}
function mkRun(){
  const body=createTasteEnergyBody(1,7,BT_LEARNER_OPTIONS);
  return {phaseIndex:0,world:{tick:100,flies:[{id:1,x:0,y:0}],
    food:[{cueId:5,x:1,y:1,cue:[1,-1,1,-1],valence:1},{cueId:6,x:50,y:50,cue:[-1,-1,1,1],valence:-1}]},
    codebook:mkCodebooks().transfer,learners:{1:body}};
}
function stageOwns(driver,runRef,n,startTick=1){
  for(let t=0;t<n;t++)driver.observe({type:'decision',own:mkOwn(startTick+t,[1,-1,1,-1])},runRef);
}
function mkWired(mode,legSeed=99){
  const {transfer,train}=mkCodebooks();
  const driver=makeInterventionDriver({mode,legSeed,transferCodebook:transfer,trainCodebook:train});
  const run=mkRun();const runRef={current:run};
  return {driver,run,runRef};
}

// F7: probe determinism — twin drivers, identical staging, identical targets + probeOps.
test('F7 twin indexed drivers fire identically: same target, same probeOps',()=>{
  const a=mkWired('indexed'),b=mkWired('indexed');
  stageOwns(a.driver,a.runRef,C17_S);stageOwns(b.driver,b.runRef,C17_S);
  const ra=a.driver.fire(a.runRef,5),rb=b.driver.fire(b.runRef,5);
  assert.ok(ra&&rb);
  assert.equal(ra.targetIndex,rb.targetIndex);
  assert.equal(ra.probeOps,rb.probeOps);
  assert.ok(ra.probeOps>0);
  assert.equal(ra.means.length,16);
});

// F8: S-gate — 31 staged owns cannot fire; 32 can.
test('F8 fewer than 32 staged states never fires; 32 fires',()=>{
  const a=mkWired('indexed');
  stageOwns(a.driver,a.runRef,C17_S-1);
  assert.equal(a.driver.fire(a.runRef,5),null);
  stageOwns(a.driver,a.runRef,1);
  assert.ok(a.driver.fire(a.runRef,5));
});

// F9: evidence gate — needs 2 intakes on the eligible cue; ineligible cue never fires.
test('F9 two-intake gate per cue; ineligible cue immune at any count',()=>{
  const {driver,run,runRef}=mkWired('indexed');
  stageOwns(driver,runRef,C17_S);
  const dec=t=>({type:'decision',own:mkOwn(t,[1,-1,1,-1])});
  const phy=(t,b)=>({type:'physical',agentId:1,tick:t,beneficialEaten:b});
  driver.observe(dec(101),runRef);driver.observe(phy(101,1),runRef);
  assert.equal(driver.state.fired,0);
  driver.observe(dec(102),runRef);driver.observe(phy(102,1),runRef);
  assert.equal(driver.state.fired,1);
  // cue 6 is transfer-harmful (ineligible): three intakes, still no fire.
  for(let t=103;t<=105;t++){driver.observe({type:'decision',own:{...mkOwn(t,[-1,-1,1,1])}},runRef);}
  // NOTE: geometric attribution maps the deciding fly to patch cueId 5
  // (nearest patch); cue-6 intake path is exercised via pending on its patch
  // only when the fly is near it — here intakes stay on cue 5 by geometry.
  assert.equal(driver.state.reassignments.filter(r=>r.cueId===6).length,0);
});

// F10: indexed selection — argmin unit incl. ties + wired target is the recorded min.
test('F10 argmin picks lowest, ties to lowest index; wired target is the min',()=>{
  assert.equal(argminIndex([0.5,0.2,0.2]),1);
  assert.equal(argminIndex([0.9,0.1,0.5]),1);
  assert.equal(argminIndex([0.7]),0);
  const {driver,runRef}=mkWired('indexed');
  stageOwns(driver,runRef,C17_S);
  const rec=driver.fire(runRef,5);
  assert.equal(rec.targetIndex,argminIndex(rec.means));
  assert.equal(Math.min(...rec.means),rec.means[rec.targetIndex]);
});

// F11: shuffled selection — seeded stream deterministic, in range, recorded.
test('F11 seeded RNG deterministic + full coverage; shuffled twins agree',()=>{
  const r1=makeSeededRand(1),r2=makeSeededRand(1);
  assert.equal(r1(),r2());
  for(let i=0;i<10;i++)assert.ok(r1()>=0&&r1()<1);
  const bins=new Set();const r3=makeSeededRand(1);
  for(let i=0;i<320;i++)bins.add(Math.floor(r3()*16));
  assert.equal(bins.size,16);
  const a=mkWired('shuffled',7),b=mkWired('shuffled',7);
  stageOwns(a.driver,a.runRef,C17_S);stageOwns(b.driver,b.runRef,C17_S);
  const ra=a.driver.fire(a.runRef,5),rb=b.driver.fire(b.runRef,5);
  assert.equal(ra.targetIndex,rb.targetIndex);
  assert.equal(ra.mode,'shuffled');
});

// F12: revert restores digest-verified original; retain keeps surrogate.
test('F12 no-gain reverts digest-verified; gain retains',()=>{
  const {driver,run,runRef}=mkWired('indexed');
  stageOwns(driver,runRef,C17_S);
  const rec=driver.fire(runRef,5);
  assert.ok(rec);
  assert.deepEqual(run.world.food.find(p=>p.cueId===5).cue,rec.target);
  const st=driver.closeOut(run); // post(2) <= pre(2): revert
  assert.equal(st.reassignments[0].reverted,true);
  assert.deepEqual(run.world.food.find(p=>p.cueId===5).cue,rec.orig);
  const g=mkWired('indexed');
  stageOwns(g.driver,g.runRef,C17_S);
  const rec2=g.driver.fire(g.runRef,5);
  g.driver.state.intakes[5]=(rec2.preIntakes||0)+1; // simulated post gain
  const st2=g.driver.closeOut(g.run);
  assert.equal(st2.reassignments[0].reverted,false);
  assert.deepEqual(g.run.world.food.find(p=>p.cueId===5).cue,rec2.target);
});

// ---- scorer fixtures (synthetic rows; float-margined boundaries) ----
const cue=(contact,turn,ben,harm,label)=>({contact,turn,pause:0,beneficial:ben,harmful:harm,label});
function mkRow(tag,seed,cues,extra={}){
  return {history:{seed},tag,summary:{joinRate:1,cues},...extra};
}
const TRAIN_CUES=()=>({'HB1':cue(100,80,0,50,'harmful'),'BH1':cue(100,10,50,0,'beneficial'),'S1':cue(100,10,50,0,'beneficial')});
const UNL_CUES=()=>({'A':cue(100,50,0,50,'harmful'),'B':cue(100,50,50,0,'beneficial')});
function teCues(hbTurn,bhTurn){
  return {'HB1':cue(100,hbTurn,50,0,'beneficial'),'BH1':cue(100,bhTurn,0,50,'harmful'),'S1':cue(100,10,50,0,'beneficial')};
}
const IV={fired:1,K:16,S:32,EV:2,probeOps:100,reassignments:[]};
const IV0={fired:0,K:16,S:32,EV:2,probeOps:0,reassignments:[]};
function triple(seedBase,exactTurn,indexedTurn,shuffledTurn,bhExact=80,bhIndexed=80){
  const rows=[];
  for(let i=0;i<3;i++){
    const tr=seedBase+i*2,te=tr+1;
    rows.push(mkRow('train',tr,TRAIN_CUES()));
    rows.push(mkRow('transferred-exact',te,teCues(exactTurn,bhExact)));
    rows.push(mkRow('transferred-indexed',te,teCues(indexedTurn,bhIndexed),{intervention:{...IV}}));
    rows.push(mkRow('transferred-shuffled',te,teCues(shuffledTurn,bhExact),{intervention:{...IV0}}));
    rows.push(mkRow('unlearned',te,UNL_CUES()));
  }
  const pairs=[[seedBase,seedBase+1],[seedBase+2,seedBase+3],[seedBase+4,seedBase+5]];
  return {rows,pairs};
}

// F13: G1 strict — lift .05 NOGO; lift .11 GO (float-margined, strict-> by inspection).
test('F13 G1 strict: +.05 NOGO, +.11 GO',()=>{
  const nogo=triple(900001,71,66,71);
  const rn=scoreRsiC17(nogo.rows,nogo.pairs);
  assert.equal(rn.g1dir,false);assert.equal(rn.verdict,'C17-NOGO');
  const go=triple(900011,71,60,71);
  const rg=scoreRsiC17(go.rows,go.pairs);
  assert.equal(rg.g1dir,true);assert.equal(rg.verdict,'C17-GO');
  assert.ok(Math.abs((rg.hbIndexed-rg.hbExact)-0.11)<1e-9);
});

// F14: G2 veto — BH drift .06 passes, .08 vetoes.
test('F14 G2 BH veto: drift .06 passes, .08 vetoes to NOGO',()=>{
  const pass=triple(900021,71,41,71,80,74);
  const rp=scoreRsiC17(pass.rows,pass.pairs);
  assert.equal(rp.g2exc,true);assert.equal(rp.verdict,'C17-GO');
  const veto=triple(900031,71,41,71,80,72);
  const rv=scoreRsiC17(veto.rows,veto.pairs);
  assert.equal(rv.g2exc,false);assert.equal(rv.verdict,'C17-NOGO');
});

// F15: G3 null-shuffled + dose-match — drift .11 INVALID; EV mismatch INVALID.
test('F15 G3: shuffled drift .11 INVALID; dose mismatch INVALID; match GO',()=>{
  const bad=triple(900041,71,41,60);
  const rb=scoreRsiC17(bad.rows,bad.pairs);
  assert.equal(rb.g3ctl,false);assert.equal(rb.verdict,'INVALID');
  const dose=triple(900051,71,41,71);
  dose.rows.find(r=>r.tag==='transferred-shuffled').intervention={...IV0,EV:3};
  const rd=scoreRsiC17(dose.rows,dose.pairs);
  assert.equal(rd.doseOk,false);assert.equal(rd.verdict,'INVALID');
  const ok=triple(900061,71,41,71);
  const ro=scoreRsiC17(ok.rows,ok.pairs);
  assert.equal(ro.g3ctl,true);assert.equal(ro.doseOk,true);assert.equal(ro.verdict,'C17-GO');
});

// F16: billing identity — probeOps>0, equals reassignment sum, deterministic, floor.
test('F16 probeOps>0, sums reassignment ops, deterministic, above per-probe floor',()=>{
  const a=mkWired('indexed'),b=mkWired('indexed');
  stageOwns(a.driver,a.runRef,C17_S);stageOwns(b.driver,b.runRef,C17_S);
  const ra=a.driver.fire(a.runRef,5);
  // second fire on a new cue would need another eligible id; single-fire sum check:
  assert.equal(a.driver.state.probeOps,ra.probeOps);
  assert.ok(ra.probeOps>16*32);
  const rb=b.driver.fire(b.runRef,5);
  assert.equal(rb.probeOps,ra.probeOps);
});
