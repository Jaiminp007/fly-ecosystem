// MATE-FOOD Phase-A dev instrument (FROZEN under docs/MATE_FOOD_PLAN_V1.md
// + docs/MATE_FOOD_PLAN_V1A.md). Gen-2 feasibility via nutrient enrichment:
// 2 arms (control nutrient 0.4 = standing null / enriched nutrient 5.0 =
// max lawful) x 6 histories = 12 mains (BT_TICKS=1792), ZERO probes. Both
// arms bar-50 + decoupled gate + maternal transmission (V1-identical; the
// ONLY arm difference is nutrient). GO = >=1 lineage-verified enriched
// gen-2 birth (existence claim); enriched gen-1 == 0 -> INCOMPLETE (broken
// run); else NOGO (+ pre-registered survival/energy NOGO-reading).
// No population/learning/RSI claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const MF_EXPERIMENT='mate-food-dev';
export const MF_HISTORIES=6;
export const MF_ARMS=Object.freeze(['control','enriched']);
export const MF_NUTRIENT_OVERRIDE=Object.freeze({control:null,enriched:5});
export const MF_EXPECT_MAINS=12, MF_EXPECT_PROBES=0;
export const MF_OP_CAP=20_000_000_000, MF_WALL_CAP_SECONDS=3600;
export const MF_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>415001+j));
const MF_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054]];
export const MF_SPENT_SEEDS=Object.freeze([381001,...MF_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mateFoodExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/mate-food-dev.mjs','docs/MATE_FOOD_PLAN_V1.md','docs/MATE_FOOD_PLAN_V1A.md','tests/mate-food-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mateFoodDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/mate-food-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/MATE_FOOD_PLAN_V1.md','docs/MATE_FOOD_PLAN_V1A.md'])visit(resolve(root,name));
  return found;
}
function priorEvidenceSeeds(){
  const into=new Set();
  const seedWalk=(v,k)=>{if(Array.isArray(v))for(const x of v)seedWalk(x,k);
    else if(v&&typeof v==='object')for(const[kk,vv]of Object.entries(v))seedWalk(vv,/seed/i.test(kk)?kk:k);
    else if(/seed/i.test(k)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)into.add(v);};
  const walkFs=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);
    if(e.isDirectory())walkFs(p);else if(p.endsWith('.json')){try{seedWalk(JSON.parse(readFileSync(p,'utf8')),'');}catch{}}}};
  walkFs(join(root,'evidence'));return into;
}
export function mateFoodDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,MF_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mateFoodExtraTokens())excluded.add(t);
  for(const s of MF_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of MF_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=MF_FIXTURE_SEEDS.length/MF_HISTORIES===9?Array.from({length:MF_HISTORIES},(_,h)=>{
    const s=MF_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,MF_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:MF_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MATE-FOOD dev bank (deterministic fresh 415001-415054, 9/history, 6 histories). Spend: 12 mains (2 arms x 6 main-seeds); other 42 slots reserved-excluded, never spendable elsewhere. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Curve collector: per-tick observe energy (raw means+n; no pre-binning).
export function collectCurve(){
  const bins=new Map();
  const emit=e=>{
    if(e.type!=='observe'||!e.own||!Number.isInteger(e.own.tick)||!Number.isFinite(e.own.energy))return;
    const t=e.own.tick;
    let s=bins.get(t);if(!s){s={sum:0,n:0};bins.set(t,s);}
    s.sum+=e.own.energy;s.n++;
  };
  const means={};for(const [b,s] of bins)means[b]=s.sum/s.n;
  return {emit,bins,means};
}
// Generation summary (exported for fixtures): max generation ever observed
// + births per generation + gen-2+ count, from world.lineage. Founders
// (generation 0, no parents) are excluded from birth counts. Pure.
export function summarizeGenerations(lineage){
  const byGeneration={};let max=0;
  for(const e of lineage){
    if(!e||!Number.isInteger(e.generation))continue;
    max=Math.max(max,e.generation);
    if(e.parents&&e.parents.length>0)byGeneration[e.generation]=(byGeneration[e.generation]||0)+1;
  }
  let gen2=0;
  for(const [g,n] of Object.entries(byGeneration))if(Number(g)>=2)gen2+=n;
  return {maxGeneration:max,byGeneration,gen1:byGeneration[1]||0,gen2};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMateFoodDev({bankPath,output,resume=false}){
  const sources=mateFoodDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mateFoodDevBank(bankPathAbs);
  assert.equal(p.histories.length,MF_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...MF_FIXTURE_SEEDS]};
  if(existsSync(fixturePath))assert.deepEqual(read(fixturePath),fixture,'Fixture seeds file already exists with different content; will not overwrite');
  else write(fixturePath,fixture);
  let rows=[],ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0},runtimes={},redone=[];
  const t0=Date.now();
  if(existsSync(join(outputAbs,'dev-results.json'))&&!resume)throw new Error(`Dev output already exists; preserve it: ${outputAbs}`);
  mkdirSync(join(outputAbs,'rows'),{recursive:true});
  if(resume){
    rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
    const l=read(join(outputAbs,'ledger.json'));ledger=l.ledger;runtimes=l.runtimes;redone=l.redone;
  }else{
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(pathDirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)),{flag:'wx'});}
    write(join(outputAbs,'protocol.json'),p);
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'mate-food-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...MF_ARMS],nutrientOverridePerArm:{...MF_NUTRIENT_OVERRIDE},transmission:'maternal',matingActionRequired:false,matingEnergyBar:50,reproduction:true,
      caps:{executions:300,aggregateScalarOperations:MF_OP_CAP,wallSeconds:MF_WALL_CAP_SECONDS},
      scope:'MATE-FOOD V1 gen-2 feasibility: control (nutrient 0.4, V1-identical) + enriched (nutrient 5.0, max lawful), maternal both arms, bar-50, decoupled. GO = >=1 lineage-verified enriched gen-2 birth (existence only); enriched gen-1 == 0 -> INCOMPLETE; else NOGO + survival/energy reading. No population/learning/RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=MF_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of MF_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,mode:'maternal',matingDecoupled:true,matingEnergyBar:50,nutrientOverride:MF_NUTRIENT_OVERRIDE[arm],curves:{},phaseRows:null,endpoint:null,births:null,generations:null};
        assert.equal(row.mode,'maternal','Row/main arm-mode mismatch');
        assert.equal(row.matingDecoupled,true,'Row/main flag mismatch');
        assert.equal(row.matingEnergyBar,50,'Row/main energy-bar mismatch');
        assert.equal(row.nutrientOverride,MF_NUTRIENT_OVERRIDE[arm],'Row/main nutrient-override mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:MF_NUTRIENT_OVERRIDE[arm]});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const births=run.world.totals.births;
        assert.ok(Number.isInteger(births)&&births>=0,`${arm}/${history.seed}: invalid births total`);
        const generations=summarizeGenerations(run.world.lineage);
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.births=births;row.generations=generations;
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed);
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
      }
    });
    runtimes[arm]=wall;checkpointLedger();
  }
  assert.deepEqual(mateFoodDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=MF_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,MF_EXPECT_MAINS,'Ledger mains count wrong');
  assert.equal(ledger.probes,MF_EXPECT_PROBES,'Ledger probes count wrong');
  const verdict=scoreMateFoodRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreMateFoodRows(rows){
  // V1: gen-2 births per nutrient arm. GO on >=1 enriched gen-2 (existence).
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of MF_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Number.isInteger(r.births)||r.births<0)return null;
    const g=r.generations;
    if(!g||!Number.isInteger(g.gen1)||g.gen1<0||!Number.isInteger(g.gen2)||g.gen2<0)return null;
    return {seed,births:r.births,gen1:g.gen1,gen2:g.gen2,nutrientOverride:r.nutrientOverride};
  });
  const g1=rows.length===MF_EXPECT_MAINS&&MF_ARMS.every(a=>rows.filter(r=>r.arm===a).length===6)&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  const g2=g1&&rows.every(r=>r.matingDecoupled===true&&r.mode==='maternal'&&r.matingEnergyBar===50&&
    r.nutrientOverride===MF_NUTRIENT_OVERRIDE[r.arm]&&Number.isInteger(r.births)&&r.births>=0&&
    r.generations&&Number.isInteger(r.generations.gen1)&&r.generations.gen1>=0&&
    Number.isInteger(r.generations.gen2)&&r.generations.gen2>=0);
  const tot=(arm,key)=>perArm[arm].every(x=>x!==null)?perArm[arm].reduce((a,x)=>a+x[key],0):null;
  const cGen1=tot('control','gen1'),cGen2=tot('control','gen2'),eGen1=tot('enriched','gen1'),eGen2=tot('enriched','gen2');
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/birth/generation audit failed'}
    :(cGen1===null||cGen2===null||eGen1===null||eGen2===null)?{go:false,verdict:'INVALID',reason:'generation totals uncomputable — malformed rows'}
    :eGen1===0?{go:false,verdict:'INCOMPLETE-UNTRAINED',reason:'enriched gen-1 == 0 — nothing to compound, broken run'}
    :eGen2!==null&&eGen2>=1?{go:true,verdict:'MATE-FOOD-GO',reason:'enriched gen-2 = '+eGen2+' >= 1 — gen-2 births exist under enrichment'}
    :{go:false,verdict:'MATE-FOOD-NOGO',reason:'enriched gen-2 = 0 with enriched gen-1 = '+eGen1+' — feeding does not unlock gen-2'};
  return {perArm,controlGen1:cGen1,controlGen2:cGen2,enrichedGen1:eGen1,enrichedGen2:eGen2,g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
