// TURN-GATED V1m fixtures (13/13 green required before bank build; zero bank worlds).
// Synthetic learners/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,checkScaledIntegrity,digestWeights,scaleSnapshot,snapshotWeights,assertFreshTarget,scoreTurnGateV1m,
  scoreFlipSplit,scoreFlipSplitV1m,mechanismConfirmed,turnGateDevV1mBank,turnGateDevV1mSources,
  TM_EXPECT_MAINS,TM_EXPECT_PROBES,TM_ARMS,TM_PAIRS,TM_ALPHAS} from '../scripts/turn-gated-dev-v1m.mjs';

const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({agentId:1,weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaiting:true,acquisition:true,dead:false,recent:[],older:[],
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

test('scaleSnapshot scales by any alpha; rejects bad alpha',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  assert.deepEqual(scaleSnapshot(src,0.5),{1:{taste:[1,2],actor:[3,4],critic:[5,6]}});
  assert.deepEqual(scaleSnapshot(src,0.25),{1:{taste:[0.5,1],actor:[1.5,2],critic:[2.5,3]}});
  assert.deepEqual(scaleSnapshot(src,1),src);
  assert.throws(()=>scaleSnapshot(src,NaN),/finite/);
  assert.throws(()=>scaleSnapshot(src,-0.5),/non-negative/);
});

test('scaled-integrity is alpha-exact (0.25 vs 0.5 vs 0.75 distinguished)',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  for(const a of [0.25,0.5,0.75]){
    const good={1:mkAgent([[0,0],[0,0],[0,0]])};
    copyWeights(scaleSnapshot(src,a),good);
    assert.equal(checkScaledIntegrity(src,good,a).ok,true);
    for(const b of [0.25,0.5,0.75]){
      if(b===a)continue;
      assert.equal(checkScaledIntegrity(src,good,b).ok,false);
    }
  }
});

// V1m synthetic dose rows: BH 0.8 all arms; same 0.9; HB 0.25->0.7 / 0.5->0.5 / 0.75->0.4.
// Train gap 0.7 (harm 0.8, ben-turn 0.1). Best alpha 0.25 hits MET bar (0.7 >= 0.7-0.1).
const mkRowM=(tag,seed,specs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
const mTrain=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const mExact=s=>[['A',true,9],['B',true,8],['C',false,7],['D',false,1]];
const mLossy=a=>s=>[['A',true,9],['B',true,8],['C',false,a===0.25?3:a===0.5?5:6],['D',false,1]];
const mUnlearn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const mRows=()=>{const rows=[];for(let h=0;h<3;h++){const s=450001+h;
  rows.push(mkRowM('train',s,mTrain(s)));rows.push(mkRowM('transferred',s,mExact(s)));
  for(const a of [0.25,0.5,0.75])rows.push(mkRowM(`transferred-lossy-${a}`,s,mLossy(a)(s)));
  rows.push(mkRowM('unlearned',s,mUnlearn(s)));}return rows;};
const mPairs=()=>[0,1,2].map(h=>[[450001+h],[450001+h]]).map(([a,b])=>[a[0],b[0]]);

test('scorer GO-V1m when best-alpha HB-seg1 within 0.1 of train (MET bar)',()=>{
  const rows=mRows();
  const v=scoreTurnGateV1m(rows,mPairs());
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2b,true);
  assert.deepEqual(v.hbByAlpha,{0.25:0.7,0.5:0.5,0.75:0.4});
  assert.equal(v.bestAlpha,0.25);
  assert.ok(Math.abs(v.bestHb-0.7)<1e-9);
  assert.ok(Math.abs(v.trainMean-0.7)<1e-9);
  assert.equal(v.gMet,true);
  assert.equal(v.gBhFloor,true);
  assert.equal(v.gSameFloor,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-M-GO');
});

test('scorer NOGO when no alpha reaches the MET bar; BH/same floors breach; INVALID/INCOMPLETE preserved',()=>{
  const flat=mRows().map(r=>r.tag.startsWith('transferred-lossy')
    ?mkRowM(r.tag,r.history.seed,[['A',true,9],['B',true,8],['C',false,5],['D',false,1]]):r);
  const n=scoreTurnGateV1m(flat,mPairs());
  assert.equal(n.go,false);
  assert.equal(n.gMet,false);
  assert.equal(n.verdict,'PHASE-M-NOGO');
  const bhBad=mRows().map(r=>r.tag==='transferred-lossy-0.25'
    ?mkRowM(r.tag,r.history.seed,[['A',true,9],['B',true,2],['C',false,3],['D',false,1]]):r);
  const n2=scoreTurnGateV1m(bhBad,mPairs());
  assert.equal(n2.go,false);
  assert.equal(n2.gBhFloor,false);
  assert.equal(n2.verdict,'PHASE-M-NOGO');
  const bad=mRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1m(bad,mPairs());
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const untrained=mRows().map(r=>r.tag==='train'
    ?mkRowM('train',r.history.seed,[['A',false,1],['B',false,1],['C',false,1]]):r);
  const iu=scoreTurnGateV1m(untrained,mPairs());
  assert.equal(iu.go,false);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  const short=mRows().slice(0,17);
  const sh=scoreTurnGateV1m(short,mPairs());
  assert.equal(sh.go,false);
  assert.equal(sh.verdict,'INVALID');
});

test('flip-split separates same-valence retention from flipped-cue residue (aggregate, descriptive)',()=>{
  const tr=mkRowM('train',450001,[['A',true],['B',false],['C',true]]);
  const te=mkRowM('transferred-lossy-0.5',450010,[['A',true,9],['B',true,5],['C',true,9],['D',false,1]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,450001);
  assert.equal(f.testSeed,450010);
  assert.equal(f.same.cues,2);
  assert.equal(f.same.contact,20);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  assert.equal(f.flipped.cues,1);
  assert.equal(f.flipped.contact,10);
  assert.ok(Math.abs(f.flipped.correctness-0.5)<1e-9);
  assert.equal(mechanismConfirmed(f),true);
  const fEmpty=scoreFlipSplit(mkRowM('train',450001,[['A',true]]),mkRowM('transferred-lossy-0.5',450010,[['B',true,5]]));
  assert.equal(fEmpty.same.correctness,null);
  assert.equal(fEmpty.flipped.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('direction-split partitions BH vs HB; empty direction null',()=>{
  const tr=mkRowM('train',450001,[['A',true],['B',false],['C',true]]);
  const te=mkRowM('transferred-lossy-0.25',450010,[['A',true,9],['B',true,8],['C',false,3]]);
  const f=scoreFlipSplitV1m(tr,te);
  assert.equal(f.flippedBH.cues,1);
  assert.ok(Math.abs(f.flippedBH.correctness-0.8)<1e-9);
  assert.equal(f.flippedHB.cues,1);
  assert.ok(Math.abs(f.flippedHB.correctness-0.7)<1e-9);
  assert.equal(f.flippedBH.cues+f.flippedHB.cues,f.flipped.cues);
  const noHB=scoreFlipSplitV1m(
    mkRowM('train',450001,[['A',true],['B',false]]),
    mkRowM('transferred-lossy-0.25',450010,[['A',true,9],['B',true,8]]));
  assert.equal(noHB.flippedHB.cues,0);
  assert.equal(noHB.flippedHB.correctness,null);
});

test('dose-selection unit: best-alpha = argmax pooled HB; MET math; empty-alpha fails the gate',()=>{
  const v=scoreTurnGateV1m(mRows(),mPairs());
  assert.equal(v.bestAlpha,0.25);
  assert.ok(v.bestHb>=v.trainMean-0.1);
  const rows3=[];
  for(let h=0;h<3;h++){const s=450001+h;
    rows3.push(mkRowM('train',s,mTrain(s)));rows3.push(mkRowM('transferred',s,mExact(s)));
    rows3.push(mkRowM('transferred-lossy-0.25',s,h===0?[['A',true,9],['B',true,8],['D',false,1]]:mLossy(0.25)(s)));
    for(const a of [0.5,0.75])rows3.push(mkRowM(`transferred-lossy-${a}`,s,mLossy(a)(s)));
    rows3.push(mkRowM('unlearned',s,mUnlearn(s)));}
  const v2=scoreTurnGateV1m(rows3,mPairs());
  assert.equal(v2.flips[0],null);
  assert.equal(v2.bestAlpha,null);
  assert.equal(v2.gMet,false);
  assert.equal(v2.go,false);
  assert.equal(v2.verdict,'PHASE-M-NOGO');
});

test('mains/probes caps match the frozen 6-arm x 3-pair design (regression: the 12-vs-15 slip)',()=>{
  assert.equal(TM_ARMS.length,6);
  assert.equal(TM_PAIRS.length,3);
  assert.equal(TM_EXPECT_MAINS,18);
  assert.equal(TM_EXPECT_MAINS,TM_ARMS.length*TM_PAIRS.length);
  assert.equal(TM_EXPECT_PROBES,0);
  assert.deepEqual([...TM_ALPHAS],[0.25,0.5,0.75]);
});

test('runner implements the dose panel (structural guard; V1l block-order lesson)',()=>{
  const src=readFileSync(new URL('../scripts/turn-gated-dev-v1m.mjs',import.meta.url),'utf8');
  assert.ok(src.includes('for(const alpha of TM_ALPHAS)'),'missing alpha-parameterized dose loop');
  assert.ok(!src.includes('TM_LOSSY_ALPHA'),'single-alpha remnant (dose panel requires per-arm alpha)');
  assert.ok(src.includes("tag:`transferred-lossy-${a}`")||src.includes('transferred-lossy-${alpha}'),'dose tags not parameterized');
});

test('live bank 450001-450054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1m bank was found pre-built in place
  // (created 2026-11-02T00:34Z, verified 54-unique 450001-450054, correct
  // experiment, current backstop incl 448001+449001 — adopted without
  // rebuild, zero new worlds) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=turnGateDevV1mBank('evidence/turn-gated-dev/fresh-14/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1m');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),450001);
  assert.equal(Math.max(...flat),450054);
  for(const s of [381001,395019,396001,407001,414001,418001,444001,447001,448001,449001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gated-dev-v1m-bank-guard-'));
  assert.throws(()=>turnGateDevV1mBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
