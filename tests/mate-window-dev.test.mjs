// MATE-WINDOW fixtures (implementation freeze gate).
// Synthetic seeds only (900021+); never bank seeds. Bank builder tested
// in tmpdir only (never evidence/). Engine: array-form nutrientOverride.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {TasteExperiment,resolveNutrientOverride} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {MW_SCHEDULE,MW_BAR,MW_ARMS,MW_FIXTURE_SEEDS,MW_SPENT_SEEDS,mateWindowDevBank,scoreMateWindowRows} from '../scripts/mate-window-dev.mjs';

const SYN={seed:900021,cueSeed:900022,resourceSeeds:[900023,900024,900025,900026]};
const mkExp=(nutrientOverride,ticks)=>{const run=new TasteExperiment({history:SYN,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:MW_BAR,verticalTransmission:'maternal',resourceTopology:'hub',nutrientOverride});if(ticks)run.advance(ticks);return run;};

test('resolve: null/scalar/array forms',()=>{
  assert.equal(resolveNutrientOverride(null,0),null);
  assert.equal(resolveNutrientOverride(null,3),null);
  assert.equal(resolveNutrientOverride(5,0),5);
  assert.equal(resolveNutrientOverride(5,2),5);
  assert.equal(resolveNutrientOverride([5,null,null,null],0),5);
  assert.equal(resolveNutrientOverride([5,null,null,null],1),null);
  assert.equal(resolveNutrientOverride([5,null,null,null],3),null);
  assert.equal(resolveNutrientOverride([null,null,5,null],1),null);
  assert.equal(resolveNutrientOverride([null,null,5,null],2),5);
  assert.equal(resolveNutrientOverride([5,5,5,5],3),5);
});

test('validation accepts null/scalar/array, rejects bad',()=>{
  assert.doesNotThrow(()=>mkExp(null));
  assert.doesNotThrow(()=>mkExp(5));
  assert.doesNotThrow(()=>mkExp([5,null,null,null]));
  assert.doesNotThrow(()=>mkExp([null,null,null,null]));
  for(const bad of [6,-1,'x',[5,5,5],[5,5,5,5,5],[6,null,null,null],['x',null,null,null],[null]]){
    assert.throws(()=>mkExp(bad),/nutrientOverride/);
  }
});

test('null path bit-identical (explicit null vs default, 200 ticks)',()=>{
  const a=mkExp(null,200),b=mkExp(undefined,200);
  assert.deepEqual(a.endpoint(),b.endpoint());
});

test('scalar preserved: construct wires 5.0 (zero-tick)',()=>{
  const r=mkExp(5);
  assert.equal(r.world.config.nutrient,5);
});

test('early window differential (600 ticks: phase0=5, phase1=legacy)',()=>{
  const early=mkExp([5,null,null,null]);
  assert.equal(early.world.config.nutrient,5);
  early.advance(600);
  const ctrl=mkExp(null,600);
  assert.equal(early.world.config.nutrient,ctrl.world.config.nutrient);
  assert.equal(early.world.config.nutrient,0.4);
});

test('late window differential (1100 ticks: phase2=5 vs legacy .2)',()=>{
  const late=mkExp([null,null,5,null],1100);
  const ctrl=mkExp(null,1100);
  assert.equal(late.world.config.nutrient,5);
  assert.equal(ctrl.world.config.nutrient,0.2);
});

const mkRow=(arm,seed,births,survivors=20)=>({history:{seed},arm,mode:'maternal',matingDecoupled:true,matingEnergyBar:MW_BAR,resourceTopology:'hub',nutrientOverride:MW_SCHEDULE[arm]==null?null:[...MW_SCHEDULE[arm]],curves:{},phaseRows:[],endpoint:{accountingResidual:1e-9,budgetAdjustedEnergyPerFounder:-30,survivors},births});
const six=(arm,births)=>[1,2,3,4,5,6].map((j,i)=>mkRow(arm,500000+j,Array.isArray(births)?births[i]:births));

test('scorer GO-WINDOW branch',()=>{
  const rows=[...six('control',5),...six('early',9),...six('late',4),...six('full',8)];
  const v=scoreMateWindowRows(rows);
  assert.equal(v.go,true);assert.equal(v.verdict,'GO-WINDOW');
});

test('scorer NOGO-WINDOW + TIMING-REFUTED + INVALID + INCOMPLETE branches',()=>{
  let v=scoreMateWindowRows([...six('control',5),...six('early',5),...six('late',4),...six('full',8)]);
  assert.equal(v.verdict,'NOGO-WINDOW');
  v=scoreMateWindowRows([...six('control',5),...six('early',9),...six('late',10),...six('full',8)]);
  assert.equal(v.verdict,'TIMING-REFUTED');
  v=scoreMateWindowRows([...six('control',5),...six('early',9),...six('late',4),...six('full',2)]);
  assert.equal(v.verdict,'INVALID');
  v=scoreMateWindowRows([...six('control',0),...six('early',0),...six('late',0),...six('full',0)]);
  assert.equal(v.verdict,'INCOMPLETE-NOBIRTHS');
  const bad=[...six('control',5),...six('early',9),...six('late',4),...six('full',8)];
  bad[0].matingEnergyBar=65;
  v=scoreMateWindowRows(bad);
  assert.equal(v.verdict,'INVALID');
});

test('bank builder refuses spent range (post-bank form; 447xxx spent by V2 attempt-02)',()=>{
  const dir=mkdtempSync(join(tmpdir(),'mwbank-guard-'));
  assert.throws(()=>mateWindowDevBank(join(dir,'bank.json')),/already used in prior evidence/);
});

test('spent backstop covers prior banks, excludes own bank',()=>{
  assert.ok(!MW_SPENT_SEEDS.includes(447001));
  assert.ok(!MW_SPENT_SEEDS.includes(447054));
  for(const s of [381001,444001,444054,445001,445054,446001,446054,415001,428001])assert.ok(MW_SPENT_SEEDS.includes(s),`missing ${s}`);
  assert.equal(new Set(MW_FIXTURE_SEEDS).size,54);
});

test('synthetic-row keys conform to runner-row schema',()=>{
  const runnerKeys=['history','arm','mode','matingDecoupled','matingEnergyBar','resourceTopology','nutrientOverride','curves','phaseRows','endpoint','births'];
  const r=mkRow('early',1,5);
  for(const k of Object.keys(r))assert.ok(runnerKeys.includes(k),`synthetic key ${k} not in runner schema`);
});
