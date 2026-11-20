// MATE-DENSE fixtures (G5 gate). Zero bank worlds: synthetic rows, temp-dir
// bank, short-run plumbing checks (200 ticks, no mating possible either way).
// Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateDenseDevBank,scoreMateDenseRows,MD_FOUNDERS} from '../scripts/mate-dense-dev.mjs';

const mkRow=(arm,seed,births)=>({history:{seed},arm,
  founders:MD_FOUNDERS[arm],matingDecoupled:true,
  endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:12},births});

test('scorer GO on dense births; GO with sparse-only births + interpretation',()=>{
  const seeds=[403001,403010,403019,403028];
  const goRows=[...seeds.map((s,i)=>mkRow('decoupled24',s,0)),...seeds.map((s,i)=>mkRow('decoupled72',s,i===0?2:0))];
  const v=scoreMateDenseRows(goRows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-DENSE-GO');
  assert.equal(v.decoupled72Total,2);
  assert.equal(v.decoupled24Total,0);
  const sparseRows=[...seeds.map((s,i)=>mkRow('decoupled24',s,i===2?1:0)),...seeds.map(s=>mkRow('decoupled72',s,0))];
  const vs=scoreMateDenseRows(sparseRows);
  assert.equal(vs.go,true);
  assert.ok(vs.interpretation.includes('bank luck'));
});

test('scorer NOGO on zero both; INVALID on bad config',()=>{
  const seeds=[403001,403010,403019,403028];
  const flat=[...seeds.map(s=>mkRow('decoupled24',s,0)),...seeds.map(s=>mkRow('decoupled72',s,0))];
  const n=scoreMateDenseRows(flat);
  assert.equal(n.go,false);
  assert.equal(n.verdict,'MATE-DENSE-NOGO');
  const bad=flat.map((r,i)=>i===0?{...r,founders:99}:r);
  const iv=scoreMateDenseRows(bad);
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const short=flat.slice(0,7);
  const is=scoreMateDenseRows(short);
  assert.equal(is.go,false);
  assert.equal(is.verdict,'INVALID');
});

test('founder plumbing: 72-founder construction runs; flag default is null',()=>{
  const history={seed:402001,cueSeed:402002,resourceSeeds:[402003,402004,402005,402006]};
  const mk=(founders,extra)=>new TasteExperiment({history,arm:'candidate',
    reference:{...VALUE_REFERENCE,founders},learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,...extra});
  const run72=mk(72,{matingActionRequired:false});
  assert.equal(run72.world.flies.length,72);
  assert.equal(run72.world.config.matingActionRequired,false);
  for(let t=0;t<200&&!run72.finished;t++)run72.step();
  assert.ok(Number.isInteger(run72.world.totals.births));
  const a=mk(24,{matingActionRequired:true}),b=mk(24,{});
  for(let t=0;t<200&&!a.finished;t++)a.step();
  for(let t=0;t<200&&!b.finished;t++)b.step();
  assert.equal(b.world.config.matingActionRequired,true);
  assert.equal(b.endpoint().budgetAdjustedEnergyPerFounder,a.endpoint().budgetAdjustedEnergyPerFounder);
  assert.equal(b.endpoint().scalarOperations,a.endpoint().scalarOperations);
});

test('spent bank 403001-403036 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-spend maintenance: the MATE-DENSE bank built cleanly pre-spend and
  // is now spent; the builder must refuse to rebuild it anywhere.
  // Standing rule (seventh instance).
  const dir=mkdtempSync(join(tmpdir(),'mate-dense-bank-guard-'));
  assert.throws(()=>mateDenseDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
