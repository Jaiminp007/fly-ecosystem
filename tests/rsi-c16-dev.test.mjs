// RSI C16 fixtures (16/16 green required before bank build; zero bank worlds).
// Synthetic learners/rows only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {copyWeights,checkTransplantIntegrity,checkScaledIntegrity,scaleSnapshot,snapshotWeights,assertFreshTarget,scoreFlipSplitV1m,
  computeCauseVote,negateHistory,scoreRsiC16,turnGateDevC16Sources,
  C16_EXPECT_MAINS,C16_EXPECT_PROBES,C16_ARMS,C16_PAIRS,C16_SEGS,C16_K,C16_GAP_LIFT,C16_LOSSY_ALPHA,C16_VOTE_TICK} from '../scripts/rsi-c16-dev.mjs';
import {applyCuePermute} from '../learning/taste-experiment.mjs';

const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({agentId:1,weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaiting:true,acquisition:true,dead:false,recent:[],older:[],
  motorPending:null,hold:{cruise:false,remaining:0},...extra});
const snap=a=>snapshotWeights(a);

test('transplant copies weights exactly; rejects id/shape mismatch',()=>{
  const src=snap({1:mkAgent([[1,2],[3,4],[5,6]]),2:mkAgent([[7,8],[9,0],[11,12]])});
  const dst={1:mkAgent([[0,0],[0,0],[0,0]]),2:mkAgent([[0,0],[0,0],[0,0]])};
  assert.equal(copyWeights(src,dst).transferred,2);
  assert.deepEqual(dst[1].weights,{taste:[1,2],actor:[3,4],critic:[5,6]});
  assert.throws(()=>copyWeights(snap({1:mkAgent([[1],[2],[3]])}),dst),/mismatch/);
});

test('fresh-target contract: fresh passes, every stale field fails',()=>{
  assert.doesNotThrow(()=>assertFreshTarget(mkAgent([[0],[0],[0]]),'1'));
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
  assert.deepEqual(scaleSnapshot(src,C16_LOSSY_ALPHA),{1:{taste:[0.5,1],actor:[1.5,2],critic:[2.5,3]}});
  assert.equal(C16_LOSSY_ALPHA,0.25);
  assert.throws(()=>scaleSnapshot(src,NaN),/finite/);
});

test('scaled-integrity is alpha-exact at 0.25',()=>{
  const src=snap({1:mkAgent([[2,4],[6,8],[10,12]])});
  const good={1:mkAgent([[0,0],[0,0],[0,0]])};
  copyWeights(scaleSnapshot(src,0.25),good);
  assert.equal(checkScaledIntegrity(src,good,0.25).ok,true);
  assert.equal(checkScaledIntegrity(src,good,0.5).ok,false);
});

test('negate mode flips every valence; balanced counts swap; pure; rejects bad mode',()=>{
  const cb={A:[{id:1,valence:1},{id:2,valence:1},{id:3,valence:-1},{id:4,valence:-1}]};
  const neg=applyCuePermute(cb,'negate');
  assert.deepEqual(neg.A.map(c=>c.valence),[-1,-1,1,1]);
  const before=JSON.stringify(cb);
  applyCuePermute(cb,'negate');
  assert.equal(JSON.stringify(cb),before);
  assert.throws(()=>applyCuePermute(cb,'flip'),/unknown cuePermute/);
});

test('cause vote: L math +1/-2, K=8 boundary, switch-once direction, empty null-safe',()=>{
  const mkSeg=specs=>({cues:Object.fromEntries(specs.map(([cue,label,turn,contact])=>[cue,{contact,turn,label}]))});
  const allSurprise=mkSeg([['A','beneficial',9,10],['B','harmful',1,10]]);
  const v1=computeCauseVote(allSurprise);
  assert.equal(v1.confirming,2);
  assert.equal(v1.surprising,18);
  assert.equal(v1.L,2-36);
  assert.equal(v1.switch,true);
  const allConfirm=mkSeg([['A','beneficial',1,10],['B','harmful',9,10]]);
  const v2=computeCauseVote(allConfirm);
  assert.equal(v2.L,18-4);
  assert.equal(v2.switch,false);
  const boundary=mkSeg([['A','beneficial',8,10]]);
  const v3=computeCauseVote(boundary);
  assert.equal(v3.L,-16+2);
  assert.equal(v3.L,-14);
  assert.equal(v3.switch,true);
  const above=mkSeg([['A','beneficial',4,10]]);
  const v4=computeCauseVote(above);
  assert.equal(v4.L,6-8);
  assert.equal(v4.switch,false);
  const exact=mkSeg([['A','beneficial',4,4]]);
  const v5=computeCauseVote(exact);
  assert.equal(v5.L,-8);
  assert.equal(v5.switch,true);
  const empty=computeCauseVote({cues:{}});
  assert.equal(empty.L,0);
  assert.equal(empty.switch,false);
});

test('negateHistory derives deterministically; base history uncontaminated',()=>{
  const h={seed:471001,cueSeed:471002,resourceSeeds:[471003,471004,471005,471006],probeSeeds:{A:471007,B:471008,transfer:471009}};
  const n=negateHistory(h);
  assert.equal(n.seed,h.seed);
  assert.equal(n.interpretFlip,true);
  assert.ok(!('interpretFlip' in h));
  assert.deepEqual({...n,interpretFlip:undefined},{...h,interpretFlip:undefined});
});

// C16 synthetic rows: train gap 0.7; switch HB 0.8 both legs; static HB 0.6;
// copied HB 0.6 (G2b +0.2); BH 0.8 all; same 0.9; unlearned flat.
const mkRowC=(tag,seed,specs)=>({tag,history:{seed},
  summary:{joinRate:1,
    cues:Object.fromEntries(specs.map(([cue,harm,turn])=>[cue,{contact:10,pause:2,turn:turn??(harm?8:1),
      beneficial:harm?1:9,harmful:harm?9:1,label:harm?'harmful':'beneficial'}]))}});
const cTrain=s=>[['A',true,8],['B',false,1],['C',true,8],['D',false,1]];
const cSwitch=s=>[['A',true,9],['B',true,8],['C',false,2],['D',false,1]];
const cStatic=s=>[['A',true,9],['B',true,8],['C',false,4],['D',false,1]];
const cCopied=s=>[['A',true,9],['B',true,8],['C',false,4],['D',false,1]];
const cUnlearn=s=>[['A',true,5],['B',false,5],['C',true,5],['D',false,5]];
const cRows=()=>{const rows=[];for(let ch=0;ch<2;ch++){const tr=471001+ch*27;
  rows.push(mkRowC('train',tr,cTrain(tr)));
  for(const te of [tr+9,tr+18]){const suf=te===tr+9?'T1':'T2';
    rows.push(mkRowC(`switch-${suf}`,te,cSwitch(te)));rows.push(mkRowC(`static-${suf}`,te,cStatic(te)));}
  rows.push(mkRowC('copied-T1',tr+9,cCopied(tr+9)));
  rows.push(mkRowC('exact-switch-T1',tr+9,cSwitch(tr+9)));
  rows.push(mkRowC('unlearned',tr+9,cUnlearn(tr+9)));}return rows;};
const cPairs=()=>[[471001,471010,471019],[471028,471037,471046]];

test('scorer C16-GO on successive +0.2 lifts both legs with copied isolation',()=>{
  const v=scoreRsiC16(cRows(),cPairs());
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.equal(v.g2bFlat,true);
  assert.ok(Math.abs(v.liftT1-0.2)<1e-9);
  assert.ok(Math.abs(v.liftT2-0.2)<1e-9);
  assert.ok(Math.abs(v.copiedGap-0.2)<1e-9);
  assert.equal(v.g2a,true);
  assert.equal(v.g2b,true);
  assert.equal(v.g2c,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'C16-GO');
});

test('scorer NOGO when T2 lift misses; direction guard fails on BH degradation',()=>{
  const flat=cRows().map(r=>r.tag==='switch-T2'
    ?mkRowC(r.tag,r.history.seed,[['A',true,9],['B',true,8],['C',false,4],['D',false,1]]):r);
  const n=scoreRsiC16(flat,cPairs());
  assert.equal(n.go,false);
  assert.equal(n.g2a,false);
  assert.equal(n.verdict,'C16-NOGO');
  const bhBad=cRows().map(r=>r.tag==='switch-T1'
    ?mkRowC(r.tag,r.history.seed,[['A',true,9],['B',true,2],['C',false,2],['D',false,1]]):r);
  const n2=scoreRsiC16(bhBad,cPairs());
  assert.equal(n2.go,false);
  assert.equal(n2.g2c,false);
  assert.equal(n2.verdict,'C16-NOGO');
});

test('scorer INVALID/INCOMPLETE preserved; copied-equality fails G2b',()=>{
  const bad=cRows().map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  assert.equal(scoreRsiC16(bad,cPairs()).verdict,'INVALID');
  const untrained=cRows().map(r=>r.tag==='train'
    ?mkRowC('train',r.history.seed,[['A',false,1],['B',false,1],['C',false,1]]):r);
  assert.equal(scoreRsiC16(untrained,cPairs()).verdict,'INCOMPLETE-UNTRAINED');
  const short=cRows().slice(0,15);
  assert.equal(scoreRsiC16(short,cPairs()).verdict,'INVALID');
  const noIsolation=cRows().map(r=>r.tag==='switch-T1'
    ?mkRowC(r.tag,r.history.seed,[['A',true,9],['B',true,8],['C',false,4],['D',false,1]]):r);
  const ni=scoreRsiC16(noIsolation,cPairs());
  assert.equal(ni.copiedGap,0);
  assert.equal(ni.g2b,false);
  assert.equal(ni.go,false);
  assert.equal(ni.verdict,'C16-NOGO');
});

test('flip-split + direction-split reuse on C16 8-arm rows; exact-switch leg scores',()=>{
  const tr=mkRowC('train',471001,[['A',true],['B',false],['C',true]]);
  const te=mkRowC('switch-T1',471010,[['A',true,9],['B',true,8],['C',false,2]]);
  const f=scoreFlipSplitV1m(tr,te);
  assert.equal(f.flippedHB.cues,1);
  assert.ok(Math.abs(f.flippedHB.correctness-0.8)<1e-9);
  const ex=mkRowC('exact-switch-T1',471010,[['A',true,9],['B',true,8],['C',false,2]]);
  const fx=scoreFlipSplitV1m(tr,ex);
  assert.ok(Math.abs(fx.flippedHB.correctness-0.8)<1e-9);
});

test('mains/probes caps match the frozen 8-tag x 2-chain design; segs sum to BT_TICKS',()=>{
  assert.equal(C16_ARMS.length,8);
  assert.equal(C16_PAIRS.length,2);
  assert.deepEqual(C16_PAIRS,[ [0,1,2],[3,4,5] ]);
  assert.equal(C16_EXPECT_MAINS,16);
  assert.equal(C16_EXPECT_MAINS,C16_ARMS.length*C16_PAIRS.length);
  assert.equal(C16_EXPECT_PROBES,0);
  assert.deepEqual([...C16_SEGS],[1024,768]);
  assert.equal(C16_SEGS.reduce((a,c)=>a+c,0),1792);
  assert.equal(C16_K,8);
  assert.equal(C16_VOTE_TICK,1024);
});

test('spent ranges cover through 470xxx; fresh-32 471001-471054 excluded from spent',async ()=>{
  const {C16_SPENT_SEEDS,C16_FIXTURE_SEEDS}=await import('../scripts/rsi-c16-dev.mjs');
  const spent=new Set(C16_SPENT_SEEDS);
  for(const s of [381001,470001,470054,469001])assert.ok(spent.has(s),`missing spent seed ${s}`);
  for(const s of C16_FIXTURE_SEEDS)assert.ok(!spent.has(s),`fresh seed ${s} already spent`);
  assert.equal(C16_FIXTURE_SEEDS.length,54);
  assert.equal(Math.min(...C16_FIXTURE_SEEDS),471001);
  assert.equal(Math.max(...C16_FIXTURE_SEEDS),471054);
});

test('exact-switch wound probe rows carry switch provenance (voteL + switched flag)',()=>{
  const rows=cRows();
  const ex=rows.find(r=>r.tag==='exact-switch-T1');
  assert.ok(ex);
  assert.equal(ex.history.seed,471010);
  const f=scoreFlipSplitV1m(rows.find(r=>r.tag==='train'),ex);
  assert.ok(Math.abs(f.flippedHB.correctness-0.8)<1e-9);
});

test('runner implements the cause-gated two-segment panel (structural guard)',async ()=>{
  const {C16_VOTE_TICK:VT}=await import('../scripts/rsi-c16-dev.mjs');
  assert.equal(VT,1024);
  const src=readFileSync(new URL('../scripts/rsi-c16-dev.mjs',import.meta.url),'utf8');
  assert.ok(src.includes('computeCauseVote('),'missing cause-vote call');
  assert.ok(src.includes('negateHistory(hTe)'),'missing negated-history branch');
  assert.ok(src.includes("gate==='copied'"),'copied flag-isolation branch missing');
  assert.ok(src.includes('C16_SEGS[0]')&&src.includes('C16_SEGS[1]'),'two-segment ticks not parameterized');
  assert.ok(src.includes('C16_LOSSY_ALPHA'),'fixed-alpha lossy transplant missing');
  assert.ok(!src.includes('TM_ALPHAS'),'alpha-panel remnant (C16 fixes a single alpha)');
  assert.ok(src.includes('exact-switch-T1'),'exact wound-probe arm missing');
});
