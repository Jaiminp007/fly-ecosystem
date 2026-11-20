// MATE-FOOD fixtures (G3 gate per plan + V1A correction). Zero bank worlds:
// synthetic rows, temp-dir bank, unit-level generation summary + nutrient
// plumbing checks (no full runs). Union-excluded via tests/*.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from '../scripts/body-transfer.mjs';
import {mateFoodDevBank,scoreMateFoodRows,summarizeGenerations,MF_NUTRIENT_OVERRIDE} from '../scripts/mate-food-dev.mjs';

const mkRow=(arm,seed,births,gen1,gen2)=>({history:{seed},arm,
  mode:'maternal',matingDecoupled:true,matingEnergyBar:50,nutrientOverride:MF_NUTRIENT_OVERRIDE[arm],
  endpoint:{budgetAdjustedEnergyPerFounder:-60.0,survivors:12},births,
  generations:{maxGeneration:gen2>0?2:(gen1>0?1:0),byGeneration:gen1>0?{1:gen1}:{},gen1,gen2}});

test('scorer GO on >=1 enriched gen-2 (existence, lineage-verified counts)',()=>{
  const seeds=[415001,415010,415019,415028,415037,415046];
  const rows=[...seeds.map(s=>mkRow('control',s,2,2,0)),...seeds.map((s,i)=>mkRow('enriched',s,3,3,i<2?1:0))];
  const v=scoreMateFoodRows(rows);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'MATE-FOOD-GO');
  assert.equal(v.enrichedGen2,2);
  assert.equal(v.enrichedGen1,18);
});

test('scorer NOGO when gen-2 absent but gen-1 present; INCOMPLETE when enriched gen-1 is 0',()=>{
  const seeds=[415001,415010,415019,415028,415037,415046];
  const flat=[...seeds.map(s=>mkRow('control',s,2,2,0)),...seeds.map(s=>mkRow('enriched',s,3,3,0))];
  const n=scoreMateFoodRows(flat);
  assert.equal(n.go,false);
  assert.equal(n.verdict,'MATE-FOOD-NOGO');
  const empty=[...seeds.map(s=>mkRow('control',s,0,0,0)),...seeds.map(s=>mkRow('enriched',s,0,0,0))];
  const iu=scoreMateFoodRows(empty);
  assert.equal(iu.go,false);
  assert.equal(iu.verdict,'INCOMPLETE-UNTRAINED');
  // enriched gen-1 == 0 with control births is still INCOMPLETE (nothing to compound), not NOGO
  const broken=[...seeds.map(s=>mkRow('enriched',s,0,0,0)),...seeds.map(s=>mkRow('control',s,2,2,0))];
  const iu2=scoreMateFoodRows(broken);
  assert.equal(iu2.verdict,'INCOMPLETE-UNTRAINED');
});

test('scorer INVALID on audit fail: wrong nutrient, wrong mode, missing arm, bad generations',()=>{
  const seeds=[415001,415010,415019,415028,415037,415046];
  const base=[...seeds.map(s=>mkRow('control',s,2,2,0)),...seeds.map(s=>mkRow('enriched',s,3,3,1))];
  assert.equal(scoreMateFoodRows(base).verdict,'MATE-FOOD-GO');
  const wrongNut=base.map((r,i)=>i===0?{...r,nutrientOverride:5.0}:r);
  assert.equal(scoreMateFoodRows(wrongNut).verdict,'INVALID');
  const wrongMode=base.map((r,i)=>i===0?{...r,mode:'none'}:r);
  assert.equal(scoreMateFoodRows(wrongMode).verdict,'INVALID');
  const badGen=base.map((r,i)=>i===0?{...r,generations:{maxGeneration:1,byGeneration:{},gen1:0,gen2:-1}}:r);
  assert.equal(scoreMateFoodRows(badGen).verdict,'INVALID');
  const short=base.slice(0,11);
  assert.equal(scoreMateFoodRows(short).verdict,'INVALID');
});

test('summarizeGenerations: max, per-generation births, gen2 count; founders excluded',()=>{
  const lineage=[
    {id:1,generation:0,parents:[]},{id:2,generation:0,parents:[]},
    {id:3,generation:1,parents:[1,2]},{id:4,generation:1,parents:[1,2]},
    {id:5,generation:2,parents:[3,4]},
  ];
  const s=summarizeGenerations(lineage);
  assert.equal(s.maxGeneration,2);
  assert.deepEqual(s.byGeneration,{1:2,2:1});
  assert.equal(s.gen1,2);
  assert.equal(s.gen2,1);
  assert.deepEqual(summarizeGenerations([]),{maxGeneration:0,byGeneration:{},gen1:0,gen2:0});
  const orphans=[{id:9,generation:5,parents:[]}];
  const so=summarizeGenerations(orphans);
  assert.equal(so.maxGeneration,5);
  assert.equal(so.gen2,0);
});

test('nutrient plumbing: null default runs the legacy phase table; enriched holds 5.0 across BOTH phase transitions (incl. the C dip)',()=>{
  const history={seed:415001,cueSeed:415002,resourceSeeds:[415003,415004,415005,415006]};
  const mk=(extra)=>new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',...extra});
  // V1-parity: the control arm config is byte-identical to V1's maternal arm
  const v1style=mk({});
  assert.deepEqual(
    {reproduction:v1style.reproduction,matingActionRequired:v1style.world.config.matingActionRequired,
     matingEnergyBar:v1style.world.config.matingEnergyBar,verticalTransmission:v1style.verticalTransmission,nutrientOverride:v1style.nutrientOverride},
    {reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:null});
  assert.equal(MF_NUTRIENT_OVERRIDE.control,null);
  assert.equal(MF_NUTRIENT_OVERRIDE.enriched,5);
  // Phase table: A .4 (0-511), B .4 (512-1023), C .2 (1024-1535). Sample every 256 ticks to tick 1100.
  const def=mk({});
  const defSeen=[];
  for(let t=0;t<1100&&!def.finished;t++){def.step();if(t%256===0)defSeen.push(def.world.config.nutrient);}
  assert.deepEqual(defSeen,[0.4,0.4,0.4,0.4,0.2]);
  const enr=mk({nutrientOverride:5});
  const enrSeen=[];
  for(let t=0;t<1100&&!enr.finished;t++){enr.step();if(t%256===0)enrSeen.push(enr.world.config.nutrient);}
  assert.ok(enrSeen.length>=4);
  assert.ok(enrSeen.every(v=>v===5),`override leaked: ${JSON.stringify(enrSeen)}`);
});

test('live bank 415001-415054 cannot be rebuilt (union-exclusion guard)',()=>{
  // Post-build maintenance: the MATE-FOOD bank built cleanly pre-build (6/6
  // green incl. temp-dir 54-unique build) and is now live in evidence; the
  // builder must refuse to rebuild it anywhere. Read-only checks verify the
  // committed bank (no rebuild). This guards never-duplicate-runs.
  const p=mateFoodDevBank('evidence/mate-food-dev/fresh-01/protocol.json');
  assert.equal(p.experiment,'mate-food-dev');
  assert.equal(p.histories.length,6);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,54);
  assert.equal(Math.min(...flat),415001);
  assert.equal(Math.max(...flat),415054);
  for(const s of [381001,395019,396001,405001,415001])assert.ok(p.excludedSeeds.includes(s),`missing exclusion ${s}`);
  const dir=mkdtempSync(join(tmpdir(),'mate-food-bank-guard-'));
  assert.throws(()=>mateFoodDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});
