// MATE-DENSE Phase-A dev instrument (FROZEN under docs/MATE_DENSE_PLAN_V1.md).
// Density unlocks mating: 2 arms (decoupled-24 baseline / decoupled-72
// density test) x 4 histories = 8 mains (BT_TICKS=1792), ZERO probes.
// Both arms decoupled (matingActionRequired false, reproduction true);
// the ONLY arm difference is founder count (24 vs 72) via reference
// override. GO = >=1 birth either arm (arm split recorded + interpreted).
// NO-GO = zero both (density insufficient or energy overlap binds).
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

export const MD_EXPERIMENT='mate-dense-dev';
export const MD_HISTORIES=4;
export const MD_ARMS=Object.freeze(['decoupled24','decoupled72']);
export const MD_FOUNDERS=Object.freeze({decoupled24:24,decoupled72:72});
export const MD_EXPECT_MAINS=8, MD_EXPECT_PROBES=0;
export const MD_OP_CAP=20_000_000_000, MD_WALL_CAP_SECONDS=3600;
export const MD_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>403001+j));
const MD_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036]];
export const MD_SPENT_SEEDS=Object.freeze([381001,...MD_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mateDenseExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/mate-dense-dev.mjs','docs/MATE_DENSE_PLAN_V1.md']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mateDenseDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/mate-dense-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/MATE_DENSE_PLAN_V1.md'])visit(resolve(root,name));
  return found;
}
function priorEvidenceSeeds(){
  const into=new Set();
  const seedWalk=(v,k)=>{if(Array.isArray(v))for(const x of v)seedWalk(x,k);
    else if(v&&typeof v==='object')for(const[kk,vv]of Object.entries(v))seedWalk(vv,/seed/i.test(kk)?kk:k);
    else if(/seed/i.test(k)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)into.add(v);};
  const walkFs=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);
    if(e.isDirectory())walkFs(p);else if(e.name.endsWith('.json')){try{seedWalk(JSON.parse(readFileSync(p,'utf8')),'');}catch{}}}};
  walkFs(join(root,'evidence'));return into;
}
export function mateDenseDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,MD_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mateDenseExtraTokens())excluded.add(t);
  for(const s of MD_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of MD_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=MD_FIXTURE_SEEDS.length/MD_HISTORIES===9?Array.from({length:MD_HISTORIES},(_,h)=>{
    const s=MD_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,MD_HISTORIES*9,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:MD_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MATE-DENSE dev bank (deterministic fresh 403001-403036, 9/history, 4 histories). Spend: 8 mains (2 arms x 4 main-seeds); other 28 slots reserved-excluded, never spendable elsewhere. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
export function runMateDenseDev({bankPath,output,resume=false}){
  const sources=mateDenseDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mateDenseDevBank(bankPathAbs);
  assert.equal(p.histories.length,MD_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...MD_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'mate-dense-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...MD_ARMS],foundersPerArm:{...MD_FOUNDERS},matingActionRequired:false,reproduction:true,
      caps:{executions:300,aggregateScalarOperations:MD_OP_CAP,wallSeconds:MD_WALL_CAP_SECONDS},
      scope:'MATE-DENSE V1 density unlock attempt. GO = >=1 birth either arm (arm split recorded + interpreted); NOGO = zero both (density insufficient or energy overlap binds). No population/learning/RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops,founders)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*founders;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=MD_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of MD_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,founders:MD_FOUNDERS[arm],matingDecoupled:true,curves:{},phaseRows:null,endpoint:null,births:null};
        assert.equal(row.founders,MD_FOUNDERS[arm],'Row/main arm-founder mismatch');
        assert.equal(row.matingDecoupled,true,'Row/main flag mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm:'candidate',reference:{...VALUE_REFERENCE,founders:MD_FOUNDERS[arm]},learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true,matingActionRequired:false});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const births=run.world.totals.births;
        assert.ok(Number.isInteger(births)&&births>=0,`${arm}/${history.seed}: invalid births total`);
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.births=births;
        assert.equal(run.world.flies.length+run.world.totals.deaths,MD_FOUNDERS[arm]+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed);
        note(1,0,BT_TICKS,endpoint.scalarOperations,MD_FOUNDERS[arm]);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
      }
    });
    runtimes[arm]=wall;checkpointLedger();
  }
  assert.deepEqual(mateDenseDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=MD_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,MD_EXPECT_MAINS,'Ledger mains count wrong');
  assert.equal(ledger.probes,MD_EXPECT_PROBES,'Ledger probes count wrong');
  const verdict=scoreMateDenseRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreMateDenseRows(rows){
  // V1: births per density arm. GO on >=1 birth EITHER arm (unlock is
  // unlock); arm split recorded for the dose-response interpretation.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of MD_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Number.isInteger(r.births)||r.births<0)return null;
    return {seed,births:r.births,founders:r.founders};
  });
  const g1=rows.length===MD_EXPECT_MAINS&&MD_ARMS.every(a=>rows.filter(r=>r.arm===a).length===4)&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  const g2=g1&&rows.every(r=>r.matingDecoupled===true&&r.founders===MD_FOUNDERS[r.arm]&&Number.isInteger(r.births)&&r.births>=0);
  const tot=a=>perArm[a].every(x=>x!==null)?perArm[a].reduce((x,y)=>x+y.births,0):null;
  const lo=tot('decoupled24'),hi=tot('decoupled72');
  const go=g2&&((hi!==null&&hi>=1)||(lo!==null&&lo>=1));
  const interp=hi>=1&&lo>=1?'both densities (unlock + dose response — strongest)':hi>=1?'dense only (density unlocks — estimate confirmed)':'sparse only (bank luck vs V1 — density effect unproven, follow-up must replicate)';
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/birth audit failed'}
    :go?{go:true,verdict:'MATE-DENSE-GO',reason:'>=1 birth ('+interp+')'}
    :{go:false,verdict:'MATE-DENSE-NOGO',reason:'zero births both arms — density insufficient at 3x or energy overlap binds'};
  return {perArm,decoupled24Total:lo,decoupled72Total:hi,g1,g2,go,interpretation:go?interp:'n/a',verdict:gate.verdict,reason:gate.reason};
}

