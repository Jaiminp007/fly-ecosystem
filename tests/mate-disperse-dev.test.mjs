// MATE-DISPERSE V1 fixtures (12/12 green required before bank build; zero bank worlds).
// Synthetic rows mirror the frozen runner schema EXACTLY (V1 lesson)
// + disperse contrast verdicts + scripted placement proof (1-tick mating pair)
// + null-default bit-identity (d=0 == unset) + validation rejects + sources closure
// + temp-dir bank. Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {mateDisperseV1Bank,mateDisperseV1Sources,scoreMateDisperseV1Rows,summarizeGenerations,meanGen1Lifespan,firstMatingTick,MD1_NOISE,MD1_ROW_SCHEMA,MD1_ARM_TOPO,MD1_ARM_D} from '../scripts/mate-disperse-dev.mjs';

// Mirrors the runner's row literal EXACTLY (frozen MD1_ROW_SCHEMA; dispersal varies by arm).
const mkRow=(arm,seed,births,gen1,gen2,fmt=null)=>({history:{seed},arm,mode:MD1_ARM_TOPO[arm],topology:MD1_ARM_TOPO[arm],sense:1,dispersal:MD1_ARM_D[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MD1_NOISE[arm],
  curves:{},phaseRows:null,endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2},
  gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:fmt,centersCount:{spread:3,hub:1}[MD1_ARM_TOPO[arm]]});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('hubDisperse',442001,200,8,3)).sort(),[...MD1_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('hub',442010,200,8,1)).sort(),[...MD1_ROW_SCHEMA].sort());
  assert.deepEqual(Object.keys(mkRow('spread',442019,260,8,0)).sort(),[...MD1_ROW_SCHEMA].sort());
});

test('scorer GO-V1 on the disperse interaction (hubDisperse >= 2 AND hubDisperse > hub; spread descriptive)',()=>{
  const seeds=[442001,442010,442019,442028,442037,442046];
  const rows=[...seeds.map((s,i)=>mkRow('hubDisperse',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  const v=scoreMateDisperseV1Rows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-DISPERSE-GO-V1');
  assert.equal(v.hubDisperseGen2,4);
  assert.equal(v.hubGen2,0);
});

test('scorer keys verdict on the disperse pair, not the anchor',()=>{
  const seeds=[442001,442010,442019,442028,442037,442046];
  const flat=[...seeds.map(s=>mkRow('hubDisperse',s,200,8,1)),...seeds.map(s=>mkRow('hub',s,200,8,1)),
    ...seeds.map(s=>mkRow('spread',s,200,8,9))];
  assert.equal(scoreMateDisperseV1Rows(flat).verdict,'MATE-DISPERSE-NOGO-V1');
  const inv=[...seeds.map(s=>mkRow('hubDisperse',s,200,8,0)),...seeds.map(s=>mkRow('hub',s,200,8,3)),
    ...seeds.map(s=>mkRow('spread',s,200,8,0))];
  assert.equal(scoreMateDisperseV1Rows(inv).verdict,'MATE-DISPERSE-NOGO-V1');
  const low=[...seeds.map((s,i)=>mkRow('hubDisperse',s,200,8,i<1?1:0)),...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,5))];
  assert.equal(scoreMateDisperseV1Rows(low).verdict,'MATE-DISPERSE-NOGO-V1');
});

test('scorer INCOMPLETE-NOBIRTHS when hubDisperse gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[442001,442010,442019,442028,442037,442046];
  const flat=[...seeds.map(s=>mkRow('hubDisperse',s,0,0,0)),...seeds.map(s=>mkRow('hub',s,200,8,2)),
    ...seeds.map(s=>mkRow('spread',s,200,8,3))];
  assert.equal(scoreMateDisperseV1Rows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail incl. wrong dispersal, geography',()=>{
  const seeds=[442001,442010,442019,442028,442037,442046];
  const base=[...seeds.map((s,i)=>mkRow('hubDisperse',s,200,8,i<2?2:0)),
    ...seeds.map(s=>mkRow('hub',s,200,8,0)),
    ...seeds.map(s=>mkRow('spread',s,200,8,1))];
  assert.equal(scoreMateDisperseV1Rows(base).verdict,'MATE-DISPERSE-GO-V1');
  const badDisp=base.map((r,i)=>i===0?{...r,dispersal:0}:r);
  assert.equal(scoreMateDisperseV1Rows(badDisp).verdict,'INVALID');
  const badDisp2=base.map((r,i)=>i===6?{...r,dispersal:0.5}:r);
  assert.equal(scoreMateDisperseV1Rows(badDisp2).verdict,'INVALID');
  const badGeo=base.map((r,i)=>i===6?{...r,centersCount:3}:r);
  assert.equal(scoreMateDisperseV1Rows(badGeo).verdict,'INVALID');
  const badTopo=base.map((r,i)=>i===0?{...r,mode:'spread'}:r);
  assert.equal(scoreMateDisperseV1Rows(badTopo).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===6?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateDisperseV1Rows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateDisperseV1Rows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateDisperseV1Rows(short).verdict,'INVALID');
});

test('firstMatingTick: min gen-1 born; null when none; skips parentless/gen-0/non-integer',()=>{
  const lineage=[
    {id:1,generation:0,parents:[],born:0},{id:2,generation:0,parents:[],born:0},
    {id:3,generation:1,parents:[],born:50},
    {id:4,generation:1,parents:[1,2],born:200},{id:5,generation:1,parents:[1,2],born:100},
    {id:6,generation:2,parents:[4,5],born:90}];
  assert.equal(firstMatingTick(lineage),100);
  assert.equal(firstMatingTick([{id:1,generation:0,parents:[],born:0}]),null);
  assert.equal(firstMatingTick([]),null);
});

test('summarizeGenerations + meanGen1Lifespan (incl. censored survivors)',()=>{
  const lineage=[
    {id:1,generation:0,parents:[]},{id:2,generation:0,parents:[]},
    {id:3,generation:1,parents:[1,2],born:100,died:200},{id:4,generation:1,parents:[1,2],born:110,died:null},
    {id:5,generation:2,parents:[3,4],born:210,died:300}];
  const s=summarizeGenerations(lineage);
  assert.equal(s.maxGeneration,2);
  assert.deepEqual(s.byGeneration,{1:2,2:1});
  assert.equal(s.gen1,2);
  assert.equal(s.gen2,1);
  const L=meanGen1Lifespan(lineage,1792);
  assert.equal(L.n,2);
  assert.equal(L.censored,1);
});

// Scripted placement proof: one mature pair, adjacent, 1 tick. d=0/unset newborn
// lands at the mating midpoint; d=1 lands uniform in the founder box [50,950)x[50,590).
const mkPair=(extra)=>{
  const H={seed:442001,cueSeed:442002,resourceSeeds:[442003,442004,442005,442006],probeSeeds:{A:442007,B:442008,transfer:442009}};
  const ref={...VALUE_REFERENCE,founders:2};
  const run=new TasteExperiment({history:H,arm:'candidate',reference:ref,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1,...extra});
  const [a,b]=run.world.flies;
  for(const f of [a,b]){f.energy=120;f.age=100;f.cooldown=0;}
  a.x=400;a.y=300;b.x=410;b.y=300;
  return run;
};
const newbornPos=(run)=>{
  let t=0;while(run.world.totals.births===0&&t<200){run.advance(1);t++;}
  assert.ok(run.world.totals.births>0,'scripted pair must mate');
  const kid=run.world.flies.reduce((m,f)=>f.id>m.id?f:m);
  return [kid.x,kid.y];
};

test('scripted placement proof: d=0 lands at midpoint; d=1 lands in-box uniform (seeded)',()=>{
  const [x0,y0]=newbornPos(mkPair({}));
  const [x1,y1]=newbornPos(mkPair({natalDispersal:0}));
  assert.ok(Math.abs(x0-405)<2&&Math.abs(y0-300)<2,'unset newborn lands at mating midpoint (moves during tick)');
  assert.equal(x1,x0,'explicit d=0 identical to unset (null default)');
  assert.equal(y1,y0);
  const [x2,y2]=newbornPos(mkPair({natalDispersal:1}));
  assert.ok(x2>=50&&x2<950&&y2>=50&&y2<590,'d=1 newborn lands inside the founder box');
  assert.ok(Math.hypot(x2-405,y2-300)>25,'d=1 newborn is far from the midpoint (dispersed, not philopatric)');
  const [x3,y3]=newbornPos(mkPair({natalDispersal:1}));
  assert.equal(x3,x2,'d=1 deterministic on fixed seeds (dedicated RNG)');
  assert.equal(y3,y2);
  const [x4,y4]=newbornPos(mkPair({natalDispersal:0.5}));
  assert.ok(x4>=50&&x4<950&&y4>=50&&y4<590,'d=0.5 newborn in box (gate fires on this seed)');
  const [x5,y5]=newbornPos(mkPair({natalDispersal:0.5}));
  assert.equal(x5,x4,'d=0.5 deterministic on fixed seeds');
  assert.equal(y5,y4);
});

test('null-default bit-identity: d=0 run == no-flag run (JSON-normalized)',()=>{
  const H={seed:442001,cueSeed:442002,resourceSeeds:[442003,442004,442005,442006],probeSeeds:{A:442007,B:442008,transfer:442009}};
  const mkActs=(extra)=>{const acts=[];const run=new TasteExperiment({history:H,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:e=>{if(e.type==='decision'&&e.own)acts.push([e.own.tick,e.own.agentId,e.action]);},reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1,...extra});run.advance(48);return {acts,run};};
  const base=mkActs({});
  const zero=mkActs({natalDispersal:0});
  const norm=o=>JSON.parse(JSON.stringify(o));
  assert.deepEqual(norm(zero.acts),norm(base.acts));
  const ops=r=>{let n=0;for(const id of Object.keys(r.run.learners))n+=(r.run.learners[id].work?.scalarOperations??0);return n;};
  assert.equal(ops(zero),ops(base));
});

test('validation rejects out-of-range dispersal (frozen [0,1])',()=>{
  const H={seed:442001,cueSeed:442002,resourceSeeds:[442003,442004,442005,442006],probeSeeds:{A:442007,B:442008,transfer:442009}};
  const mk=x=>new TasteExperiment({history:H,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1,natalDispersal:x});
  assert.throws(()=>mk(1.5),/natalDispersal|Invalid natal/);
  assert.throws(()=>mk(-0.1),/natalDispersal|Invalid natal/);
  assert.throws(()=>mk(NaN),/natalDispersal|Invalid natal/);
  assert.doesNotThrow(()=>mk(0));
  assert.doesNotThrow(()=>mk(1));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateDisperseV1Sources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-disperse-dev.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']);
});

test('post-bank guard: 442001-442054 spent (rebuild refuses)',()=>{
  // Bank fresh-01 is BUILT (evidence/mate-disperse-dev/fresh-01/); the spent-bank
  // guard must now refuse any rebuild touching 442001-442054. Pre-bank this test
  // built 54-unique in tmp and verified rebuild-refusal (12/12 green at freeze).
  const dir=mkdtempSync(join(tmpdir(),'mate-disperse-v1-bank-'));
  assert.throws(()=>mateDisperseV1Bank(join(dir,'protocol.json')),/already used/);
});
