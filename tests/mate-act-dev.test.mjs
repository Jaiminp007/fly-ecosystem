// MATE-ACT fixtures (G5 gate). Zero bank worlds: synthetic rows, temp-dir
// bank, short-run null-default check (200 ticks, no mating possible either
// way). Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateActDevBank,scoreMateActRows,MA_ARMS,MA_FLAG} from '../scripts/mate-act-dev.mjs';

const mkRow=(arm,seed,births,ok=true)=>({history:{seed},arm,
  decoupled:ok?(arm==='decoupled'?false:true):!MA_FLAG[arm],
  endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:12},births});

test('scorer GO: >=1 decoupled birth, zero control births',()=>{
  const seeds=[401001,401010,401019,401028];
  const rows=[...seeds.map((s,i)=>mkRow('decoupled',s,i===0?2:0)),
    ...seeds.map(s=>mkRow('intact',s,0))];
  const v=scoreMateActRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-ACT-GO');
  assert.equal(v.decoupledTotal,2);
  assert.equal(v.controlTotal,0);
});

test('scorer NOGO on zero decoupled births; INVALID on control births or bad audit',()=>{
  const seeds=[401001,401010,401019,401028];
  const flat=[...seeds.map(s=>mkRow('decoupled',s,0)),...seeds.map(s=>mkRow('intact',s,0))];
  const n=scoreMateActRows(flat);
  assert.equal(n.go,false);
  assert.equal(n.verdict,'MATE-ACT-NOGO');
  const bad=[...seeds.map(s=>mkRow('decoupled',s,0)),...seeds.map((s,i)=>mkRow('intact',s,i===0?1:0))];
  const iv=scoreMateActRows(bad);
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const wrong=[...seeds.map((s,i)=>mkRow('decoupled',s,0,i!==0)),...seeds.map(s=>mkRow('intact',s,0))];
  const iw=scoreMateActRows(wrong);
  assert.equal(iw.go,false);
  assert.equal(iw.verdict,'INVALID');
  const short=flat.slice(0,7);
  const is=scoreMateActRows(short);
  assert.equal(is.go,false);
  assert.equal(is.verdict,'INVALID');
});

test('null-default: flag true behaves identically to default on short runs',()=>{
  const history={seed:402001,cueSeed:402002,resourceSeeds:[402003,402004,402005,402006]};
  const mk=extra=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,...extra});
  const a=mk({});const b=mk({matingActionRequired:true});
  for(let t=0;t<200&&!a.finished;t++)a.step();
  for(let t=0;t<200&&!b.finished;t++)b.step();
  const ea=a.endpoint(),eb=b.endpoint();
  assert.equal(eb.budgetAdjustedEnergyPerFounder,ea.budgetAdjustedEnergyPerFounder);
  assert.equal(eb.scalarOperations,ea.scalarOperations);
  assert.equal(a.world.config.matingActionRequired,true);
  const c=mk({matingActionRequired:false});
  assert.equal(c.world.config.matingActionRequired,false);
  for(let t=0;t<200&&!c.finished;t++)c.step();
  assert.ok(Number.isInteger(c.world.totals.births));
});

test('spent bank 401001-401036 cannot be rebuilt (union-exclusion guard)',()=>{
  // The MATE-ACT bank built cleanly pre-spend (verified: 4 histories,
  // 36-unique 401001-401036, exclusions incl. 381001/400001/402001) and is
  // now reserved in evidence; the builder must refuse to rebuild it
  // anywhere. Standing rule (fifth instance).
  const dir=mkdtempSync(join(tmpdir(),'mate-act-bank-guard-'));
  assert.throws(()=>mateActDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
