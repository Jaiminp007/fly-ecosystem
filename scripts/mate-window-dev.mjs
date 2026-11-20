// MATE-WINDOW Phase-A dev instrument (FROZEN under docs/MATE_WINDOW_PLAN_V1.md
// DESIGN ONLY base; implementation freeze = this file + fixtures + triage).
// Windowed encounter-nutrient timing: 4 arms (control legacy / early enriched
// phase-0-only / late enriched phase-2-only / full enriched-all) x 6 histories
// = 24 mains (BT_TICKS=1792), ZERO probes. Hub base, bar HELD 65, maternal,
// decoupled, gain OFF (uniform). Verdicts: GO-WINDOW / NOGO-WINDOW /
// TIMING-REFUTED / INVALID-* / INCOMPLETE-NOBIRTHS. Line closes either way.
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

export const MW_EXPERIMENT='mate-window-dev';
export const MW_HISTORIES=6;
export const MW_ARMS=Object.freeze(['control','early','late','full']);
export const MW_ENRICHED=5;
export const MW_SCHEDULE=Object.freeze({control:null,early:Object.freeze([5,null,null,null]),late:Object.freeze([null,null,5,null]),full:Object.freeze([5,5,5,5])});
export const MW_BAR=50;
export const MW_TOPOLOGY='hub';
export const MW_EXPECT_MAINS=24, MW_EXPECT_PROBES=0;
export const MW_OP_CAP=5_000_000_000, MW_WALL_CAP_SECONDS=3600;
export const MW_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>447001+j));
const MW_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[418001,418054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054]];
export const MW_SPENT_SEEDS=Object.freeze([381001,...MW_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mateWindowExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/mate-window-dev.mjs','docs/MATE_WINDOW_PLAN_V1.md','tests/mate-window-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mateWindowDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/mate-window-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','learning/cue-foraging.mjs','docs/MATE_WINDOW_PLAN_V1.md'])visit(resolve(root,name));
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
export function mateWindowDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,MW_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mateWindowExtraTokens())excluded.add(t);
  for(const s of MW_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of MW_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=MW_FIXTURE_SEEDS.length/MW_HISTORIES===9?Array.from({length:MW_HISTORIES},(_,h)=>{
    const s=MW_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,MW_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:MW_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MATE-WINDOW dev bank (deterministic fresh 447001-447054, 9/history, 6 histories). Spend: 24 mains (4 arms x 6 main-seeds); other 30 slots reserved-excluded, never spendable elsewhere. First use is the single V2 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMateWindowDev({bankPath,output,resume=false}){
  const sources=mateWindowDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mateWindowDevBank(bankPathAbs);
  assert.equal(p.histories.length,MW_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...MW_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'mate-window-v2-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...MW_ARMS],nutrientSchedulePerArm:Object.fromEntries(Object.entries(MW_SCHEDULE).map(([k,v])=>[k,v==null?null:[...v]])),transmission:'maternal',matingActionRequired:false,matingEnergyBar:MW_BAR,resourceTopology:MW_TOPOLOGY,reproduction:true,
      caps:{executions:300,aggregateScalarOperations:MW_OP_CAP,wallSeconds:MW_WALL_CAP_SECONDS},
      scope:'MATE-WINDOW V2 windowed-encounter timing (bar-50 birthy base per CONFIG_AUDIT_V1: V1 bar-65+legacy sterile 0/6, cause=bar not luck): control legacy + early enriched-phase-0-only + late enriched-phase-2-only + full enriched-all, hub base, bar-50, maternal, decoupled, gain OFF. GO = early beats control >=20%+2 AND early>late (timing, not amount); late>=early with GO-level boost = TIMING-REFUTED; sterile-control-again = INCOMPLETE (line closes). No population/learning/RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=MW_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of MW_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,mode:'maternal',matingDecoupled:true,matingEnergyBar:MW_BAR,resourceTopology:MW_TOPOLOGY,nutrientOverride:MW_SCHEDULE[arm]==null?null:[...MW_SCHEDULE[arm]],curves:{},phaseRows:null,endpoint:null,births:null};
        assert.equal(row.mode,'maternal','Row/main arm-mode mismatch');
        assert.equal(row.matingDecoupled,true,'Row/main flag mismatch');
        assert.equal(row.matingEnergyBar,MW_BAR,'Row/main energy-bar mismatch');
        assert.equal(row.resourceTopology,MW_TOPOLOGY,'Row/main topology mismatch');
        assert.deepEqual(row.nutrientOverride,MW_SCHEDULE[arm]==null?null:[...MW_SCHEDULE[arm]],'Row/main nutrient-schedule mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true,matingActionRequired:false,matingEnergyBar:MW_BAR,verticalTransmission:'maternal',resourceTopology:MW_TOPOLOGY,nutrientOverride:MW_SCHEDULE[arm]==null?null:[...MW_SCHEDULE[arm]]});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const births=run.world.totals.births;
        assert.ok(Number.isInteger(births)&&births>=0,`${arm}/${history.seed}: invalid births total`);
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.births=births;
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
  assert.deepEqual(mateWindowDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=MW_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,MW_EXPECT_MAINS,'Ledger mains count wrong');
  assert.equal(ledger.probes,MW_EXPECT_PROBES,'Ledger probes count wrong');
  const verdict=scoreMateWindowRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreMateWindowRows(rows){
  // V1: windowed-encounter timing. GO on early>control (+20% & +2) AND early>late.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of MW_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Number.isInteger(r.births)||r.births<0)return null;
    if(!r.endpoint||!Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)||!Number.isFinite(r.endpoint.survivors))return null;
    return {seed,births:r.births,survivors:r.endpoint.survivors,nutrientOverride:r.nutrientOverride};
  });
  const g0=rows.length===MW_EXPECT_MAINS&&MW_ARMS.every(a=>rows.filter(r=>r.arm===a).length===6)&&
    rows.every(r=>r.endpoint&&Math.abs(r.endpoint.accountingResidual)<1e-7&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  const g1=g0&&rows.every(r=>r.mode==='maternal'&&r.matingDecoupled===true&&r.matingEnergyBar===MW_BAR&&r.resourceTopology===MW_TOPOLOGY&&
    JSON.stringify(r.nutrientOverride)===JSON.stringify(MW_SCHEDULE[r.arm]==null?null:[...MW_SCHEDULE[r.arm]])&&
    Number.isInteger(r.births)&&r.births>=0);
  const tot=arm=>perArm[arm].every(x=>x!==null)?perArm[arm].reduce((a,x)=>a+x.births,0):null;
  const medSurv=arm=>{const s=perArm[arm].filter(x=>x!==null).map(x=>x.survivors).sort((a,b)=>a-b);return s.length?s[Math.floor(s.length/2)]:null;};
  const cTot=tot('control'),eTot=tot('early'),lTot=tot('late'),fTot=tot('full');
  const birthy=rows.filter(r=>Number.isInteger(r.births)&&r.births>=1).length;
  const censored=MW_ARMS.filter(a=>{const m=medSurv(a);return m!==null&&m<6;});
  const keyCensored=['control','early'].some(a=>censored.includes(a));
  const gate=!g0?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g1?{go:false,verdict:'INVALID',reason:'config/schedule/birth audit failed'}
    :(cTot===null||eTot===null||lTot===null||fTot===null)?{go:false,verdict:'INVALID',reason:'birth totals uncomputable — malformed rows'}
    :birthy<12?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:`birthy rows ${birthy}<12 (50%) — metric void, not NOGO`}
    :keyCensored?{go:false,verdict:'INVALID',reason:`key arm censored (median survivors<6): ${censored.join(',')}`}
    :fTot<cTot?{go:false,verdict:'INVALID',reason:`reference violated (full ${fTot}<control ${cTot}) — food direction broken, bank pathology`}
    :(eTot<cTot*1.2||eTot<cTot+2)?{go:false,verdict:'NOGO-WINDOW',reason:`early ${eTot} vs control ${cTot} misses +20%+2 — window unexploitable this way`}
    :eTot<=lTot?{go:false,verdict:'TIMING-REFUTED',reason:`early ${eTot}<=late ${lTot} — boost works, timing doesn't; amount matters, window doesn't`}
    :{go:true,verdict:'GO-WINDOW',reason:`early ${eTot}>control ${cTot} (+20%+2) and early>late ${lTot} — timing matters; Track B rationale confirmed`};
  return {perArm,controlTot:cTot,earlyTot:eTot,lateTot:lTot,fullTot:fTot,birthy,censored,g0,g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
