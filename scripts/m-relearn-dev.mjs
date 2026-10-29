// M-RELEARN Phase-A dev instrument (FROZEN under docs/M_RELEARN_PLAN_V1.md).
// Baselines only: relearning curves on a fresh bank. 4 arms
// (candidate/unlearned/frozen/reset) x 6 histories = 24 mains
// (BT_TICKS=1792), ZERO probes. Per main: phaseRows saved + per-tick observe
// energy binned (32-tick bins) via emit (recording-emit is behavior-identical
// per D1 tests). Criterion: reset-episode ticks-to-80%-of-own-phase-A-max
// (sustained 2 bins, 50%-survivor death guard, censored at 512).
// Phase-B gate: median > 256 in either episode (V1a picks ONE family).
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const R_EXPERIMENT='m-relearn-dev';
export const R_HISTORIES=6;
export const R_ARMS=Object.freeze(['candidate','unlearned','frozen','reset']);
export const R_EXPECT_MAINS=24, R_EXPECT_PROBES=0;
export const R_OP_CAP=20_000_000_000, R_WALL_CAP_SECONDS=3600;
export const R_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>385001+j));
const R_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054]];
export const R_SPENT_SEEDS=Object.freeze([381001,...R_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const R_SUSTAIN_TICKS=8, R_REF_FRAC=0.8, R_EPISODE_TICKS=512;
export const R_MIN_ALIVE_FRAC=0.5;
export const R_CEILING_TICKS=64;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function relearnExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/m-relearn-dev.mjs','docs/M_RELEARN_PLAN_V1.md']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mRelearnDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/m-relearn-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/M_RELEARN_PLAN_V1.md'])visit(resolve(root,name));
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
export function mRelearnDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,R_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of relearnExtraTokens())excluded.add(t);
  for(const s of R_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of R_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=R_FIXTURE_SEEDS.length/R_HISTORIES===9?Array.from({length:R_HISTORIES},(_,h)=>{
    const s=R_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,R_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:R_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'M-RELEARN dev bank (deterministic fresh 385001-385054, 9/history). First use is the single V1a run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Curve collector: per-tick observe energy (raw means+n; V1a stores ticks,
// no pre-binning — binning is what confined Phase A to >=32-tick resolution).
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
// V1a ticks-to-criterion on RAW per-tick curves (pure; exported for smoke).
// Same-context reference: candidate same-tick level. First tick t in the
// episode with t..t+R_SUSTAIN_TICKS-1 ALL satisfying reset>=0.8*candidate
// with >=50% founders alive in BOTH arms; ticks = t - epStart; censored at 512.
export function scoreEpisodeV1a(rMeans,rCounts,cMeans,cCounts,epStart,founders){
  const need=Math.ceil(R_MIN_ALIVE_FRAC*founders);
  const ok=k=>(rCounts[k]??0)>=need&&(cCounts[k]??0)>=need;
  for(let t=epStart;t+R_SUSTAIN_TICKS<=epStart+R_EPISODE_TICKS;t++){
    let pass=true;
    for(let k=t;k<t+R_SUSTAIN_TICKS;k++){
      if(!ok(k)||!(rMeans[k]>=R_REF_FRAC*cMeans[k])){pass=false;break;}
    }
    if(pass)return {ticks:t-epStart,censored:false,reason:'criterion-met'};
  }
  return {ticks:null,censored:true,reason:'never-reached'};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMRelearnDev({bankPath,output,resume=false}){
  const sources=mRelearnDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mRelearnDevBank(bankPathAbs);
  assert.equal(p.histories.length,R_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...R_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'m-relearn-v1a-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...R_ARMS],
      caps:{executions:300,aggregateScalarOperations:R_OP_CAP,wallSeconds:R_WALL_CAP_SECONDS},
      scope:'M-RELEARN V1a single re-measurement (V1a). No tuning; conjunctive V1a verdict decides.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=R_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of R_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,curves:{},phaseRows:null,endpoint:null};
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
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
  assert.deepEqual(mRelearnDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=R_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const verdict=scoreMRelearn(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreMRelearn(rows){
  // V1a: reset episodes B (ticks 512-1023) and C (1024-1535) vs candidate same-tick.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const episodes=[];
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  for(const seed of seeds){
    const rr=byArmSeed['reset:'+seed],cc=byArmSeed['candidate:'+seed];
    if(!rr||!cc)continue;
    for(const [ep,epStart] of [['B',512],['C',1024]]){
      const s=scoreEpisodeV1a(rr.curves.means,rr.curves.counts,cc.curves.means,cc.curves.counts,epStart,BT_FOUNDERS);
      episodes.push({seed,episode:ep,...s});
    }
  }
  const unc=episodes.filter(e=>!e.censored).map(e=>e.ticks);
  const med=a=>{const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
  const median=unc.length?med(unc):null;
  const censored=episodes.filter(e=>e.censored).length;
  // Reported (not gating): frozen decay, candidate ceiling, unlearned floor, return-A rebound (per-tick curves now).
  const gate=median===null
    ?{median,censored,go:false,verdict:'DESIGN-FAILURE',reason:'100% censored again — close line, publish failure'}
    :median<=R_CEILING_TICKS
    ?{median,censored,go:false,verdict:'CEILING-PROVEN',reason:'relearning at/below old resolution floor — close line'}
    :{median,censored,go:true,verdict:'GAP-FOR-V1B',reason:'measurable relearning gap — V1b picks one family'};
  return {episodes,median,censored,gate,verdict:gate.verdict};
}
