// MATE-INHERIT fixtures (G5 gate). Zero bank worlds: synthetic rows, temp-dir
// bank, unit-level inheritance + plumbing checks (no full runs).
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment,syncNewbornLearners} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateInheritDevBank,scoreMateInheritRows} from '../scripts/mate-inherit-dev.mjs';

const mkRow=(arm,seed,births)=>({history:{seed},arm,
  mode:arm==='maternal'?'maternal':'none',matingDecoupled:true,matingEnergyBar:50,
  endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:12},births});

test('scorer GO on inherited-control gap >=+6',()=>{
  const seeds=[405001,405010,405019,405028,405037,405046];
  const rows=[...seeds.map(s=>mkRow('zeroed',s,1)),...seeds.map((s,i)=>mkRow('maternal',s,i<2?5:1))];
  const v=scoreMateInheritRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-INHERIT-GO');
  assert.equal(v.controlTotal,6);
  assert.equal(v.maternalTotal,14);
  assert.equal(v.gap,8);
});

test('scorer NOGO on small gap; INCOMPLETE-NOBIRTHS on zeros; INVALID on audit fail',()=>{
  const seeds=[405001,405010,405019,405028,405037,405046];
  const flat=[...seeds.map(s=>mkRow('zeroed',s,2)),...seeds.map(s=>mkRow('maternal',s,2))];
  const n=scoreMateInheritRows(flat);
  assert.equal(n.go,false);
  assert.equal(n.verdict,'MATE-INHERIT-NOGO');
  const zero=[...seeds.map(s=>mkRow('zeroed',s,0)),...seeds.map(s=>mkRow('maternal',s,0))];
  const nz=scoreMateInheritRows(zero);
  assert.equal(nz.go,false);
  assert.equal(nz.verdict,'INCOMPLETE-NOBIRTHS');
  const bad=flat.map((r,i)=>i===0?{...r,mode:'maternal'}:r);
  const iv=scoreMateInheritRows(bad);
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const short=flat.slice(0,11);
  const is=scoreMateInheritRows(short);
  assert.equal(is.go,false);
  assert.equal(is.verdict,'INVALID');
});

test('inheritance plumbing: maternal copy, zeroed default, fallback without mother',()=>{
  const mkSt=(weights)=>({weights:{taste:[...weights],actor:[0],critic:[0]},
    older:[],recent:[],work:{scalarOperations:0},priorLogit:0,surpriseEma:0,surpriseTimer:0,feedRngState:7,
    config:{tasteRate:1},selfMod:null,dead:false,awaitingObservation:false,lastObservedTick:0,credit:{tick:0}});
  const mother=mkSt([1,2,3]);
  const runM={world:{tick:100,flies:[{id:5,brainSeed:9,parents:[3,4]}]},
    learners:{3:mother},arm:'candidate',verticalTransmission:'maternal',learnerOptions:{...BT_LEARNER_OPTIONS}};
  const n1=syncNewbornLearners(runM);
  assert.equal(n1,1);
  assert.deepEqual(runM.learners[5].weights.taste,[1,2,3]);
  assert.equal(runM.learners[5].lastObservedTick,100);
  assert.equal(runM.learners[5].credit.tick,100);
  const runZ={world:{tick:100,flies:[{id:6,brainSeed:9,parents:[3,4]}]},
    learners:{3:mother},arm:'candidate',verticalTransmission:'none',learnerOptions:{...BT_LEARNER_OPTIONS}};
  const n2=syncNewbornLearners(runZ);
  assert.equal(n2,1);
  assert.ok(runZ.learners[6].weights.taste.every(v=>v===0));
  const runO={world:{tick:100,flies:[{id:7,brainSeed:9,parents:[99,100]}]},
    learners:{},arm:'candidate',verticalTransmission:'maternal',learnerOptions:{...BT_LEARNER_OPTIONS}};
  const n3=syncNewbornLearners(runO);
  assert.equal(n3,1);
  assert.ok(runO.learners[7].weights.taste.every(v=>v===0));
});

test('null-default: maternal flag off behaves identically; bank builds 72-unique',()=>{
  const history={seed:405001,cueSeed:405002,resourceSeeds:[405003,405004,405005,405006]};
  const mk=(extra)=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,...extra});
  const a=mk({verticalTransmission:'maternal'});
  const b=mk({});
  assert.equal(a.verticalTransmission,'maternal');
  assert.equal(b.verticalTransmission,'none');
  for(let t=0;t<200&&!a.finished;t++)a.step();
  for(let t=0;t<200&&!b.finished;t++)b.step();
  assert.deepEqual(Object.keys(a.learners).sort(),Object.keys(b.learners).sort());
});
test('spent bank 405001-405054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-bank-build: the MATE-INHERIT bank built cleanly pre-spend
  // (verified: 6 histories, 54-unique 405001-405054, exclusions incl.
  // 381001/400001/403001/405001) and is now reserved in evidence; the
  // builder must refuse to rebuild it anywhere. Standing rule.
  const dir=mkdtempSync(join(tmpdir(),'mate-inherit-bank-guard-'));
  assert.throws(()=>mateInheritDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
