// MATE-PROXIMITY V1 dose instrument (FROZEN under docs/MATE_PROXIMITY_PLAN_V1.md).
// Mating-range dose on hub: narrow 13u vs normal 26u vs wide 52u, ALL enriched
// nutrient 5.0 + maternal + 1x sensing HELD, 6 histories x 3 arms = 18 mains
// (BT_TICKS=1792), ZERO probes. ATTRACT-V1b proved decoupled mating is
// proximity-gated; PROXIMITY manipulates the gate itself (13/26/52u).
// GO-V1 iff wide gen-2 >= 2 AND weak monotonicity narrow <= normal <= wide with
// wide > narrow strict. Else NOGO-V1 (breadth does not order compounding).
// NO births gate (pre-registered). INCOMPLETE-NOBIRTHS iff wide gen-1 == 0.
// Else NOGO-V1. No RSI claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {summarizeLineageFounders,collectFounderIds} from './mate-inherit-v1c.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const MP_EXPERIMENT='mate-proximity-dev';
export const MP_HISTORIES=6;
export const MP_ARMS=Object.freeze(['hubN','hub1','hubW']);
export const MP_ARM_RANGE=Object.freeze({hubN:0.5,hub1:1,hubW:2});
export const MP_ARM_TOPO='hub';
export const MP_ARM_SENSE=1;
export const MP_NOISE=Object.freeze({hubN:null,hub1:null,hubW:null});
export const MP_NUTRIENT=5;
export const MP_EXPECT_MAINS=18, MP_EXPECT_PROBES=0;
export const MP_OP_CAP=30_000_000_000, MP_WALL_CAP_SECONDS=3600;
export const MP_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>432001+j));
const MP_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054]];
export const MP_SPENT_SEEDS=Object.freeze([381001,...MP_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mateProximityDevExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/mate-proximity-dev.mjs','docs/MATE_PROXIMITY_PLAN_V1.md','tests/mate-proximity-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mateProximityDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/mate-proximity-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/MATE_PROXIMITY_PLAN_V1.md'])visit(resolve(root,name));
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
export function mateProximityDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,MP_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mateProximityDevExtraTokens())excluded.add(t);
  for(const s of MP_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of MP_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=MP_FIXTURE_SEEDS.length/MP_HISTORIES===9?Array.from({length:MP_HISTORIES},(_,h)=>{
    const s=MP_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,MP_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:MP_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MATE-PROXIMITY V1 dev bank (deterministic fresh 432001-432054, 9/history, 6 histories). Spend: 18 mains (3 arms x 6 main-seeds); other 36 slots reserved-excluded, never spendable elsewhere. First use is the single V1b run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
// Generation summary (exported for fixtures): max generation observed +
// births per generation + gen-2+ count, from world.lineage. Founders
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
  const gen1=byGeneration[1]||0;
  return {maxGeneration:max,byGeneration,gen1,gen2};
}
// Mean gen-1 lifespan (exported for fixtures): distinguishes infant-mortality
// deleteriousness from failed mating. died==null counts as censored at
// endTick (survivors). Non-gen-1, parentless, or malformed entries skipped.
export function meanGen1Lifespan(lineage,endTick){
  let s=0,n=0,censored=0;
  for(const e of lineage){
    if(!e||e.generation!==1||!Array.isArray(e.parents)||e.parents.length===0)continue;
    if(!Number.isInteger(e.born))continue;
    const end=e.died==null?endTick:e.died;
    if(!Number.isInteger(end)||end<e.born)continue;
    s+=end-e.born;n++;if(e.died==null)censored++;
  }
  return {mean:n>0?s/n:null,n,censored};
}
// Time-to-first-mating (exported for fixtures; DESCRIPTIVE ONLY, non-gating):
// min gen-1 born tick; null when no gen-1 exists (censored — no mating observed).
export function firstMatingTick(lineage){
  let m=null;
  for(const e of lineage){
    if(!e||e.generation!==1||!Array.isArray(e.parents)||e.parents.length===0)continue;
    if(!Number.isInteger(e.born))continue;
    if(m===null||e.born<m)m=e.born;
  }
  return m;
}
// Frozen V1b row schema (V1 process lesson: freeze the keys; fixtures assert conformance).
export const MP_ROW_SCHEMA=Object.freeze(['history','arm','mode','topology','sense','range','matingDecoupled','matingEnergyBar','nutrientOverride','transmissionNoise','curves','phaseRows','endpoint','births','generations','gen1Lifespan','founderOffspring','lineageFounders','firstMatingTick','centersCount']);
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMateProximityDev({bankPath,output,resume=false}){
  const sources=mateProximityDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mateProximityDevBank(bankPathAbs);
  assert.equal(p.histories.length,MP_HISTORIES);
  // Fixture AFTER bank build (standing order since V1b-turn-gated... V1 pre-built its file; lesson stands).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...MP_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'mate-proximity-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...MP_ARMS],topologyPerArm:{hubN:'hub',hub1:'hub',hubW:'hub'},sensePerArm:{hubN:1,hub1:1,hubW:1},rangePerArm:{hubN:0.5,hub1:1,hubW:2},nutrientOverride:5,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',reproduction:true,
      caps:{executions:300,aggregateScalarOperations:MP_OP_CAP,wallSeconds:MP_WALL_CAP_SECONDS},
      scope:'MATE-PROXIMITY V1 dose: hub mating-range 13u vs 26u vs 52u, all enriched (nutrient override 5) + maternal + 1x sensing HELD. GO-V1 iff wide gen-2 >= 2 AND weak monotonicity narrow <= normal <= wide with wide > narrow strict. NO births gate (pre-registered; engagement via fixture + G2 audit). INCOMPLETE-NOBIRTHS iff wide gen-1 == 0; else NOGO-V1. No population/learning/RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=MP_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of MP_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,mode:MP_ARM_TOPO,topology:MP_ARM_TOPO,sense:MP_ARM_SENSE,range:MP_ARM_RANGE[arm],matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MP_NOISE[arm],curves:{},phaseRows:null,endpoint:null,births:null,generations:null,gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:null,centersCount:null};
        assert.equal(row.mode,MP_ARM_TOPO,'Row/arm topology mismatch');
        assert.equal(row.topology,MP_ARM_TOPO,'Row/arm topology-field mismatch');
        assert.equal(row.sense,MP_ARM_SENSE,'Row/arm sense mismatch');
        assert.equal(row.range,MP_ARM_RANGE[arm],'Row/arm range mismatch');
        assert.equal(row.matingDecoupled,true,'Row/main flag mismatch');
        assert.equal(row.matingEnergyBar,50,'Row/main energy-bar mismatch');
        assert.equal(row.nutrientOverride,5,'Row/main nutrient-override mismatch');
        assert.equal(row.transmissionNoise,MP_NOISE[arm],'Row/main noise mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,transmissionNoise:MP_NOISE[arm],resourceTopology:MP_ARM_TOPO,mateSenseMultiplier:MP_ARM_SENSE,matingRangeMultiplier:MP_ARM_RANGE[arm]});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const births=run.world.totals.births;
        assert.ok(Number.isInteger(births)&&births>=0,`${arm}/${history.seed}: invalid births total`);
        const generations=summarizeGenerations(run.world.lineage);
        const gen1Lifespan=meanGen1Lifespan(run.world.lineage,BT_TICKS);
        const lineageFounders=summarizeLineageFounders(run.world.lineage);
        const matingTick=firstMatingTick(run.world.lineage);
        const centersCount=run.world.resourceCenters.length;
        assert.equal(centersCount,1,'Geography mismatch: '+arm+' shows '+centersCount+' centers');
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.births=births;row.generations=generations;row.gen1Lifespan=gen1Lifespan;row.lineageFounders=lineageFounders;row.firstMatingTick=matingTick;row.centersCount=centersCount;row.founderOffspring={...(run.founderOffspring||{})};
        assert.deepEqual(Object.keys(row).sort(),[...MP_ROW_SCHEMA].sort(),'Row schema drift vs frozen MP_ROW_SCHEMA');
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
  assert.deepEqual(mateProximityDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=MP_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,MP_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,MP_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreMateProximityDevRows(rows);
  const founderSpread={};
  for(const arm of MP_ARMS)founderSpread[arm]={gen2:collectFounderIds(rows,arm,'gen2'),gen3:collectFounderIds(rows,arm,'gen3')};
  const founderOffspring={};
  for(const arm of MP_ARMS){const agg={};
    for(const r of rows){if(r.arm!==arm||!r.founderOffspring)continue;
      for(const [id,n] of Object.entries(r.founderOffspring))agg[id]=(agg[id]||0)+n;}
    founderOffspring[arm]=agg;}
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,founderSpread,founderOffspring,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,founderSpread,founderOffspring};
}
export function scoreMateProximityDevRows(rows){
  // V1: mating-range dose on hub with sensing HELD. GO-V1 iff wide gen-2 >= 2 AND weak monotonicity narrow <= normal <= wide with wide > narrow strict.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of MP_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Number.isInteger(r.births)||r.births<0)return null;
    const g=r.generations;
    if(!g||!Number.isInteger(g.gen1)||g.gen1<0||!Number.isInteger(g.gen2)||g.gen2<0)return null;
    return {seed,births:r.births,gen1:g.gen1,gen2:g.gen2,nutrientOverride:r.nutrientOverride,verticalTransmission:r.mode,topology:r.topology,firstMatingTick:(r.firstMatingTick===null||Number.isInteger(r.firstMatingTick))?r.firstMatingTick:null};
  });
  const g1=rows.length===MP_EXPECT_MAINS&&MP_ARMS.every(a=>rows.filter(r=>r.arm===a).length===6)&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  // CORRECTION 2026-10-31: row schema has no verticalTransmission field (runner hardcodes
  // 'maternal' for all arms; see attempt.json + sources closure). Maternal-both-arms is
  // established by that frozen literal, not per-row. All other clauses unchanged.
  const g2=g1&&rows.every(r=>r.matingDecoupled===true&&r.mode==='hub'&&r.mode===r.topology&&r.topology===MP_ARM_TOPO&&r.sense===MP_ARM_SENSE&&r.range===MP_ARM_RANGE[r.arm]&&r.centersCount===1&&r.matingEnergyBar===50&&
    r.nutrientOverride===5&&r.transmissionNoise===MP_NOISE[r.arm]&&Number.isInteger(r.births)&&r.births>=0&&
    r.generations&&Number.isInteger(r.generations.gen1)&&r.generations.gen1>=0&&
    Number.isInteger(r.generations.gen2)&&r.generations.gen2>=0);
  const tot=(arm,key)=>perArm[arm].every(x=>x!==null)?perArm[arm].reduce((a,x)=>a+x[key],0):null;
  const nGen1=tot('hubN','gen1'),nGen2=tot('hubN','gen2'),oGen1=tot('hub1','gen1'),oGen2=tot('hub1','gen2'),wGen1=tot('hubW','gen1'),wGen2=tot('hubW','gen2');
  // NO births manipulation gate (V1c/ATTRACT precedent, pre-registered: births are bank-volatile;
  // engagement = fixture-level range proof + G2 range/geography audit, not birth totals).
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/birth/generation/geography audit failed'}
    :(nGen1===null||nGen2===null||oGen1===null||oGen2===null||wGen1===null||wGen2===null)?{go:false,verdict:'INVALID',reason:'generation totals uncomputable — malformed rows'}
    :wGen1===0?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:'hub/wide gen-1 == 0 — nothing to compound, void (not NOGO)'}
    :(wGen2!==null&&wGen2>=2&&nGen2!==null&&oGen2!==null&&nGen2<=oGen2&&oGen2<=wGen2&&wGen2>nGen2)?{go:true,verdict:'MATE-PROXIMITY-GO-V1',reason:'dose-monotone: narrow '+nGen2+' <= normal '+oGen2+' <= wide '+wGen2+' with wide >= 2 and > narrow — proximity breadth orders compounding'}
    :{go:false,verdict:'MATE-PROXIMITY-NOGO-V1',reason:'no dose pattern: narrow '+nGen2+' / normal '+oGen2+' / wide '+wGen2+' — proximity breadth does not order compounding'};
  // DESCRIPTIVE ONLY (non-gating): per-arm first-mating ticks; R58 variance-dominance read.
  const fmt=arm=>perArm[arm].every(x=>x!==null)?perArm[arm].map(x=>x.firstMatingTick):null;
  const med=t=>{const v=t.filter(x=>x!==null).sort((a,b)=>a-b);return v.length?v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2:null;};
  const firstMating={hubN:fmt('hubN'),hub1:fmt('hub1'),hubW:fmt('hubW')};
  return {perArm,hubNGen2:nGen2,hub1Gen2:oGen2,hubWGen2:wGen2,hubNGen1:nGen1,hub1Gen1:oGen1,hubWGen1:wGen1,firstMating,g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
