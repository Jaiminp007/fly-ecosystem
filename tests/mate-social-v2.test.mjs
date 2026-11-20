// MATE-SOCIAL V2 fixtures (14/14 green required before bank build; zero bank worlds).
// Synthetic rows + synthetic-run sync unit tests + scripted TasteExperiment checks.
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment,syncNewbornLearners,bestFounderLearner} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {mateSocialV2Bank,mateSocialV2Sources,scoreMateSocialV2Rows,summarizeGenerations,meanGen1Lifespan,MS2_NOISE,MS2_ARM_TX} from '../scripts/mate-social-v2.mjs';

// Mirrors the runner's row literal EXACTLY (frozen schema + per-arm transmission; V1 + transmission field).
const mkRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,mode:arm,transmission:MS2_ARM_TX[arm],
  matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MS2_NOISE[arm],
  endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2}});

test('synthetic rows conform to the frozen runner schema (V1 lesson)',()=>{
  assert.deepEqual(Object.keys(mkRow('copycond',443001,200,8,3)).sort(),['arm','births','endpoint','generations','history','matingDecoupled','matingEnergyBar','mode','nutrientOverride','transmission','transmissionNoise']);
});

test('scorer GO-V2 on copycond gen-2 >= 2 AND copycond > maternal (copyalways descriptive)',()=>{
  const seeds=[443001,443010,443019,443028,443037,443046];
  const rows=[...seeds.map((s,i)=>mkRow('copycond',s,200,8,i<2?2:0)),...seeds.map(s=>mkRow('copyalways',s,200,8,0)),...seeds.map(s=>mkRow('maternal',s,200,8,0))];
  const v=scoreMateSocialV2Rows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-SOCIAL-GO-V2');
  assert.equal(v.copycondGen2,4);
  assert.equal(v.maternalGen2,0);
});

test('scorer NOGO when copycond fails the bar, ties, or trails (copyalways outcome ignored)',()=>{
  const seeds=[443001,443010,443019,443028,443037,443046];
  const flat=[...seeds.map(s=>mkRow('copycond',s,200,8,1)),...seeds.map(s=>mkRow('copyalways',s,200,8,1)),...seeds.map(s=>mkRow('maternal',s,200,8,1))];
  assert.equal(scoreMateSocialV2Rows(flat).verdict,'MATE-SOCIAL-NOGO-V2');
  const low=[...seeds.map((s,i)=>mkRow('copycond',s,200,8,i<1?1:0)),...seeds.map(s=>mkRow('copyalways',s,200,8,0)),...seeds.map(s=>mkRow('maternal',s,200,8,0))];
  assert.equal(scoreMateSocialV2Rows(low).verdict,'MATE-SOCIAL-NOGO-V2');
  const split=[...seeds.map(s=>mkRow('copycond',s,200,8,0)),...seeds.map(s=>mkRow('copyalways',s,200,8,2)),...seeds.map(s=>mkRow('maternal',s,200,8,0))];
  const sv=scoreMateSocialV2Rows(split);
  assert.equal(sv.go,false);
  assert.equal(sv.verdict,'MATE-SOCIAL-NOGO-V2');
});

test('scorer INCOMPLETE-NOBIRTHS when copycond gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[443001,443010,443019,443028,443037,443046];
  const flat=[...seeds.map(s=>mkRow('copycond',s,0,0,0)),...seeds.map(s=>mkRow('copyalways',s,200,8,2)),...seeds.map(s=>mkRow('maternal',s,200,8,0))];
  assert.equal(scoreMateSocialV2Rows(flat).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail: wrong mode/transmission/bar, bad generations, short',()=>{
  const seeds=[443001,443010,443019,443028,443037,443046];
  const base=[...seeds.map((s,i)=>mkRow('copycond',s,200,8,i<2?2:0)),...seeds.map(s=>mkRow('copyalways',s,200,8,0)),...seeds.map((s,i)=>mkRow('maternal',s,200,8,i<1?1:0))];
  assert.equal(scoreMateSocialV2Rows(base).verdict,'MATE-SOCIAL-GO-V2');
  const badTx=base.map((r,i)=>i===0?{...r,transmission:'maternal'}:r);
  assert.equal(scoreMateSocialV2Rows(badTx).verdict,'INVALID');
  const badMode=base.map((r,i)=>i===6?{...r,mode:'copybest'}:r);
  assert.equal(scoreMateSocialV2Rows(badMode).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===12?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateSocialV2Rows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateSocialV2Rows(badGen).verdict,'INVALID');
  const short=base.slice(0,17);
  assert.equal(scoreMateSocialV2Rows(short).verdict,'INVALID');
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

// --- copyconditional unit tests: synthetic runs, no bank ---

const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
const mkAgent=(w,extra={})=>({weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
  awaiting:false,acquisition:true,dead:false,recent:[],older:[],
  motorPending:null,hold:{cruise:false,remaining:0},...extra});
// Newborn defaults to maiden mother id 3 + father id 4 (V1 lineage shape).
const mkRun=(vt,fo,learners,lastSuccess,withParents=[3,4])=>({world:{tick:100,lastSuccessBirth:lastSuccess,
  flies:[{id:9,parents:withParents,brainSeed:9}]},
  learners,founderIds:Object.keys(learners).map(Number),founderOffspring:{...fo},
  arm:'candidate',verticalTransmission:vt,transmissionNoise:null,history:{seed:443001}});

test('conditional gate: maiden copies most-recent donor; proven mother keeps maternal',()=>{
  // Last success: pair (7,8); donor 7 has more offspring -> donor 7.
  const base={3:mkAgent([[1,2],[3],[4]]),7:mkAgent([[70],[70],[70]]),8:mkAgent([[80],[80],[80]])};
  const last={tick:42,parentIds:[7,8]};
  // maiden mother (id 3, 0 prior + this birth = 1 <= 1) copies donor 7
  const r1=mkRun('copyconditional',{3:0,7:5,8:1},{...base},last);
  assert.equal(syncNewbornLearners(r1),1);
  assert.deepEqual(r1.learners[9].weights.taste,[70]);
  // proven mother (id 3 already has 4) keeps maternal copy despite donor
  const r2=mkRun('copyconditional',{3:4,7:5,8:1},{...base},last);
  assert.equal(syncNewbornLearners(r2),1);
  assert.deepEqual(r2.learners[9].weights.taste,[1,2]);
});

test('fallback chain: no prior success -> parental; invalid donor -> other parent; all-invalid -> as-created',()=>{
  const base={3:mkAgent([[1,2],[3],[4]]),7:mkAgent([[70],[70],[70]])};
  const r1=mkRun('copyconditional',{3:0,7:0},{...base},null,[3,4]);
  assert.equal(syncNewbornLearners(r1),1);
  assert.deepEqual(r1.learners[9].weights.taste,[1,2]);
  // donor 7 missing entirely AND donor 99 missing -> other parent (8) missing -> parental
  const r2={world:{tick:100,lastSuccessBirth:{tick:42,parentIds:[7,99]}},arm:'candidate',verticalTransmission:'copyconditional',transmissionNoise:null,
    history:{seed:443001},founderIds:[3,7,99],founderOffspring:{3:0,7:0,99:3},
    learners:{3:mkAgent([[1,2],[3],[4]])}};
  r2.world.flies=[{id:9,parents:[3,4],brainSeed:9}];
  assert.equal(syncNewbornLearners(r2),1);
  assert.deepEqual(r2.learners[9].weights.taste,[1,2]);
  // all-invalid incl. mother (no learner for parents[0]) -> as-created zeroed weights
  const r3={world:{tick:100,lastSuccessBirth:{tick:42,parentIds:[7,8]}},arm:'candidate',verticalTransmission:'copyconditional',transmissionNoise:null,
    history:{seed:443001},founderIds:[7,8],founderOffspring:{3:0,7:1,8:1},learners:{}};
  r3.world.flies=[{id:9,parents:[3,4],brainSeed:9}];
  assert.equal(syncNewbornLearners(r3),1);
  assert.ok(Array.isArray(r3.learners[9].weights.taste)&&r3.learners[9].weights.taste.every(v=>v===0));
});

test('recency wins over lifetime total: most-recent pair supplies the donor',()=>{
  // Pair (11,12) is the LATEST success; donor with more offspring between them is 12 (1 vs 0).
  // Lifetime-best founder 7 (100 offspring from long ago) must NOT win.
  const learners={3:mkAgent([[1],[1],[1]]),7:mkAgent([[70],[70],[70]]),11:mkAgent([[110],[110],[110]]),12:mkAgent([[120],[120],[120]])};
  const r=mkRun('copyconditional',{3:0,7:100,11:0,12:1},{...learners},{tick:99,parentIds:[11,12]});
  assert.equal(syncNewbornLearners(r),1);
  assert.deepEqual(r.learners[9].weights.taste,[120]);
  // tie 1 vs 1 -> lower id wins
  const learners2={3:mkAgent([[1],[1],[1]]),21:mkAgent([[210],[210],[210]]),22:mkAgent([[220],[220],[220]])};
  const r2=mkRun('copyconditional',{3:0,21:1,22:1},{...learners2},{tick:99,parentIds:[21,22]});
  assert.equal(syncNewbornLearners(r2),1);
  assert.deepEqual(r2.learners[9].weights.taste,[210]);
});

test('deterministic + no new billed ops vs the maternal path',()=>{
  const mk=()=>mkRun('copyconditional',{3:0,7:5,8:1},
    {3:mkAgent([[1,2],[3],[4]]),7:mkAgent([[70],[70],[70]]),8:mkAgent([[80],[80],[80]])},
    {tick:42,parentIds:[7,8]});
  const a=mk(),b=mk();
  assert.equal(syncNewbornLearners(a),1);
  assert.equal(syncNewbornLearners(b),1);
  assert.deepEqual(a.learners[9].weights,b.learners[9].weights);
  assert.equal(a.learners[9].work.scalarOperations,b.learners[9].work.scalarOperations);
  // same setup under maternal bills identically (founderOffspring counting only; copy is free in both)
  const m={world:{tick:100,lastSuccessBirth:null},arm:'candidate',verticalTransmission:'maternal',transmissionNoise:null,
    history:{seed:443001},founderIds:[3,7,8],founderOffspring:{3:0,7:5,8:1},
    learners:{3:mkAgent([[1,2],[3],[4]]),7:mkAgent([[70],[70],[70]]),8:mkAgent([[80],[80],[80]])}};
  m.world.flies=[{id:9,parents:[3,4],brainSeed:9}];
  assert.equal(syncNewbornLearners(m),1);
  assert.equal(m.learners[9].work.scalarOperations,a.learners[9].work.scalarOperations);
});

test('verticalTransmission accepts copyconditional; null-default none (engine parity)',()=>{
  const history={seed:900021,cueSeed:900022,resourceSeeds:[900023,900024,900025,900026]};
  const mkE=(vt)=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:vt,nutrientOverride:5});
  assert.equal(mkE('none').verticalTransmission,'none');
  assert.equal(mkE('maternal').verticalTransmission,'maternal');
  assert.equal(mkE('copybest').verticalTransmission,'copybest');
  assert.equal(mkE('copyconditional').verticalTransmission,'copyconditional');
  assert.deepEqual(mkE('copyconditional').founderOffspring,{});
  assert.throws(()=>mkE('copycat'),/verticalTransmission/);
});

test('checkpoint round-trips lastSuccessBirth (V4 restore-recompute lesson)',()=>{
  const history={seed:443001,cueSeed:443002,resourceSeeds:[443003,443004,443005,443006],probeSeeds:{A:443007,B:443008,transfer:443009}};
  const ref={...VALUE_REFERENCE,founders:2};
  const mk=()=>new TasteExperiment({history,arm:'candidate',reference:ref,learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,nutrientOverride:5,resourceTopology:'hub',mateSenseMultiplier:1});
  const r=mk();
  const [a,b]=r.world.flies;
  for(const f of [a,b]){f.energy=120;f.age=100;f.cooldown=0;}
  a.x=400;a.y=300;b.x=410;b.y=300;
  let t=0;while(r.world.totals.births===0&&t<200){r.advance(1);t++;}
  assert.ok(r.world.totals.births>0,'scripted mating must produce a birth');
  assert.ok(r.world.lastSuccessBirth&&Number.isInteger(r.world.lastSuccessBirth.tick));
  const cp=r.checkpoint();
  const norm=o=>JSON.parse(JSON.stringify(o));
  const r2=TasteExperiment.restore(norm(cp));
  assert.deepEqual(norm(r2.world.lastSuccessBirth),norm(r.world.lastSuccessBirth));
});

test('sources closure resolves inside repo (import-path regression guard)',()=>{
  const s=mateSocialV2Sources();
  assert.ok(Object.keys(s).length>10);
  assert.ok(s['scripts/mate-social-v2.mjs']&&s['learning/taste-energy.mjs']&&s['learning/taste-experiment.mjs']&&s['docs/MATE_SOCIAL_PLAN_V2.md']);
});

test('live bank 443001-443054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the V2 bank built cleanly pre-build (14/14 green
  // incl. temp-dir 54-unique build) and is now live in evidence; the builder
  // must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=mateSocialV2Bank('evidence/mate-social-dev/fresh-02/protocol.json');
  assert.equal(p.experiment,'mate-social-v2');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),443001);
  assert.equal(Math.max(...flat),443054);
  for(const s of [381001,395019,396001,407001,414001,426001,443001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'mate-social-v2-bank-guard-'));
  assert.throws(()=>mateSocialV2Bank(join(dir,'protocol.json')),/already used in prior evidence/);
});
