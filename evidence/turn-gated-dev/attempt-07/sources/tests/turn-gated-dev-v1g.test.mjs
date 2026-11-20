// TURN-GATE V1g fixtures (G3 gate per plan; triple options contrast +
// direction-aware splits + manipulation plumbing). Zero bank worlds:
// synthetic learners/rows only. Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';
import {copyWeights,checkTransplantIntegrity,digestWeights,snapshotWeights,assertFreshTarget,scoreTurnGateV1g,
  scoreFlipSplit,mechanismConfirmed,subsetGap,agentWork,sumManipulation,turnGateDevV1gBank,
  T7_TOURNAMENT_OPTS,T7_GAIN_OPTS,T7_BUNDLE_OPTS} from '../scripts/turn-gated-dev-v1g.mjs';

const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({agentId:1,weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaitingObservation:false,acquisition:true,dead:false,recent:[],older:[],
  motorPending:null,hold:{cruise:false,remaining:0},...extra});
const snap=a=>snapshotWeights(a);

test('transplant copies weights exactly; rejects id/shape mismatch',()=>{
  const src=snap({1:mkAgent([[1,2],[3,4],[5,6]]),2:mkAgent([[7,8],[9,10],[11,12]])});
  const dst={1:mkAgent([[0,0],[0,0],[0,0]]),2:mkAgent([[0,0],[0,0],[0,0]])};
  const r=copyWeights(src,dst);
  assert.equal(r.transferred,2);
  assert.deepEqual(dst[1].weights,{taste:[1,2],actor:[3,4],critic:[5,6]});
  assert.deepEqual(dst[2].weights,{taste:[7,8],actor:[9,10],critic:[11,12]});
  assert.throws(()=>copyWeights(snap({1:mkAgent([[1],[2],[3]])}),dst),/founder id mismatch/);
  assert.throws(()=>copyWeights(snap({1:mkAgent([[1,2,3],[4,5,6],[7,8,9]]),2:mkAgent([[1],[2],[3]])}),dst),/mismatch/);
});

test('fresh-target contract: fresh passes, every stale field fails',()=>{
  const fresh=mkAgent([[0],[0],[0]]);
  assert.doesNotThrow(()=>assertFreshTarget(fresh,'1'));
  const stale=[{...mkAgent([[0],[0],[0]]),lastObservedTick:5},{...mkAgent([[0],[0],[0]]),lastDecisionTick:7},
    {...mkAgent([[0],[0],[0]]),recent:[{x:1}]},{...mkAgent([[0],[0],[0]]),older:[{x:2}]},
    {...mkAgent([[0],[0],[0]]),motorPending:{}}];
  for(const t of stale)assert.throws(()=>assertFreshTarget(t,'9'),/not fresh/);
});

test('integrity checker passes clean copy; flags planted corruptions',()=>{
  const src=snap({1:mkAgent([[1,2],[3,4],[5,6]])});
  const good={1:mkAgent([[9,9],[9,9],[9,9]])};
  copyWeights(src,good);
  const ok=checkTransplantIntegrity(src,good);
  assert.equal(ok.ok,true);
  assert.deepEqual(ok.violations,[]);
  const missing={};
  const m1=checkTransplantIntegrity(src,missing);
  assert.equal(m1.ok,false);
  assert.ok(m1.violations.some(v=>v.includes('missing agent')));
  const wrong={1:mkAgent([[9,9],[9,9],[9,9]])};
  copyWeights(src,wrong);
  wrong[1].weights.taste=[0,0];
  const m2=checkTransplantIntegrity(src,wrong);
  assert.equal(m2.ok,false);
  assert.ok(m2.violations.some(v=>v.includes('value mismatch')));
  const ragged={1:mkAgent([[9,9],[9],[9,9]])};
  const m3=checkTransplantIntegrity(src,ragged);
  assert.equal(m3.ok,false);
  assert.ok(m3.violations.some(v=>v.includes('shape mismatch')));
});

test('intervention options contrast exactly (triple independent variable guarded)',()=>{
  const diffKeys=(a,b)=>Object.keys({...a,...b}).filter(k=>a[k]!==b[k]).sort();
  // base nulls (V1b-V1f replication anchor, re-verified)
  assert.equal(BT_LEARNER_OPTIONS.replayTournament,1);
  assert.equal(BT_LEARNER_OPTIONS.replaySurpriseGain,0);
  assert.equal(BT_LEARNER_OPTIONS.surpriseGain,0);
  assert.equal(BT_LEARNER_OPTIONS.replaySkip,0);
  // tournament = base + exactly 1 differing key @3 (escalated pure selection)
  assert.deepEqual(diffKeys(BT_LEARNER_OPTIONS,T7_TOURNAMENT_OPTS),['replayTournament']);
  assert.equal(T7_TOURNAMENT_OPTS.replayTournament,3);
  // gain = base + exactly 2 differing keys @1.0/3 (boost-only, completes decomposition)
  assert.deepEqual(diffKeys(BT_LEARNER_OPTIONS,T7_GAIN_OPTS),['replaySurpriseGain','surpriseGain']);
  assert.equal(T7_GAIN_OPTS.surpriseGain,1.0);
  assert.equal(T7_GAIN_OPTS.replaySurpriseGain,3);
  assert.equal(T7_GAIN_OPTS.replayTournament,1);
  // bundle = base + exactly 3 differing keys @3/1.0/3 (full escalation)
  assert.deepEqual(diffKeys(BT_LEARNER_OPTIONS,T7_BUNDLE_OPTS),['replaySurpriseGain','replayTournament','surpriseGain']);
  assert.equal(T7_BUNDLE_OPTS.replayTournament,3);
  assert.equal(T7_BUNDLE_OPTS.surpriseGain,1.0);
  assert.equal(T7_BUNDLE_OPTS.replaySurpriseGain,3);
  assert.ok(Object.isFrozen(T7_TOURNAMENT_OPTS));
  assert.ok(Object.isFrozen(T7_GAIN_OPTS));
  assert.ok(Object.isFrozen(T7_BUNDLE_OPTS));
});

const mkRow=(tag,seed,turnPairs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(turnPairs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});

const rows18=(seedBase,t,u,tt,tg,tb,uu)=>{
  const rows=[];
  for(let h=0;h<3;h++){
    const mk=(tag,[th,tb2])=>mkRow(tag,seedBase+h,[['h',true,th],['b',false,tb2]]);
    rows.push(mk('train',t));
    rows.push(mk('transferred',u));
    rows.push(mk('transferred-tournament',tt));
    rows.push(mk('transferred-gain',tg));
    rows.push(mk('transferred-bundle',tb));
    rows.push(mk('unlearned',uu));
  }
  return rows;
};
// gap = th/10 - tb/10. GO: train 0.7, uniform 0.4, unlearned 0.0.
test('scorer GO on trained + uniform + all three intervention triples + flat unlearned',()=>{
  const v=scoreTurnGateV1g(rows18(412001,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]));
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2a,true);
  assert.ok(Math.abs(v.transMean-0.4)<1e-9);
  assert.equal(v.g2b,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-G-GO');
});

test('scorer NOGO / INVALID / INCOMPLETE branches + all intervention triples required',()=>{
  // uniform gap 0.2 < 0.3 -> NOGO (intervention values never gate)
  const n=scoreTurnGateV1g(rows18(412011,[8,1],[3,1],[10,0],[10,0],[10,0],[1,1]));
  assert.equal(n.go,false);
  assert.equal(n.verdict,'PHASE-G-NOGO');
  const bad=rows18(412011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1g(bad);
  assert.equal(iv.verdict,'INVALID');
  const flat=rows18(412011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).map(r=>r.tag==='train'?mkRow('train',r.history.seed,[['h',false,1],['b',false,1]]):r);
  const iu=scoreTurnGateV1g(flat);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  // each intervention triple required (fail-closed completeness)
  for(const tag of ['transferred-tournament','transferred-gain','transferred-bundle']){
    const missing=rows18(412011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).filter(r=>r.tag!==tag);
    assert.throws(()=>scoreTurnGateV1g(missing),new RegExp(tag));
  }
  // intervention join failure -> INVALID (G1 covers all 18)
  const armBad=rows18(412011,[8,1],[5,1],[6,1],[6,1],[6,1],[1,1]).map(r=>r.tag==='transferred-gain'?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  assert.equal(scoreTurnGateV1g(armBad).verdict,'INVALID');
});

test('flip-split reports direction subsets BH/HB alongside union',()=>{
  // train: A harm, B ben, C ben. test: A ben (HB), B harm (BH), C same (ben), D harm (test-only).
  const tr=mkRow('train',412001,[['A',true],['B',false],['C',false]]);
  const te=mkRow('transferred',412010,[['A',false,4],['B',true,7],['C',false,1],['D',true,9]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,412001);
  assert.equal(f.testSeed,412010);
  assert.equal(f.flippedHB.cues,1);
  assert.equal(f.flippedHB.contact,10);
  assert.ok(Math.abs(f.flippedHB.correctness-0.6)<1e-9);
  assert.equal(f.flippedBH.cues,1);
  assert.ok(Math.abs(f.flippedBH.correctness-0.7)<1e-9);
  assert.ok(Math.abs(f.flipped.correctness-0.65)<1e-9);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  assert.equal(f.replayed.correctness,+(16/30).toFixed(4));
  assert.equal(f.same.cues+f.flipped.cues,3);
  assert.equal(mechanismConfirmed(f),true);
  const fEmpty=scoreFlipSplit(mkRow('train',412001,[['A',true]]),mkRow('transferred',412010,[['B',true,5]]));
  assert.equal(fEmpty.flippedHB.correctness,null);
  assert.equal(fEmpty.flippedBH.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('subsetGap + agentWork + sumManipulation behave (incl. null propagation)',()=>{
  // train: A harm, B harm, E ben. test: A harm (same), B ben (HB), E ben (same).
  const tr=mkRow('train',412019,[['A',true],['B',true],['E',false]]);
  const base=scoreFlipSplit(tr,mkRow('transferred',412028,[['A',true,10],['B',false,5],['E',false,1]]));
  const int=scoreFlipSplit(tr,mkRow('transferred-bundle',412028,[['A',true,10],['B',false,2],['E',false,1]]));
  // HB = unlearn turning: base B test-ben turn 5/10 -> 0.5; int turns 2/10 -> 0.8. Gap +0.3.
  assert.ok(Math.abs(subsetGap(base,int,'flippedHB')-0.3)<1e-9);
  // same -> 0.95 both; gap 0 (retention intact).
  assert.ok(Math.abs(subsetGap(base,int,'same')-0)<1e-9);
  // null propagation: empty HB subset
  const noHB=scoreFlipSplit(mkRow('train',412019,[['A',true]]),mkRow('transferred',412028,[['A',true,10]]));
  assert.equal(noHB.flippedHB.correctness,null);
  assert.equal(subsetGap(noHB,int,'flippedHB'),null);
  assert.equal(subsetGap(base,noHB,'flippedHB'),null);
  const w=agentWork({1:{work:{surpriseBoosts:2,replaySurpriseBoosts:3,replaySkips:1}},2:{work:{}},3:{}});
  assert.deepEqual(w,{surpriseBoosts:2,replaySurpriseBoosts:3,replaySkips:1});
  assert.deepEqual(agentWork({}),{surpriseBoosts:0,replaySurpriseBoosts:0,replaySkips:0});
  const s=sumManipulation([{manipulation:{surpriseBoosts:1,replaySurpriseBoosts:2,replaySkips:0}},{manipulation:{surpriseBoosts:0,replaySurpriseBoosts:5,replaySkips:1}},{}]);
  assert.deepEqual(s,{surpriseBoosts:1,replaySurpriseBoosts:7,replaySkips:1});
});

test('live bank 412001-412054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1g bank built cleanly pre-build (9/9 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=turnGateDevV1gBank('evidence/turn-gated-dev/fresh-07/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1g');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),412001);
  assert.equal(Math.max(...flat),412054);
  for(const s of [381001,395019,396001,407001,408001,409001,410001,411001,412001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gate-v1g-bank-guard-'));
  assert.throws(()=>turnGateDevV1gBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
