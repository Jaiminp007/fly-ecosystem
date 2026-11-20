// BALDWIN Phase-A dev instrument (FROZEN under docs/BALDWIN_PLAN_V1.md).
// Slow-weight consolidation screen: 3 arms (cons0/control, consWeak 0.0001,
// consMod 0.001) x 4 histories = 12 mains (BT_TICKS=1792), ZERO probes.
// Per main: phaseRows saved + per-tick observe energy (raw means+n).
// Criterion: return-A (ticks 1536-1791) ticks-to-80%-of-own-phase-A-max
// (sustained 8 ticks, 50%-survivor guard, censored at 256). Pre-registered
// INCOMPLETE-SATURATED fail-closed if control is already fast or censored.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const B_EXPERIMENT='baldwin-dev';
export const B_HISTORIES=4;
export const B_ARMS=Object.freeze(['cons0','consWeak','consMod']);
export const B_RATES=Object.freeze({cons0:0,consWeak:0.0001,consMod:0.001});
export const B_EXPECT_MAINS=12, B_EXPECT_PROBES=0;
export const B_OP_CAP=20_000_000_000, B_WALL_CAP_SECONDS=3600;
export const B_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>402001+j));
const B_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072]];
export const B_SPENT_SEEDS=Object.freeze([381001,...B_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const B_SUSTAIN_TICKS=8, B_REF_FRAC=0.8, B_EPISODE_TICKS=256;
export const B_MIN_ALIVE_FRAC=0.5;
export const B_SAT_TICKS=64, B_IMPROVE_TICKS=64;
export const B_RETURN_START=1536;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function baldwinExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/baldwin-dev.mjs','docs/BALDWIN_PLAN_V1.md']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function baldwinDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/baldwin-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/BALDWIN_PLAN_V1.md'])visit(resolve(root,name));
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
export function baldwinDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,B_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of baldwinExtraTokens())excluded.add(t);
  for(const s of B_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of B_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=B_FIXTURE_SEEDS.length/B_HISTORIES===9?Array.from({length:B_HISTORIES},(_,h)=>{
    const s=B_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,B_HISTORIES*9,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:B_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'BALDWIN dev bank (deterministic fresh 402001-402036, 9/history, 4 histories). Spend: 12 mains (3 arms x 4 main-seeds); other 24 slots reserved-excluded, never spendable elsewhere. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
// Return-A ticks-to-criterion on RAW per-tick curves (pure; exported).
// Self reference: 80% of own phase-A max. First tick t in the episode with
// t..t+B_SUSTAIN_TICKS-1 ALL satisfying means>=0.8*refMax
// with >=50% founders alive; ticks = t - B_RETURN_START; censored at 256.
export function scoreEpisodeBaldwin(means,counts,refMax,founders){
  const need=Math.ceil(B_MIN_ALIVE_FRAC*founders);
  const ok=k=>(counts[k]??0)>=need;
  for(let t=B_RETURN_START;t+B_SUSTAIN_TICKS<=B_RETURN_START+B_EPISODE_TICKS;t++){
    let pass=true;
    for(let k=t;k<t+B_SUSTAIN_TICKS;k++){
      if(!ok(k)||!(means[k]>=B_REF_FRAC*refMax)){pass=false;break;}
    }
    if(pass)return {ticks:t-B_RETURN_START,censored:false,reason:'criterion-met'};
  }
  return {ticks:null,censored:true,reason:'never-reached'};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runBaldwinDev({bankPath,output,resume=false}){
  const sources=baldwinDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=baldwinDevBank(bankPathAbs);
  assert.equal(p.histories.length,B_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...B_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'baldwin-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...B_ARMS],rates:{...B_RATES},
      caps:{executions:300,aggregateScalarOperations:B_OP_CAP,wallSeconds:B_WALL_CAP_SECONDS},
      scope:'BALDWIN V1 single consolidation screen. Return-A relearning ticks-to-80%; pre-registered INCOMPLETE-SATURATED fail-closed. No tuning; conjunctive G1-G5 verdict decides.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=B_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of B_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,rate:B_RATES[arm],curves:{},phaseRows:null,endpoint:null};
        assert.equal(row.rate,B_RATES[arm],'Row/main arm-rate mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS,consolidationRate:B_RATES[arm]},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
      }
    });
    runtimes[arm]=wall;checkpointLedger();
  }
  assert.deepEqual(baldwinDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=B_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,B_EXPECT_MAINS,'Ledger mains count wrong');
  assert.equal(ledger.probes,B_EXPECT_PROBES,'Ledger probes count wrong');
  const verdict=scoreBaldwin(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreBaldwin(rows){
  // V1: return-A (ticks 1536-1791) ticks-to-80%-of-OWN-phase-A-max, per arm.
  // Reference: run's own phase-A max (ticks 0-511), self-normalizing.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const episodes=[];
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  for(const seed of seeds)for(const arm of B_ARMS){
    const r=byArmSeed[arm+':'+seed];if(!r||!r.curves)continue;
    const aVals=Object.entries(r.curves.means).filter(([t])=>+t<512).map(([,v])=>v);
    if(!aVals.length||!aVals.every(Number.isFinite))continue;
    const s=scoreEpisodeBaldwin(r.curves.means,r.curves.counts,Math.max(...aVals),BT_FOUNDERS);
    episodes.push({seed,arm,...s});
  }
  const med=a=>{const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
  const byArm=a=>episodes.filter(e=>e.arm===a&&!e.censored).map(e=>e.ticks);
  const medians={};for(const arm of B_ARMS){const u=byArm(arm);medians[arm]=u.length?med(u):null;}
  const censored=episodes.filter(e=>e.censored).length;
  const g1=rows.length===B_EXPECT_MAINS&&B_ARMS.every(a=>rows.filter(r=>r.arm===a).length===4)&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
  const g2=g1&&rows.every(r=>r.rate===B_RATES[r.arm]&&Number.isFinite(r.rate));
  const ctl=medians.cons0;
  const allCensored=B_ARMS.every(a=>medians[a]===null);
  const saturated=ctl===null||ctl<=B_SAT_TICKS;
  const goArm={};for(const arm of ['consWeak','consMod'])goArm[arm]=!saturated&&medians[arm]!==null&&ctl-medians[arm]>=B_IMPROVE_TICKS;
  const go=g1&&g2&&!saturated&&(goArm.consWeak||goArm.consMod);
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g2?{go:false,verdict:'INVALID',reason:'config audit failed'}
    :allCensored?{go:false,verdict:'DESIGN-FAILURE',reason:'return-A never rebounds anywhere — close line, publish failure'}
    :saturated?{go:false,verdict:'INCOMPLETE-SATURATED',reason:'control already fast/censored — metric saturated, mechanism untested'}
    :go?{go:true,verdict:'BALDWIN-GO',reason:'consolidation accelerates return-A relearning by >=64 ticks'}
    :{go:false,verdict:'BALDWIN-NOGO',reason:'no consolidation acceleration of return-A relearning'};
  return {episodes,medians,censored,g1,g2,go,goArm,controlMedian:ctl,verdict:gate.verdict,reason:gate.reason};
}
