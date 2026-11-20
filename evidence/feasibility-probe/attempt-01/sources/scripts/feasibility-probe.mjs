// Birth-feasibility probe (frozen plan docs/FEASIBILITY_PROBE_PLAN_V1.md).
// Single authorized micro-run: 2 histories x {24, 8 founders} = 4 mains,
// zero probes. Question: can births happen AT ALL here? Collector tracks
// per-tick MAX own.energy (recording-emit only, behavior-neutral per D1).
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

export const F_EXPERIMENT='feasibility-probe';
export const F_HISTORIES=2;
export const F_CONFIGS=Object.freeze([{tag:'founders-24',founders:24},{tag:'founders-8',founders:8}]);
export const F_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>395001+j));
const F_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],
  [384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054]];
export const F_SPENT_SEEDS=Object.freeze([381001,...F_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const F_EXPECT_MAINS=4, F_EXPECT_PROBES=0;
export const F_OP_CAP=20_000_000_000, F_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function feasExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/feasibility-probe.mjs','docs/FEASIBILITY_PROBE_PLAN_V1.md','tests/feasibility-probe.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function feasBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,F_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of feasExtraTokens())excluded.add(t);
  for(const s of F_SPENT_SEEDS)excluded.add(s);
  const prior=new Set();
  const seedWalk=(v,k)=>{if(Array.isArray(v))for(const x of v)seedWalk(x,k);
    else if(v&&typeof v==='object')for(const[kk,vv]of Object.entries(v))seedWalk(vv,/seed/i.test(kk)?kk:k);
    else if(/seed/i.test(k)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)prior.add(v);};
  const walkFs=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);
    if(e.isDirectory())walkFs(p);else if(p.endsWith('.json')){try{seedWalk(JSON.parse(readFileSync(p,'utf8')),'');}catch{}}}};
  walkFs(join(root,'evidence'));
  for(const s of F_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=F_FIXTURE_SEEDS.length/F_HISTORIES===9?Array.from({length:F_HISTORIES},(_,h)=>{
    const s=F_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,F_HISTORIES*9,'Dev bank must be 18 unique seeds');
  const p={schema:1,experiment:F_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'Feasibility probe bank (deterministic fresh 395001-395018, 9/history). First use is the single probe run; any exposure spends it.'};
  write(path,p);return p;
}
// Per-tick max-own-energy collector (recording only; proven neutral).
export function collectMaxEnergy(){
  let max=-Infinity,over65=0,ticks=0;
  const seen=new Set();
  const emit=e=>{
    if(e.type!=='observe'||!e.own||!Number.isInteger(e.own.tick)||!Number.isFinite(e.own.energy))return;
    const k=e.own.tick;
    if(!seen.has(k)){seen.add(k);ticks++;}
    if(e.own.energy>max)max=e.own.energy;
  };
  return {emit,summarize:()=>({max:max===-Infinity?null:max,ticks,fracOver65:null})};
}
export function scoreFeasibility(rows){
  // rows: [{tag,history:{seed},endpoint:{totals:{births}},maxEnergy,fracOver65?}]
  const births=rows.reduce((x,r)=>x+(r.endpoint?.totals?.births??0),0);
  const maxE=Math.max(...rows.map(r=>r.maxEnergy??-Infinity));
  if(births>=1)return {go:true,verdict:'FEASIBLE',births,maxE,reason:'>=1 birth observed; M-POP V1b may be proposed'};
  if(maxE<65)return {go:false,verdict:'INFEASIBLE-ENERGETIC',births,maxE,
    reason:'max per-tick own.energy never reached the 65 birth threshold — structurally sterile'};
  return {go:false,verdict:'INFEASIBLE-BEHAVIORAL',births,maxE,
    reason:'energy reached 65+ but no birth completed — mating/behavioral bottleneck'};
}
export function feasDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['\"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/feasibility-probe.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/feasibility-probe.test.mjs','docs/FEASIBILITY_PROBE_PLAN_V1.md'])visit(resolve(root,name));
  return found;
}
export function runFeasProbe({bankPath,output,resume=false}){
  const sources=feasDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=feasBank(bankPathAbs);
  assert.equal(p.histories.length,F_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...F_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'feasibility-probe-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:'6,8-mixed',
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:['candidate'],
      caps:{executions:300,aggregateScalarOperations:F_OP_CAP,wallSeconds:F_WALL_CAP_SECONDS},
      scope:'Feasibility probe single run (V1). No qual spent; conjunctive G1+decision decide.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops,founders)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS)*founders;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=F_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const seen=new Set(rows.map(r=>r.history.seed+':'+r.tag));
  for(const cfg of F_CONFIGS){
    const {wall,cpuS}=timed(cfg.tag,()=>{
      for(const history of p.histories){
        if(seen.has(history.seed+':'+cfg.tag)){console.log(JSON.stringify({stage:'skip',tag:cfg.tag,seed:history.seed,reason:'complete on disk'}));continue;}
        if(resume)redone.push(`${history.seed}:${cfg.tag}`);
        const collector=collectMaxEnergy();
        const run=new TasteExperiment({history,arm:'candidate',reference:{...VALUE_REFERENCE,founders:cfg.founders},learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();
        assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${cfg.tag}/${history.seed}: physical conservation failed`);
        assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${cfg.tag}/${history.seed}: main op ceiling breached`);
        const row={history:{seed:history.seed},tag:cfg.tag,endpoint,maxEnergy:collector.summarize().max,founderCount:cfg.founders};
        note(1,0,BT_TICKS,endpoint.scalarOperations,cfg.founders);
        rows.push(row);seen.add(history.seed+':'+cfg.tag);
        writeOver(join(outputAbs,'rows',`${history.seed}-${cfg.tag}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',tag:cfg.tag,seed:history.seed,births:endpoint.totals.births,energy:endpoint.budgetAdjustedEnergyPerFounder}));
      }
    });
    runtimes[cfg.tag]={wall,cpuS};checkpointLedger();
  }
  assert.deepEqual(feasDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=F_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const verdict=scoreFeasibility(rows);
  assert.equal(ledger.mains,F_EXPECT_MAINS,'Dev mains count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
