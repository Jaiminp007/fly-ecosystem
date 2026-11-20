// TURN-GATED V1l fixtures (11/11 green required before bank build; zero bank worlds).
// Synthetic learners/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,checkScaledIntegrity,digestWeights,scaleSnapshot,snapshotWeights,assertFreshTarget,scoreTurnGateV1l,
  scoreFlipSplit,scoreFlipSplitV1l,mechanismConfirmed,turnGateDevV1lBank,turnGateDevV1lSources,
  TL_EXPECT_MAINS,TL_EXPECT_PROBES,TL_ARMS,TL_PAIRS} from '../scripts/turn-gated-dev-v1l.mjs';

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

test('scaleSnapshot halves weights; alpha=1 identity; rejects bad alpha',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  const half=scaleSnapshot(src,0.5);
  assert.deepEqual(half,{1:{taste:[1,2],actor:[3,4],critic:[5,6]}});
  assert.deepEqual(scaleSnapshot(src,1),src);
  const zero=scaleSnapshot(src,0);
  assert.deepEqual(zero,{1:{taste:[0,0],actor:[0,0],critic:[0,0]}});
  assert.throws(()=>scaleSnapshot(src,NaN),/finite/);
  assert.throws(()=>scaleSnapshot(src,-0.5),/non-negative/);
  assert.throws(()=>scaleSnapshot(src,Infinity),/finite/);
});

test('scaled-integrity passes scaled copy; flags exact/wrong-alpha/corrupt',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  const good={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(scaleSnapshot(src,0.5),good);
  assert.equal(checkScaledIntegrity(src,good,0.5).ok,true);
  const exact={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(src,exact);
  const m1=checkScaledIntegrity(src,exact,0.5);
  assert.equal(m1.ok,false);
  assert.ok(m1.violations.some(v=>v.includes('value mismatch')));
  const wrongA={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(scaleSnapshot(src,0.25),wrongA);
  assert.equal(checkScaledIntegrity(src,wrongA,0.25).ok,true);
  assert.equal(checkScaledIntegrity(src,wrongA,0.5).ok,false);
  const ragged={1:mkAgent([[9,9],[9],[9,9]])};
  const m3=checkScaledIntegrity(src,ragged,0.5);
  assert.equal(m3.ok,false);
  assert.ok(m3.violations.some(v=>v.includes('shape mismatch')));
});

// V1l synthetic chain rows: train A-harm/B-ben/C-harm/D-ben; seg1 HB turn 5
// (0.5), seg2 HB turn 4 (0.6), seg3 HB turn 3 (0.7) -> conv +0.2 >= +0.1 GO.
// BH stays 0.8 (floor 0.7 holds); same stays 0.9.
const mkRowL=(tag,seed,specs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
const lTrain=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const lS1=s=>[['A',true,9],['B',true,8],['C',false,5],['D',false,1]];
const lS2=s=>[['A',true,9],['B',true,8],['C',false,4],['D',false,1]];
const lS3=s=>[['A',true,9],['B',true,8],['C',false,3],['D',false,1]];
const lUnlearn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const lRows=()=>{const rows=[];for(let h=0;h<3;h++){const s=449001+h;
  rows.push(mkRowL('train',s,lTrain(s)));rows.push(mkRowL('transferred-lossy',s,lS1(s)));
  rows.push(mkRowL('transferred-seg2',s,lS2(s)));rows.push(mkRowL('transferred-seg3',s,lS3(s)));
  rows.push(mkRowL('unlearned',s,lUnlearn(s)));}return rows;};
const lPairs=()=>[0,1,2].map(h=>[[449001+h],[449001+h]]).map(([a,b])=>[a[0],b[0]]);

test('scorer GO-V1l on HB-seg3 minus HB-seg1 >= +0.1 with BH/same floors',()=>{
  const rows=lRows();
  const v=scoreTurnGateV1l(rows,lPairs());
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2b,true);
  assert.ok(Math.abs(v.hbConvMean-0.2)<1e-9);
  assert.ok(Math.abs(v.bhSeg3Mean-0.8)<1e-9);
  assert.ok(Math.abs(v.sameSeg3Mean-0.9)<1e-9);
  assert.equal(v.gHbConv,true);
  assert.equal(v.gBhFloor,true);
  assert.equal(v.gSameFloor,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-L-GO');
});

test('scorer NOGO on flat conv / BH breach / same breach; INCOMPLETE / INVALID preserved',()=>{
  const flat=lRows().map(r=>r.tag==='transferred-seg3'
    ?mkRowL('transferred-seg3',r.history.seed,[['A',true,9],['B',true,8],['C',false,5],['D',false,1]]):r);
  const n=scoreTurnGateV1l(flat,lPairs());
  assert.equal(n.go,false);
  assert.equal(n.gHbConv,false);
  assert.equal(n.verdict,'PHASE-L-NOGO');
  const bhBad=lRows().map(r=>r.tag==='transferred-seg3'
    ?mkRowL('transferred-seg3',r.history.seed,[['A',true,9],['B',true,2],['C',false,3],['D',false,1]]):r);
  const n2=scoreTurnGateV1l(bhBad,lPairs());
  assert.equal(n2.go,false);
  assert.equal(n2.gBhFloor,false);
  assert.equal(n2.verdict,'PHASE-L-NOGO');
  const sameBad=lRows().map(r=>r.tag==='transferred-seg3'
    ?mkRowL('transferred-seg3',r.history.seed,[['A',true,1],['B',true,8],['C',false,3],['D',false,9]]):r);
  const n2b=scoreTurnGateV1l(sameBad,lPairs());
  assert.equal(n2b.go,false);
  assert.equal(n2b.gSameFloor,false);
  assert.equal(n2b.verdict,'PHASE-L-NOGO');
  const bad=lRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreTurnGateV1l(bad,lPairs());
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const untrained=lRows().map(r=>r.tag==='train'
    ?mkRowL('train',r.history.seed,[['A',false,1],['B',false,1],['C',false,1]]):r);
  const iu=scoreTurnGateV1l(untrained,lPairs());
  assert.equal(iu.go,false);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  const short=lRows().slice(0,14);
  const sh=scoreTurnGateV1l(short,lPairs());
  assert.equal(sh.go,false);
  assert.equal(sh.verdict,'INVALID');
});

test('flip-split separates same-valence retention from flipped-cue residue (aggregate, descriptive)',()=>{
  const tr=mkRowL('train',449001,[['A',true],['B',false],['C',true]]);
  const te=mkRowL('transferred-lossy',449010,[['A',true,9],['B',true,5],['C',true,9],['D',false,1]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.trainSeed,449001);
  assert.equal(f.testSeed,449010);
  assert.equal(f.same.cues,2);
  assert.equal(f.same.contact,20);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  assert.equal(f.flipped.cues,1);
  assert.equal(f.flipped.contact,10);
  assert.ok(Math.abs(f.flipped.correctness-0.5)<1e-9);
  assert.equal(f.replayed.correctness,+(23/30).toFixed(4));
  assert.equal(f.replayed.cues,3);
  assert.equal(f.same.cues+f.flipped.cues,3);
  assert.equal(mechanismConfirmed(f),true);
  const fEmpty=scoreFlipSplit(mkRowL('train',449001,[['A',true]]),mkRowL('transferred-lossy',449010,[['B',true,5]]));
  assert.equal(fEmpty.same.cues,0);
  assert.equal(fEmpty.flipped.cues,0);
  assert.equal(fEmpty.same.correctness,null);
  assert.equal(fEmpty.flipped.correctness,null);
  assert.equal(fEmpty.replayed.correctness,null);
  assert.equal(mechanismConfirmed(fEmpty),false);
});

test('direction-split partitions BH vs HB with hand-computed values; empty direction null',()=>{
  const tr=mkRowL('train',449001,[['A',true],['B',false],['C',true]]);
  const te=mkRowL('transferred-lossy',449010,[['A',true,9],['B',true,8],['C',false,3]]);
  const f=scoreFlipSplitV1l(tr,te);
  assert.equal(f.flippedBH.cues,1);
  assert.equal(f.flippedBH.contact,10);
  assert.ok(Math.abs(f.flippedBH.correctness-0.8)<1e-9);
  assert.equal(f.flippedHB.cues,1);
  assert.equal(f.flippedHB.contact,10);
  assert.ok(Math.abs(f.flippedHB.correctness-0.7)<1e-9);
  assert.equal(f.flippedBH.cues+f.flippedHB.cues,f.flipped.cues);
  const noHB=scoreFlipSplitV1l(
    mkRowL('train',449001,[['A',true],['B',false]]),
    mkRowL('transferred-lossy',449010,[['A',true,9],['B',true,8]]));
  assert.equal(noHB.flippedHB.cues,0);
  assert.equal(noHB.flippedHB.correctness,null);
  assert.equal(noHB.flippedBH.cues,1);
  const noShared=scoreFlipSplitV1l(
    mkRowL('train',449001,[['A',true]]),
    mkRowL('transferred-seg3',449010,[['B',false,5]]));
  assert.equal(noShared.flippedBH.cues,0);
  assert.equal(noShared.flippedBH.correctness,null);
  assert.equal(noShared.flippedHB.cues,0);
  assert.equal(noShared.flippedHB.correctness,null);
});

test('seg-chain trajectory unit: per-link HB climbs; empty-seg direction fails the conv gate',()=>{
  const tr=mkRowL('train',449001,lTrain(449001));
  const s1=mkRowL('transferred-lossy',449010,lS1(449010));
  const s2=mkRowL('transferred-seg2',449010,lS2(449010));
  const s3=mkRowL('transferred-seg3',449010,lS3(449010));
  const f1=scoreFlipSplitV1l(tr,s1),f2=scoreFlipSplitV1l(tr,s2),f3=scoreFlipSplitV1l(tr,s3);
  assert.ok(Math.abs(f1.flippedHB.correctness-0.5)<1e-9);
  assert.ok(Math.abs(f2.flippedHB.correctness-0.6)<1e-9);
  assert.ok(Math.abs(f3.flippedHB.correctness-0.7)<1e-9);
  assert.ok(Math.abs(f3.flippedHB.correctness-f1.flippedHB.correctness-0.2)<1e-9);
  const rows3=[];
  for(let h=0;h<3;h++){const s=449001+h;
    rows3.push(mkRowL('train',s,lTrain(s)));rows3.push(mkRowL('transferred-lossy',s,lS1(s)));
    rows3.push(mkRowL('transferred-seg2',s,lS2(s)));
    rows3.push(mkRowL('transferred-seg3',s,h===0?[['A',true,9],['B',true,8],['D',false,1]]:lS3(s)));
    rows3.push(mkRowL('unlearned',s,lUnlearn(s)));}
  const v=scoreTurnGateV1l(rows3,lPairs());
  assert.equal(v.flips[0],null);
  assert.equal(v.hbConvMean,null);
  assert.equal(v.gHbConv,false);
  assert.equal(v.go,false);
  assert.equal(v.verdict,'PHASE-L-NOGO');
});

test('mains/probes caps match the frozen 5-arm x 3-pair design (regression: the 12-vs-15 slip)',()=>{
  assert.equal(TL_ARMS.length,5);
  assert.equal(TL_PAIRS.length,3);
  assert.equal(TL_EXPECT_MAINS,15);
  assert.equal(TL_EXPECT_MAINS,TL_ARMS.length*TL_PAIRS.length);
  assert.equal(TL_EXPECT_PROBES,0);
});

test('live bank 449001-449054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V1l bank built cleanly pre-build (tmpdir
  // 54-unique verified at build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=turnGateDevV1lBank('evidence/turn-gated-dev/fresh-13/protocol.json');
  assert.equal(p.experiment,'turn-gated-dev-v1l');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),449001);
  assert.equal(Math.max(...flat),449054);
  for(const s of [381001,395019,396001,407001,414001,418001,444001,447001,448001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'turn-gated-dev-v1l-bank-guard-'));
  assert.throws(()=>turnGateDevV1lBank(join(dir,'protocol.json')),/already used in prior evidence/);
});

test('runner implements the frozen chain (structural source guard; regression for the exact-arm slip)',()=>{
  // The scorer+fixtures are pure; this guards the runner body itself: the
  // 2026-11-02 slip ran an exact arm (tag 'transferred') instead of the
  // seg2/seg3 chain and crashed fail-closed at scoring. Zero worlds (reads
  // the committed instrument file, never runs it).
  const src=readFileSync(new URL('../scripts/turn-gated-dev-v1l.mjs',import.meta.url),'utf8');
  assert.ok(src.includes("tag:'transferred-seg2'"),'missing seg2 chain block');
  assert.ok(src.includes("tag:'transferred-seg3'"),'missing seg3 chain block');
  assert.ok(src.includes('chainSource'), 'missing chain provenance');
  const bareExact=(src.match(/tag:'transferred'/g)||[]).length;
  assert.equal(bareExact,0,'exact-arm tag survived (chain required)');
  assert.ok(src.includes('row.weights=snapshotWeights(run.learners);'),'chain rows must persist weights');
  assert.ok(src.indexOf('// 2. lossy-seg1')<src.indexOf('// 3. seg2'),'chain order: seg1 before seg2');
  assert.ok(src.indexOf('// 3. seg2')<src.indexOf('// 4. seg3'),'chain order: seg2 before seg3');
  assert.ok(src.indexOf('// 4. seg3')<src.indexOf('// 5. unlearned'),'chain order: seg3 before control');
});
