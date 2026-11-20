// MATE-SOCIAL V1 fixtures (9/9 green required before bank build; zero bank worlds).
// Synthetic rows, temp-dir bank, unit-level generation summary +
// copybest plumbing (mock runs; one short engine run for V1-parity).
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment,syncNewbornLearners,bestFounderLearner} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateSocialDevBank,mateSocialDevSources,scoreMateSocialDevRows,summarizeGenerations,meanGen1Lifespan,MS_NOISE} from '../scripts/mate-social-dev.mjs';

const mkRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,
  mode:arm,matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MS_NOISE[arm],
  endpoint:{budgetAdjustedEnergyPerFounder:-30.0,survivors:20},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2}});

test('scorer GO on copybest gen-2 >= 2 AND copybest > maternal',()=>{
  const seeds=[426001,426010,426019,426028,426037,426046];
  const rows=[...seeds.map(s=>mkRow('maternal',s,2,2,0)),...seeds.map((s,i)=>mkRow('copybest',s,3,3,i<3?1:0))];
  const v=scoreMateSocialDevRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-SOCIAL-GO-V1');
  assert.equal(v.copybestGen2,3);
  assert.equal(v.maternalGen2,0);
});

test('scorer NOGO when copybest fails the bar (below-count, tied, or beaten)',()=>{
  const seeds=[426001,426010,426019,426028,426037,426046];
  const one=[...seeds.map(s=>mkRow('maternal',s,2,2,0)),...seeds.map((s,i)=>mkRow('copybest',s,3,3,i<1?1:0))];
  assert.equal(scoreMateSocialDevRows(one).verdict,'MATE-SOCIAL-NOGO-V1');
  const tied=[...seeds.map(s=>mkRow('maternal',s,2,2,1)),...seeds.map(s=>mkRow('copybest',s,2,2,1))];
  assert.equal(scoreMateSocialDevRows(tied).verdict,'MATE-SOCIAL-NOGO-V1');
  const beaten=[...seeds.map(s=>mkRow('maternal',s,4,4,2)),...seeds.map(s=>mkRow('copybest',s,3,3,1))];
  assert.equal(scoreMateSocialDevRows(beaten).verdict,'MATE-SOCIAL-NOGO-V1');
});

test('scorer INCOMPLETE-NOBIRTHS when copybest gen-1 == 0 (void, not NOGO)',()=>{
  const seeds=[426001,426010,426019,426028,426037,426046];
  const flat=[...seeds.map(s=>mkRow('maternal',s,0,0,0)),...seeds.map(s=>mkRow('copybest',s,0,0,0))];
  assert.equal(scoreMateSocialDevRows(flat).verdict,'INCOMPLETE-NOBIRTHS');
  const voided=[...seeds.map(s=>mkRow('maternal',s,2,2,0)),...seeds.map(s=>mkRow('copybest',s,0,0,0))];
  assert.equal(scoreMateSocialDevRows(voided).verdict,'INCOMPLETE-NOBIRTHS');
});

test('scorer INVALID on audit fail: wrong nutrient/mode/bar, short, bad generations',()=>{
  const seeds=[426001,426010,426019,426028,426037,426046];
  const base=[...seeds.map(s=>mkRow('maternal',s,2,2,0)),...seeds.map((s,i)=>mkRow('copybest',s,3,3,i<3?1:0))];
  assert.equal(scoreMateSocialDevRows(base).verdict,'MATE-SOCIAL-GO-V1');
  const badNut=base.map((r,i)=>i===0?{...r,nutrientOverride:0.4}:r);
  assert.equal(scoreMateSocialDevRows(badNut).verdict,'INVALID');
  const badMode=base.map((r,i)=>i===0?{...r,mode:'none'}:r);
  assert.equal(scoreMateSocialDevRows(badMode).verdict,'INVALID');
  const badBar=base.map((r,i)=>i===6?{...r,matingEnergyBar:65}:r);
  assert.equal(scoreMateSocialDevRows(badBar).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateSocialDevRows(badGen).verdict,'INVALID');
  const short=base.slice(0,11);
  assert.equal(scoreMateSocialDevRows(short).verdict,'INVALID');
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

test('bestFounderLearner: max offspring, ties to lowest id, skips weightless/missing, null when empty',()=>{
  const mkL=(t)=>({weights:{taste:t,actor:[0],critic:[0]},lastObservedTick:0,lastDecisionTick:0,acquisition:true,dead:false,recent:[],older:[],motorPending:null,hold:{cruise:false,remaining:0},config:{},selfMod:null,work:{scalarOperations:0},credit:{tick:0},feedRngState:7});
  const run={founderIds:[3,1,2],founderOffspring:{1:5,2:5,3:2},
    learners:{1:mkL([1]),2:mkL([2]),3:mkL([3])}};
  assert.deepEqual(bestFounderLearner(run).weights.taste,[1]);
  const run2={founderIds:[1,2],founderOffspring:{},learners:{1:mkL([1]),2:mkL([2])}};
  assert.deepEqual(bestFounderLearner(run2).weights.taste,[1]);
  const run3={founderIds:[1,2],founderOffspring:{1:1},learners:{1:{weights:null}}};
  assert.equal(bestFounderLearner(run3),null);
  assert.equal(bestFounderLearner({founderIds:[],founderOffspring:{},learners:{}}),null);
  assert.equal(bestFounderLearner({founderIds:null,founderOffspring:null,learners:{}}),null);
});

test('copybest plumbing: copies best founder (not parent), maternal unchanged, offspring counted + billed',()=>{
  const mkW=(t,a,c)=>({taste:[...t],actor:[...a],critic:[...c]});
  const mkAgent=(w)=>({weights:mkW(...w),lastObservedTick:0,lastDecisionTick:0,
    awaitingObservation:false,acquisition:true,dead:false,recent:[],older:[],
    motorPending:null,hold:{cruise:false,remaining:0},config:{tasteRate:1},selfMod:null,
    work:{scalarOperations:0,liveUpdates:0,replayUpdates:0},credit:{tick:0},feedRngState:7,surpriseEma:0,surpriseTimer:0});
  const mkRun=(mode,extra)=>({world:{tick:100,flies:[{id:9,brainSeed:9,parents:[3,4]}]},
    learners:{3:mkAgent([[1,2,3],[4],[5]]),7:mkAgent([[70],[70],[70]])},
    arm:'candidate',verticalTransmission:mode,history:{seed:426001},founderIds:[3,7],founderOffspring:{3:1,7:9},...extra});
  // maternal: copies parents[0] (id 3), ignores best founder (id 7)
  const rm=mkRun('maternal',{});
  assert.equal(syncNewbornLearners(rm),1);
  assert.deepEqual(rm.learners[9].weights.taste,[1,2,3]);
  assert.deepEqual(rm.founderOffspring,{3:2,4:1,7:9});
  assert.ok(rm.learners[9].work.scalarOperations>=2);
  // copybest: copies best founder (id 7, 9 offspring) even though parent is 3
  const rc=mkRun('copybest',{});
  assert.equal(syncNewbornLearners(rc),1);
  assert.deepEqual(rc.learners[9].weights.taste,[70]);
  assert.deepEqual(rc.founderOffspring,{3:2,4:1,7:9});
  // null-default 'none': zeroed weights (V1-parity), counters still tracked
  const rn=mkRun('none',{});
  assert.equal(syncNewbornLearners(rn),1);
  assert.ok(Array.isArray(rn.learners[9].weights.taste)&&rn.learners[9].weights.taste.every(v=>v===0));
});

test('verticalTransmission accepted incl. copybest; null-default none (engine parity)',()=>{
  const history={seed:900021,cueSeed:900022,resourceSeeds:[900023,900024,900025,900026]};
  const mkE=(vt)=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:vt,nutrientOverride:5});
  assert.equal(mkE('none').verticalTransmission,'none');
  assert.equal(mkE('maternal').verticalTransmission,'maternal');
  assert.equal(mkE('copybest').verticalTransmission,'copybest');
  assert.deepEqual(mkE('copybest').founderOffspring,{});
});

test('live bank cannot be rebuilt (union-exclusion guard, post-bank form)',()=>{
  const p=mateSocialDevBank('evidence/mate-social-dev/fresh-01/protocol.json');
  assert.equal(p.experiment,'mate-social-dev');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.ok(flat.includes(426001)&&flat.includes(426054));
  const dir=mkdtempSync(join(tmpdir(),'mate-social-bank-guard-'));
  assert.throws(()=>mateSocialDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
