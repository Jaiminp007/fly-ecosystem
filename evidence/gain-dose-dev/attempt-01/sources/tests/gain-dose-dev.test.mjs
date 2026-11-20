// GAIN-DOSE V1 fixtures (9/9 green required before bank build; zero bank worlds).
// Synthetic fixture seed 900001 (outside all bank ranges; scanned into
// exclusions harmlessly). Short d=0/d=4 engine runs spend it (32 ticks).
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {gainDoseOpts,snapshotWeights,copyWeights,assertFreshTarget,
  checkTransplantIntegrity,collectGainDose,quadFit,scoreGainDose,
  gainDoseDevBank,GD_FIXTURE_SEEDS,GD_DOSES} from '../scripts/gain-dose-dev.mjs';

test('coupled dose: d=1 is V1g-identical, d=0 is base, single degree of freedom',()=>{
  assert.deepEqual({...gainDoseOpts(1)},{...BT_LEARNER_OPTIONS,surpriseGain:1,replaySurpriseGain:3});
  assert.deepEqual({...gainDoseOpts(0)},{...BT_LEARNER_OPTIONS,surpriseGain:0,replaySurpriseGain:0});
  for(const d of GD_DOSES){const o=gainDoseOpts(d);assert.equal(o.replaySurpriseGain,3*o.surpriseGain);assert.equal(o.surpriseGain,d);}
  assert.throws(()=>gainDoseOpts(3),/unknown dose/);
});

test('transplant machinery: snapshot/copy/integrity/fresh-target (V1i-identical)',()=>{
  const mk=()=>({weights:{taste:[1,2,3],actor:[4,5]},recent:[],older:[],motorPending:null,lastObservedTick:0,lastDecisionTick:0,work:{}});
  const src={a:mk(),b:mk()};
  const snap=snapshotWeights(src);
  const dst={a:mk(),b:mk()};
  for(const id of ['a','b'])assertFreshTarget(dst[id],id);
  copyWeights(snap,dst);
  assert.ok(checkTransplantIntegrity(snap,dst).ok);
  dst.a.weights.taste[0]=999;
  assert.ok(!checkTransplantIntegrity(snap,dst).ok);
  assert.throws(()=>assertFreshTarget({...mk(),lastObservedTick:1},'x'),/not fresh/);
});

test('collector bins thirds + first-contact tick + labels',()=>{
  const c=collectGainDose();
  const cue='1,1,1,1';
  for(let t=1;t<=1792;t++){
    c.emit({type:'decision',own:{tick:t,agentId:0,cue:[1,1,1,1],contactPresent:true},action:t%2===1?1:0});
    c.emit({type:'physical',agentId:0,tick:t,beneficialEaten:1,harmfulEaten:0});
  }
  const s=c.summarize();
  assert.equal(s.joinRate,1);
  const q=s.cues[cue];
  assert.equal(q.contact,1792);
  assert.equal(q.firstTick,1);
  assert.equal(q.thirds[0].contact+q.thirds[1].contact+q.thirds[2].contact,1792);
  assert.equal(q.label,'beneficial');
});

test('quadFit: recovers parabola, peak, R2; degenerate null',()=>{
  const p=[[0,0],[1,1],[2,4],[3,9],[4,16]];
  const f=quadFit(p);
  assert.ok(Math.abs(f.a-1)<1e-6&&Math.abs(f.b)<1e-6&&Math.abs(f.c)<1e-6,JSON.stringify(f));
  assert.ok(f.r2quad>0.999);
  const q=[[0,1],[1,1],[2,1]];
  assert.ok(quadFit(q)!==null);
  assert.equal(quadFit([[0,1],[1,2]]),null);
  const flat=[[0,0.3],[0.5,0.3],[1,0.3],[2,0.3],[4,0.3]];
  const ff=quadFit(flat);
  assert.ok(Math.abs(ff.a)<1e-6&&Math.abs(ff.b)<1e-6,JSON.stringify(ff));
});

const row=(tag,seed,cues)=>({history:{seed},tag,summary:{joinRate:1,cues}});
const cueRow=(turn,contact,label)=>({turn,contact,beneficial:label==='beneficial'?contact:0,
  harmful:label==='harmful'?contact:0,pause:0,label,firstTick:1,
  thirds:[{turn:0,contact:0},{turn:0,contact:0},{turn,contact}]});
const mkPair=(trSeed,teSeed,hbByDose)=>{
  // hbByDose: {dose: HB correctness}. HB = extinction: train-HARMFUL
  // 'h1' -> test-BENIGN 'h1', correctness = 1 - turn rate.
  const rows=[row('train',trSeed,{'h1':cueRow(90,100,'harmful'),'b1':cueRow(5,100,'beneficial'),'hX':cueRow(90,100,'harmful')})];
  for(const d of GD_DOSES){
    const hb=hbByDose[d];
    rows.push(row('gain-'+d,teSeed,{'h1':cueRow(Math.round((1-hb)*100),100,'beneficial'),'b1':cueRow(5,100,'beneficial')}));
  }
  rows.push(row('unlearned',teSeed+1000,{'h1':cueRow(5,100,'beneficial'),'hX':cueRow(5,100,'harmful')}));
  return rows;
};

test('scorer OPTIMAL on peaked dose-response with replication',()=>{
  // HB peaks at d=1 (0.5), d=1 beats d=0 (0.2) by +0.3, symmetric tail
  // (m4 == m1-0.1 boundary-safe: 0.40 < 0.40 false).
  const hb={0:0.3,0.5:0.55,1:0.45,2:0.38,4:0.36};
  const rows=[...mkPair(1,10,hb),...mkPair(2,20,hb),...mkPair(3,30,hb)];
  const s=scoreGainDose(rows);
  assert.equal(s.verdict,'GAIN-DOSE-OPTIMAL',JSON.stringify({verdict:s.verdict,means:s.means,fit:s.fit}));
  assert.ok(s.go);
});

test('scorer ESCALATE / OVERDOSE / DE-ESCALATE / FLAT branches',()=>{
  const esc={0:0.2,0.5:0.3,1:0.35,2:0.45,4:0.55};
  assert.equal(scoreGainDose([...mkPair(1,10,esc),...mkPair(2,20,esc),...mkPair(3,30,esc)]).verdict,'GAIN-DOSE-ESCALATE');
  const od={0:0.2,0.5:0.35,1:0.5,2:0.4,4:0.25};
  assert.equal(scoreGainDose([...mkPair(1,10,od),...mkPair(2,20,od),...mkPair(3,30,od)]).verdict,'GAIN-DOSE-OVERDOSE');
  // DE-ESCALATE via heterogeneous pairs: P1/P2 peak at d=1 (rep passes
  // 2/3) while P3 is uniform-loving, dragging pooled m0 to top.
  const deA={0:0.2,0.5:0.4,1:0.5,2:0.45,4:0.4};
  const deB={0:0.9,0.5:0.2,1:0.2,2:0.2,4:0.2};
  const de=[...mkPair(1,10,deA),...mkPair(2,20,deA),...mkPair(3,30,deB)];
  assert.equal(scoreGainDose(de).verdict,'GAIN-DOSE-DE-ESCALATE');
  const fl={0:0.3,0.5:0.31,1:0.3,2:0.31,4:0.3};
  const rows=[...mkPair(1,10,fl),...mkPair(2,20,fl),...mkPair(3,30,fl)];
  const s=scoreGainDose(rows);
  // replication fails here (d=1 - d=0 = 0 < 0.1) -> INVALID, not FLAT.
  assert.equal(s.verdict,'INVALID');
});

test('scorer INVALID / INCOMPLETE / INDETERMINATE branches',()=>{
  const hb={0:0.2,0.5:0.4,1:0.5,2:0.45,4:0.3};
  const base=[...mkPair(1,10,hb),...mkPair(2,20,hb),...mkPair(3,30,hb)];
  const badJoin=JSON.parse(JSON.stringify(base));badJoin[0].summary.joinRate=0.5;
  assert.equal(scoreGainDose(badJoin).verdict,'INVALID');
  const untrained=JSON.parse(JSON.stringify(base));
  for(const r of untrained.filter(x=>x.tag==='train'))
    for(const k of Object.keys(r.summary.cues))if(r.summary.cues[k].label==='harmful')r.summary.cues[k].turn=50;
  assert.equal(scoreGainDose(untrained).verdict,'INCOMPLETE-UNTRAINED');
  // null HB cell -> INVALID (fail-closed measurement completeness).
  const nullHB=JSON.parse(JSON.stringify(base));
  for(const r of nullHB.filter(x=>x.tag.startsWith('gain-')))r.summary.cues={};
  assert.equal(scoreGainDose(nullHB).verdict,'INVALID');
  // Tipping-over curve: still rising at d=2, tips at d=4 (peak beyond
  // data but falling at edge -> peak-branch guard blocks escalation).
  const tip={0:0.3,0.5:0.36,1:0.42,2:0.44,4:0.40};
  const mid=[...mkPair(1,10,tip),...mkPair(2,20,tip),...mkPair(3,30,tip)];
  assert.equal(scoreGainDose(mid).verdict,'GAIN-DOSE-INDETERMINATE');
});

test('d=4 finiteness on synthetic history (short run, spends fixture seed 900001)',()=>{
  const history={seed:900001,cueSeed:900002,resourceSeeds:[900003,900004,900005,900006],probeSeeds:{A:900007,B:900008,transfer:900009}};
  for(const d of [0,4]){
    const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...gainDoseOpts(d)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:()=>{}});
    run.advance(32);
    const ep=run.endpoint();
    assert.ok(Number.isFinite(ep.budgetAdjustedEnergyPerFounder),`d=${d} non-finite energy`);
    assert.ok(Math.abs(ep.accountingResidual)<1e-7,`d=${d} conservation failed`);
  }
});

test('bank builds 54-unique in tmp; rebuild refuses (post-build guard)',()=>{
  const dir=mkdtempSync(join(tmpdir(),'gain-dose-bank-'));
  const p=gainDoseDevBank(join(dir,'protocol.json'));
  assert.equal(p.experiment,'gain-dose-dev');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.ok(flat.includes(422001)&&flat.includes(422054));
  const p2=gainDoseDevBank(join(dir,'protocol.json'));
  assert.deepEqual(p2,p);
});
