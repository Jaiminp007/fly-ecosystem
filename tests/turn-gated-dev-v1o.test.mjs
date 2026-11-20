// TURN-GATED V1o fixtures (12/12 green required before bank build; zero bank worlds).
// Synthetic learners/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {copyWeights,checkTransplantIntegrity,checkScaledIntegrity,digestWeights,scaleSnapshot,snapshotWeights,assertFreshTarget,scoreFlipSplit,scoreFlipSplitV1m,mechanismConfirmed,
  pseudoHistory,scoreTurnGateV1o,turnGateDevV1oBank,turnGateDevV1oSources,
  TO_EXPECT_MAINS,TO_EXPECT_PROBES,TO_ARMS,TO_PAIRS,TO_THIRDS,TO_LOSSY_ALPHA,TO_GAP_LIFT} from '../scripts/turn-gated-dev-v1o.mjs';
import {applyCuePermute} from '../learning/taste-experiment.mjs';

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
  assert.throws(()=>copyWeights(snap({1:mkAgent([[1],[2],[3]])}),dst),/founder id mismatch/);
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
  assert.equal(checkTransplantIntegrity(src,good).ok,true);
  const wrong={1:mkAgent([[9,9],[9,9],[9,9]])};
  copyWeights(src,wrong);
  wrong[1].weights.taste=[0,0];
  assert.equal(checkTransplantIntegrity(src,wrong).ok,false);
});

test('scaleSnapshot scales by fixed 0.25; rejects bad alpha',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  assert.deepEqual(scaleSnapshot(src,TO_LOSSY_ALPHA),{1:{taste:[0.5,1],actor:[1.5,2],critic:[2.5,3]}});
  assert.equal(TO_LOSSY_ALPHA,0.25);
  assert.throws(()=>scaleSnapshot(src,NaN),/finite/);
});

test('scaled-integrity is alpha-exact at 0.25',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  const good={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(scaleSnapshot(src,0.25),good);
  assert.equal(checkScaledIntegrity(src,good,0.25).ok,true);
  assert.equal(checkScaledIntegrity(src,good,0.5).ok,false);
});

test('applyCuePermute: reverse flips, rotate shifts, counts preserved, pure',()=>{
  const cb={A:[{id:1,valence:1},{id:2,valence:1},{id:3,valence:-1},{id:4,valence:-1}]};
  const rev=applyCuePermute(cb,'reverse');
  assert.deepEqual(rev.A.map(c=>c.valence),[-1,-1,1,1]);
  const rot=applyCuePermute(cb,'rotate');
  assert.deepEqual(rot.A.map(c=>c.valence),[-1,1,1,-1]);
  assert.notDeepEqual(rot.A.map(c=>c.valence),rev.A.map(c=>c.valence));
  const before=JSON.stringify(cb);
  applyCuePermute(cb,'reverse');
  assert.equal(JSON.stringify(cb),before);
  assert.throws(()=>applyCuePermute(cb,'shuffle'),/unknown cuePermute/);
});

test('pseudo-validation: scheme deterministic, counts preserved, A2/A3/A distinct, B-flip convention intact',()=>{
  const h={seed:470001,cueSeed:470002,resourceSeeds:[470003,470004,470005,470006],probeSeeds:{A:470007,B:470008,transfer:470009}};
  const a2=pseudoHistory(h,'reverse'),a3=pseudoHistory(h,'rotate');
  assert.equal(a2.seed,h.seed);
  assert.equal(a2.cuePermute,'reverse');
  assert.equal(a3.cuePermute,'rotate');
  assert.deepEqual({...a2,cuePermute:undefined},{...h,cuePermute:undefined});
  const cb={F:[{id:1,valence:1},{id:2,valence:1},{id:3,valence:-1},{id:4,valence:-1}]};
  const count=xs=>xs.filter(c=>c.valence===1).length;
  assert.equal(count(applyCuePermute(cb,'reverse').F),count(cb.F));
  assert.equal(count(applyCuePermute(cb,'rotate').F),count(cb.F));
  assert.notDeepEqual(applyCuePermute(cb,'reverse').F.map(c=>c.valence),cb.F.map(c=>c.valence));
  assert.ok(!('cuePermute' in h),'pseudo flag must not leak into the base history');
});

// V1o synthetic rows: train gaps 0.7 both; transferred-single HB 0.45,
// transferred-multi HB 0.6 (lift +0.15 >= +0.1, 3/3 non-degraded); BH 0.8; same 0.9.
const mkRowO=(tag,seed,specs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
const oTrain=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const oSingle=s=>[['A',true,9],['B',true,8],['C',false,3],['D',false,1]];
const oMulti=s=>[['A',true,9],['B',true,8],['C',false,4],['D',false,1]];
const oUnlearn=s=>[['A',true,5],['B',true,5],['C',false,5],['D',false,5]];
const oRows=()=>{const rows=[];for(let h=0;h<3;h++){const s=470001+h;
  rows.push(mkRowO('train-single',s,oTrain(s)));rows.push(mkRowO('train-multi',s,oTrain(s)));
  rows.push(mkRowO('transferred-single',s,oSingle(s)));rows.push(mkRowO('transferred-multi',s,oMulti(s)));
  rows.push(mkRowO('unlearned',s,oUnlearn(s)));}return rows;};
const oPairs=()=>[0,1,2].map(h=>[[470001+h],[470001+h]]).map(([a,b])=>[a[0],b[0]]);

test('scorer NOGO-V1o when multi underperforms single (negative lift misses +0.1)',()=>{
  const v=scoreTurnGateV1o(oRows(),oPairs());
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2b,true);
  assert.ok(Math.abs(v.hbSingle-0.7)<1e-9);
  assert.ok(Math.abs(v.hbMulti-0.6)<1e-9);
  assert.ok(Math.abs(v.lift-(-0.1))<1e-9);
  assert.equal(v.nonDegraded,0);
  assert.equal(v.g2a,false);
  assert.equal(v.go,false);
  assert.equal(v.verdict,'PHASE-O-NOGO');
});

test('scorer GO-V1o on true lift; NOGO/INVALID/INCOMPLETE preserved',()=>{
  const liftRows=oRows().map(r=>r.tag==='transferred-multi'
    ?mkRowO(r.tag,r.history.seed,[['A',true,9],['B',true,8],['C',false,1],['D',false,1]]):r);
  const v=scoreTurnGateV1o(liftRows,oPairs());
  assert.ok(Math.abs(v.lift-0.2)<1e-9);
  assert.equal(v.nonDegraded,3);
  assert.equal(v.g2a,true);
  assert.equal(v.gBhFloor,true);
  assert.equal(v.gSameFloor,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'PHASE-O-GO');
  const bad=oRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  assert.equal(scoreTurnGateV1o(bad,oPairs()).verdict,'INVALID');
  const untrained=oRows().map(r=>r.tag==='train-multi'
    ?mkRowO('train-multi',r.history.seed,[['A',false,1],['B',false,1],['C',false,1]]):r);
  assert.equal(scoreTurnGateV1o(untrained,oPairs()).verdict,'INCOMPLETE-UNTRAINED');
  const short=oRows().slice(0,14);
  assert.equal(scoreTurnGateV1o(short,oPairs()).verdict,'INVALID');
});

test('flip-split + direction-split reuse on V1o 5-arm rows; empty direction null',()=>{
  const tr=mkRowO('train-single',470001,[['A',true],['B',false],['C',true]]);
  const te=mkRowO('transferred-multi',470010,[['A',true,9],['B',true,8],['C',false,4]]);
  const f=scoreFlipSplit(tr,te);
  assert.equal(f.same.cues,1);
  assert.equal(f.flipped.cues,2);
  assert.ok(Math.abs(f.same.correctness-0.9)<1e-9);
  assert.ok(Math.abs(f.flipped.correctness-0.7)<1e-9);
  const d=scoreFlipSplitV1m(tr,te);
  assert.equal(d.flippedBH.cues,1);
  assert.equal(d.flippedHB.cues,1);
  assert.ok(Math.abs(d.flippedHB.correctness-0.6)<1e-9);
  assert.equal(mechanismConfirmed(f),true);
});

test('mains/probes caps match the frozen 5-arm x 3-pair design; thirds sum to BT_TICKS',()=>{
  assert.equal(TO_ARMS.length,5);
  assert.equal(TO_PAIRS.length,3);
  assert.equal(TO_EXPECT_MAINS,15);
  assert.equal(TO_EXPECT_MAINS,TO_ARMS.length*TO_PAIRS.length);
  assert.equal(TO_EXPECT_PROBES,0);
  assert.deepEqual([...TO_THIRDS],[597,597,598]);
  assert.equal(TO_THIRDS.reduce((a,c)=>a+c,0),1792);
  assert.equal(TO_GAP_LIFT,0.1);
});

test('runner implements the train panel (structural guard)',()=>{
  const src=readFileSync(new URL('../scripts/turn-gated-dev-v1o.mjs',import.meta.url),'utf8');
  assert.ok(src.includes('pseudoHistory(history,'),'missing pseudo-history construction');
  assert.ok(src.includes('TO_THIRDS[si]'),'missing thirds-parameterized training loop');
  assert.ok(src.includes("tag==='train-multi'"),'train-multi arm missing');
  assert.ok(src.includes('TO_LOSSY_ALPHA'),'fixed-alpha lossy transplant missing');
  assert.ok(!src.includes('TM_ALPHAS'),'alpha-panel remnant (V1o fixes a single alpha)');
  assert.ok(src.includes('transferred-multi'),'transferred-multi arm missing');
});
