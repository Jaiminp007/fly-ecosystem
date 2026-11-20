// BRAKE-LIFT V1 fixtures (9/9 green required before bank build; zero bank worlds).
// Synthetic fixture seeds 900003-900011 (outside all bank ranges; scanned
// into exclusions harmlessly — never drawn, banks are 423xxx).
import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {brakeDoseOpts,snapshotWeights,copyWeights,assertFreshTarget,
  checkTransplantIntegrity,collectBrakeLift,brakeInitFromTrain,liPartial,
  scoreBrakeLift,brakeLiftDevBank,brakeLiftDevSources,BL_FIXTURE_SEEDS,BL_DOSES,BL_C0} from '../scripts/brake-lift-dev.mjs';

const synthHistory=(s)=>({seed:s,cueSeed:s+1,resourceSeeds:[s+2,s+3,s+4,s+5],probeSeeds:{A:s+6,B:s+7,transfer:s+8}});

test('brake options: uniform is base; doses couple flag+C0+decay',()=>{
  assert.deepEqual({...brakeDoseOpts('uniform')},{...BT_LEARNER_OPTIONS});
  for(const [tag,dec] of [['brake-nolift',0],['brake-slow',0.0007],['brake-fast',0.0035]]){
    const o=brakeDoseOpts(tag);
    assert.equal(o.assocBrake,true);assert.equal(o.assocC0,BL_C0);assert.equal(o.assocDecay,dec);
  }
  assert.throws(()=>brakeDoseOpts('brake-x'),/unknown brake arm/);
});

test('transplant machinery: snapshot/copy/integrity/fresh-target',()=>{
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

test('brake init from train contacts: min(0.8, contact/C0), missing cues 0',()=>{
  const init=brakeInitFromTrain({'1,1,1,1':{contact:1000},'-1,-1,-1,-1':{contact:3000},'1,-1,1,-1':{contact:0}});
  assert.equal(init['1,1,1,1'],0.5);
  assert.equal(init['-1,-1,-1,-1'],0.8);
  assert.ok(!('1,-1,1,-1' in init));
});

test('collector bins thirds + firstTick + labels',()=>{
  const c=collectBrakeLift();
  for(let t=1;t<=1792;t++){
    c.emit({type:'decision',own:{tick:t,agentId:0,cue:[1,1,1,1],contactPresent:true},action:t%2===1?1:0});
    c.emit({type:'physical',agentId:0,tick:t,beneficialEaten:1,harmfulEaten:0});
  }
  const s=c.summarize();
  assert.equal(s.joinRate,1);
  const q=s.cues['1,1,1,1'];
  assert.equal(q.contact,1792);
  assert.equal(q.firstTick,1);
  assert.equal(q.thirds[0].contact+q.thirds[1].contact+q.thirds[2].contact,1792);
  assert.equal(q.label,'beneficial');
});

test('liPartial: recovers sign and nulls on degenerate input',()=>{
  const mk=(tc,ec,co)=>tc.map((t,i)=>({tc:Math.log(t),ec:Math.log(ec[i]),corr:co[i]}));
  // perfect train-driven gradient, test-contact independent
  const p=mk([100,200,400,800,1600],[500,520,480,510,490],[0.1,0.2,0.3,0.4,0.5]);
  const r=liPartial(p);
  assert.ok(r>0.99,JSON.stringify(r));
  assert.equal(liPartial([{tc:1,ec:1,corr:0.5}]),null);
  assert.equal(liPartial(mk([100,100],[500,500],[0.3,0.3])),null);
});

const row=(tag,seed,cues,brakeInit)=>({history:{seed},tag,summary:{joinRate:1,cues},brakeInit:brakeInit||null});
const cueRow=(turn,contact,label)=>({turn,contact,beneficial:label==='beneficial'?contact:0,
  harmful:label==='harmful'?contact:0,pause:0,label,firstTick:1,
  thirds:[{turn:0,contact:0},{turn:0,contact:0},{turn,contact}]});
const mkPair=(trSeed,teSeed,hbByDose)=>{
  const rows=[row('train',trSeed,{'h1':cueRow(90,100,'harmful'),'b1':cueRow(5,100,'beneficial'),'hX':cueRow(90,100,'harmful')})];
  for(const d of ['uniform','brake-nolift','brake-slow','brake-fast']){
    const hb=hbByDose[d];
    rows.push(row(d,teSeed,{'h1':cueRow(Math.round((1-hb)*100),100,'beneficial'),'b1':cueRow(5,100,'beneficial')}));
  }
  rows.push(row('unlearned',teSeed+1000,{'h1':cueRow(5,100,'beneficial'),'hX':cueRow(5,100,'harmful')}));
  return rows;
};
// HB correctness = 1 - turn on train-harmful->test-benign 'h1'.

test('scorer BRAKE-GO on lifted fast arm with biting nolift',()=>{
  const hb={uniform:0.3,'brake-nolift':0.15,'brake-slow':0.32,'brake-fast':0.45};
  const rows=[...mkPair(1,10,hb),...mkPair(2,20,hb),...mkPair(3,30,hb)];
  const s=scoreBrakeLift(rows);
  assert.equal(s.verdict,'BRAKE-GO',JSON.stringify({v:s.verdict,means:s.means}));
  assert.ok(s.go);
  assert.ok(s.manipOk!==false);
});

test('scorer NOGO / INVALID / INCOMPLETE branches',()=>{
  const hb={uniform:0.3,'brake-nolift':0.15,'brake-slow':0.32,'brake-fast':0.33};
  const rows=[...mkPair(1,10,hb),...mkPair(2,20,hb),...mkPair(3,30,hb)];
  assert.equal(scoreBrakeLift(rows).verdict,'BRAKE-NOGO');
  // nolift fails to undercut uniform -> INVALID (brake doesn't bite).
  const flat={uniform:0.3,'brake-nolift':0.29,'brake-slow':0.3,'brake-fast':0.32};
  const rows2=[...mkPair(1,10,flat),...mkPair(2,20,flat),...mkPair(3,30,flat)];
  assert.equal(scoreBrakeLift(rows2).verdict,'INVALID');
  const badJoin=JSON.parse(JSON.stringify(rows));badJoin[0].summary.joinRate=0.5;
  assert.equal(scoreBrakeLift(badJoin).verdict,'INVALID');
  const untrained=JSON.parse(JSON.stringify(rows));
  for(const r of untrained.filter(x=>x.tag==='train'))
    for(const k of Object.keys(r.summary.cues))if(r.summary.cues[k].label==='harmful')r.summary.cues[k].turn=50;
  assert.equal(scoreBrakeLift(untrained).verdict,'INCOMPLETE-UNTRAINED');
});

test('null-default bit-identity + exact billing on synthetic history (900003)',()=>{
  const history=synthHistory(900003);
  const mk=(opts)=>{const acts=[];const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...opts},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},
    emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);}});run.advance(32);return {run,acts};};
  const base=mk(BT_LEARNER_OPTIONS);
  const nulled=mk({...BT_LEARNER_OPTIONS,assocBrake:false});
  // Full decision-trajectory identity (every tick, every agent, every action).
  assert.deepEqual(nulled.acts,base.acts);
  const eBase=base.run.endpoint(),eNull=nulled.run.endpoint();
  assert.ok(Number.isFinite(eBase.budgetAdjustedEnergyPerFounder)&&Number.isFinite(eNull.budgetAdjustedEnergyPerFounder));
  assert.ok(Math.abs(eBase.accountingResidual)<1e-7&&Math.abs(eNull.accountingResidual)<1e-7);
  // Exact billing audit: identical live-update counts and identical ops
  // (null path bills the same +=3 without changing behavior).
  const liveOf=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.tasteLiveUpdates??0);return n;};
  const opsOf=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(liveOf(base),liveOf(nulled));
  assert.equal(opsOf(base),opsOf(nulled));
  const bw=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.brakeUpdates??0);return n;};
  assert.equal(bw(base),0);assert.equal(bw(nulled),0);
  // Enabled brake run: brakeUpdates fire, energies finite.
  const en=mk({...BT_LEARNER_OPTIONS,assocBrake:true,assocC0:2000,assocDecay:0.0035});
  assert.ok(Number.isFinite(en.run.endpoint().budgetAdjustedEnergyPerFounder));
  assert.ok(bw(en)>0);
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=brakeLiftDevSources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/brake-lift-dev.mjs']&&s['learning/taste-energy.mjs']);
});

test('live bank cannot be rebuilt (union-exclusion guard, post-bank form)',()=>{
  const live='evidence/brake-lift-dev/fresh-01/protocol.json';
  const p=brakeLiftDevBank(live);
  assert.equal(p.experiment,'brake-lift-dev');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.ok(flat.includes(423001)&&flat.includes(423054));
  const dir=mkdtempSync(join(tmpdir(),'bank-guard-'));
  assert.throws(()=>brakeLiftDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
