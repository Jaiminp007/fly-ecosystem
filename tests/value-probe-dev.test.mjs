// VALUE-PROBE V1 fixtures (8/8 green required before bank build; zero bank worlds).
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {probeCueValues,tastePrediction} from '../learning/taste-energy.mjs';
import {BT_LEARNER_OPTIONS} from '../scripts/body-transfer.mjs';
import {snapshotWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity,
  collectValueProbe,dPrime,scoreValueProbe,valueProbeDevBank,
  VP_FIXTURE_SEEDS,VP_JOIN_MIN,VP_TRAIN_GAP} from '../scripts/value-probe-dev.mjs';

const synthState=()=>({config:{tasteRepresentation:'orthogonal',phaseSlots:1,streams:1},
  weights:{taste:[0.5,-0.4,0.3,0.2,-0.1,0.05,-0.05,0.02,-0.02,0.01,-0.01,0.03,-0.03,0.04,-0.04,0.06]},
  priorLogit:Math.log(3),tasteScale:1,work:{scalarOperations:0},
  feedRngState:1,replayRngState:2,recent:[],older:[],motorPending:null,lastObservedTick:0,lastDecisionTick:0});
const CUES=[[1,1,1,1],[-1,-1,-1,-1],[1,-1,1,-1],[1,1,-1,-1]];

test('probe fidelity: probeCueValues identical to live tastePrediction path',()=>{
  const st=synthState();
  const got=probeCueValues(st,CUES);
  assert.equal(got.length,CUES.length);
  for(let i=0;i<CUES.length;i++){
    const phi=[1,...CUES[i]];
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)phi.push(CUES[i][a]*CUES[i][b]);
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++)phi.push(CUES[i][a]*CUES[i][b]*CUES[i][c]);
    phi.push(CUES[i][0]*CUES[i][1]*CUES[i][2]*CUES[i][3]);
    assert.equal(got[i],tastePrediction(st,phi.map(v=>v*st.tasteScale)));
  }
});

test('probe purity: no weight/RNG/buffer mutation, deterministic, billed only via wrapper',()=>{
  const st=synthState();
  const before=JSON.stringify({w:st.weights,r:[st.feedRngState,st.replayRngState],b:[st.recent,st.older],m:st.motorPending});
  const a=probeCueValues(st,CUES),opsAfterFirst=st.work.scalarOperations;
  const b=probeCueValues(st,CUES);
  assert.deepEqual(a,b);
  assert.equal(JSON.stringify({w:st.weights,r:[st.feedRngState,st.replayRngState],b:[st.recent,st.older],m:st.motorPending}),before);
  assert.ok(opsAfterFirst>0,'probes must bill lawful ops');
});

test('null-default: base learner options carry no probe/gain keys',()=>{
  assert.deepEqual({...BT_LEARNER_OPTIONS},{
    feedingRule:'greedy',tasteRepresentation:'orthogonal',tasteRate:1,
    motorRepresentation:'ecology',holdTicks:1,motorRule:'progress',renewalRate:.1,capacity:32,recent:8,
    replayPasses:4,replayStrata:1,replayRate:1,replayTournament:1,greedyInference:true,criticWarmStart:false,
    tasteLearning:true,normalizeMotor:true,cueBlind:false,consolidationRate:0,motorConsolidationRate:0,
    streams:1,streamHysteresis:0,surpriseGain:0,surpriseWindow:0,phaseSlots:1,slotRate:.05,
    marginWidth:0,marginBoost:0,replaySkip:0,replaySurpriseGain:0,evictBias:0});
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

test('collector bins per-cue per-third turn/contact + intake labels',()=>{
  const c=collectValueProbe();
  const cue='1,1,1,1';
  for(let t=1;t<=1792;t++){
    c.emit({type:'decision',own:{tick:t,agentId:0,cue:[1,1,1,1],contactPresent:true},action:t%2===1?1:0});
    c.emit({type:'physical',agentId:0,tick:t,beneficialEaten:1,harmfulEaten:0});
  }
  const s=c.summarize();
  assert.equal(s.joinRate,1);
  const q=s.cues[cue];
  assert.equal(q.contact,1792);
  assert.equal(q.thirds[0].contact+q.thirds[1].contact+q.thirds[2].contact,1792);
  assert.ok(Math.abs(q.thirds[0].contact-597)<=1&&Math.abs(q.thirds[2].contact-598)<=1);
  assert.equal(q.label,'beneficial');
});

test('dPrime: perfect separation large, chance near zero, empty null',()=>{
  const mk=(nBen,nHarm,vBen,vHarm)=>{const p={};for(let i=0;i<nBen;i++)p[`b${i}`]={valueMean:vBen,label:'beneficial'};for(let i=0;i<nHarm;i++)p[`h${i}`]={valueMean:vHarm,label:'harmful'};return p;};
  const perfect=dPrime(mk(6,6,0.9,0.1));
  assert.ok(perfect.d>2,JSON.stringify(perfect));
  const chance=dPrime(mk(6,6,0.6,0.6));
  assert.ok(Math.abs(chance.d)<0.5,JSON.stringify(chance));
  assert.equal(dPrime(mk(6,0,0.9,0.1)),null);
  assert.equal(dPrime({}),null);
});

const row=(tag,seed,cues,probes,joinRate=1)=>({history:{seed},tag,
  summary:{joinRate,cues},probes});
const cueRow=(turn,contact,label,t3turn=null,t3contact=null)=>({turn,contact,beneficial:label==='beneficial'?contact:0,
  harmful:label==='harmful'?contact:0,pause:0,label,
  thirds:[{turn:0,contact:0},{turn:0,contact:0},{turn:t3turn??turn,contact:t3contact??contact}]});
const BHSET=['1,1,1,1','1,1,1,-1'];
const mkPair=(trSeed,teSeed,{bhValue,bhTurnLate,trainGapOk=true,joinOk=true})=>{
  const trCues={},teCues={},teProbes={};
  for(const c of BHSET){
    trCues[c]=cueRow(1,100,'beneficial');
    teCues[c]=cueRow(bhTurnLate,100,'harmful',bhTurnLate,100);
    teProbes[c]={valueMean:bhValue,label:'harmful'};
  }
  trCues['-1,-1,-1,-1']=cueRow(trainGapOk?90:50,100,'harmful');
  teCues['-1,-1,-1,-1']=cueRow(5,100,'beneficial');
  teProbes['-1,-1,-1,-1']={valueMean:0.9,label:'beneficial'};
  trCues['-1,-1,1,1']=cueRow(5,100,'beneficial');
  const trProbes={};
  for(const c of Object.keys(trCues))trProbes[c]={valueMean:trCues[c].label==='beneficial'?0.9:0.1,label:trCues[c].label};
  const jr=joinOk?1:0.5;
  return [row('train',trSeed,trCues,trProbes,jr),row('transferred',teSeed,teCues,teProbes,jr),
    row('unlearned',teSeed+1000,Object.fromEntries(Object.entries(teCues).map(([k,v])=>[k,{...v,turn:5}])),
      Object.fromEntries(Object.entries(teProbes).map(([k,v])=>[k,{...v,valueMean:0.5}])),jr)];
};

test('scorer ACTOR-SIDE on values-right/behavior-wrong BH; LEARNER-SIDE on values-wrong',()=>{
  // Probe value LOW = predicts harm (correct for test-harmful BH cues).
  // BH behavior late = turn 10/100 = 0.1; value 0.15 -> gap 0.9 ACTOR.
  const rows=[...mkPair(1,10,{bhValue:0.15,bhTurnLate:10}),...mkPair(2,20,{bhValue:0.15,bhTurnLate:10}),...mkPair(3,30,{bhValue:0.15,bhTurnLate:10})];
  const a=scoreValueProbe(rows);
  assert.equal(a.verdict,'VALUE-PROBE-ACTOR-SIDE',JSON.stringify({gap:a.gap,BH:a.BH}));
  assert.ok(a.go);
  // Value 0.85 says benign on harmful cues -> wrong -> LEARNER.
  const rows2=[...mkPair(1,10,{bhValue:0.85,bhTurnLate:80}),...mkPair(2,20,{bhValue:0.85,bhTurnLate:80}),...mkPair(3,30,{bhValue:0.85,bhTurnLate:80})];
  const b=scoreValueProbe(rows2);
  assert.equal(b.verdict,'VALUE-PROBE-LEARNER-SIDE',JSON.stringify({gap:b.gap,BH:b.BH}));
  assert.ok(!b.go);
});

test('scorer INVALID / INDETERMINATE / INCOMPLETE branches',()=>{
  const base=[...mkPair(1,10,{bhValue:0.15,bhTurnLate:60}),...mkPair(2,20,{bhValue:0.15,bhTurnLate:60}),...mkPair(3,30,{bhValue:0.15,bhTurnLate:60})];
  // Dead zone: pooled value 0.667 (>=0.6) with behavior 0.5 -> gap 0.167 (<=0.2) -> INDETERMINATE.
  const mid=[...mkPair(1,10,{bhValue:0.15,bhTurnLate:50}),...mkPair(2,20,{bhValue:0.15,bhTurnLate:50}),...mkPair(3,30,{bhValue:0.85,bhTurnLate:50})];
  assert.equal(scoreValueProbe(mid).verdict,'VALUE-PROBE-INDETERMINATE');
  const untrained=[...mkPair(1,10,{bhValue:0.85,bhTurnLate:80,trainGapOk:false}),...mkPair(2,20,{bhValue:0.85,bhTurnLate:80,trainGapOk:false}),...mkPair(3,30,{bhValue:0.85,bhTurnLate:80,trainGapOk:false})];
  assert.equal(scoreValueProbe(untrained).verdict,'INCOMPLETE-UNTRAINED');
  const badJoin=JSON.parse(JSON.stringify(base));badJoin[0].summary.joinRate=0.5;
  assert.equal(scoreValueProbe(badJoin).verdict,'INVALID');
  const badValid=JSON.parse(JSON.stringify(base));
  for(const r of badValid.filter(x=>x.tag==='train'))for(const k of Object.keys(r.probes))r.probes[k].valueMean=0.4;
  assert.equal(scoreValueProbe(badValid).verdict,'INVALID');
});

test('live bank 421001-421054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-bank form (V1i precedent): the committed bank's seeds are now in
  // prior evidence, so any rebuild throws; the live path returns existing.
  const p=valueProbeDevBank('evidence/value-probe-dev/fresh-01/protocol.json');
  assert.equal(p.experiment,'value-probe-dev');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.ok(flat.includes(421001)&&flat.includes(421054));
  const dir=mkdtempSync(join(tmpdir(),'value-probe-bank-guard-'));
  assert.throws(()=>valueProbeDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
