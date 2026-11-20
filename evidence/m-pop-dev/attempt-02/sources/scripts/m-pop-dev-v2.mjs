// M-POP Phase-A dev instrument V2 (FROZEN under docs/M_POP_PLAN_V2.md).
// Bar-50 feasibility re-test: V1+V1a verbatim EXCEPT matingEnergyBar 65 -> 50
// (HELD from MATE-ENERGY bar50, not tuned). 3 arms (candidate/unlearned/frozen)
// x 6 histories = 18 mains max, ZERO probes. Stage 0: history-0 triple first;
// INVALID-FEASIBLE (halt, no Phase 1) on zero births. Scorer imported from the
// frozen V1 instrument (identical V1a bars: G2 candidate-unlearned >= +0.15,
// G3 breadth OR generation). No engine work: reproduction flag + syncNewbornLearners
// + matingEnergyBar passthrough all shipped and null-default verified.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {scoreMpop} from './m-pop-dev.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const P2_EXPERIMENT='m-pop-dev-v2';
export const P2_HISTORIES=6;
export const P2_ARMS=Object.freeze(['candidate','unlearned','frozen']);
export const P2_MATING_ENERGY_BAR=50;
export const P2_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>445001+j));
const P2_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[393001,393054],[395001,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[418001,418054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[442001,442054],[443001,443054],[444001,444054]];
export const P2_SPENT_SEEDS=Object.freeze([381001,...P2_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const P2_EXPECT_MAINS=18, P2_EXPECT_PROBES=0;
export const P2_OP_CAP=20_000_000_000, P2_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function popV2ExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/m-pop-dev-v2.mjs','docs/M_POP_PLAN_V2.md','tests/m-pop-dev-v2.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mPopDevV2Sources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/m-pop-dev-v2.mjs','scripts/m-pop-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/m-pop-dev-v2.test.mjs','docs/M_POP_PLAN_V2.md','docs/M_POP_PLAN_V1.md','docs/M_POP_PLAN_V1A.md'])visit(resolve(root,name));
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
export function mPopDevV2Bank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,P2_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of popV2ExtraTokens())excluded.add(t);
  for(const s of P2_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of P2_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=P2_FIXTURE_SEEDS.length/P2_HISTORIES===9?Array.from({length:P2_HISTORIES},(_,h)=>{
    const s=P2_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,P2_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:P2_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'M-POP Phase-A dev bank V2 (deterministic fresh 445001-445054, 9/history). First use is the single V2 attempt; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMPopDevV2({bankPath,output,resume=false}){
  const sources=mPopDevV2Sources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mPopDevV2Bank(bankPathAbs);
  assert.equal(p.histories.length,P2_HISTORIES);
  // Fixture AFTER bank build (standing order).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...P2_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'m-pop-phaseA-attempt-v2',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...P2_ARMS],matingEnergyBar:P2_MATING_ENERGY_BAR,
      caps:{executions:300,aggregateScalarOperations:P2_OP_CAP,wallSeconds:P2_WALL_CAP_SECONDS},
      scope:'M-POP Phase-A single lineage run V2 (bar-50 feasibility re-test): V1a-verbatim 3-arm grid except matingEnergyBar 65 -> 50 (HELD from MATE-ENERGY bar50). Stage-0 triple gates; conjunctive G1-G5 decide; closes either way; no Phase Q without a new frozen plan.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=P2_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const perLine=(run)=>{
    const byId=new Map(run.world.lineage.map(l=>[l.id,l]));
    const alive=new Set(run.world.flies.map(f=>f.id));
    const kids={};for(const l of run.world.lineage)for(const par of l.parents??[])(kids[par]??=[]).push(l.id);
    const desc=id=>{const out=[];const q=[...(kids[id]??[])];while(q.length){const c=q.pop();out.push(c);q.push(...(kids[c]??[]));}return out;};
    return run.founderIds.map(id=>{
      const ds=desc(id),live=ds.filter(d=>alive.has(d));
      const gens=[0,...ds.map(d=>byId.get(d)?.generation??0)];
      return {a:(alive.has(id)||live.length>0)?1:0,d:live.length,g:Math.max(...gens)};
    });
  };
  const runOne=(history,arm)=>{
    let row=rows.find(r=>r.history.seed===history.seed&&r.tag===arm);
    if(row&&row.perLine){
      console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`${history.seed}:${arm}`);
    row=row??{history:{seed:history.seed},tag:arm,arms:{},perLine:null,endpoint:null,ledger:{}};
    const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingEnergyBar:P2_MATING_ENERGY_BAR});
    run.advance(BT_TICKS);
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
    row.endpoint=endpoint;row.perLine=perLine(run);
    row.ledger={births:endpoint.totals.births,deaths:endpoint.totals.deaths};
    note(1,0,BT_TICKS,endpoint.scalarOperations);
    if(!rows.includes(row))rows.push(row);
    writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',arm,seed:history.seed,babies:endpoint.totals.births,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    return row;
  };
  const runAllHistories=(histories)=>{
    for(const arm of P2_ARMS){
      const {wall,cpuS}=timed(`${arm}`,()=>{
        for(const history of histories)runOne(history,arm);
      });
      runtimes[arm]=(runtimes[arm]??{wall:0,cpuS:0});
      runtimes[arm].wall+=wall;runtimes[arm].cpuS+=cpuS;checkpointLedger();
    }
  };
  // Stage 0: history-0 triple first. Feasibility gate before spending the bank.
  runAllHistories([p.histories[0]]);
  {
    const s0=rows.filter(r=>r.history.seed===p.histories[0].seed);
    assert.equal(s0.length,P2_ARMS.length,'Stage-0 triple incomplete');
    const b0=s0.reduce((x,r)=>x+(r.endpoint?.totals?.births??0),0);
    if(b0<1){
      checkpointLedger();
      const verdict={stage:'stage-0',go:false,verdict:'INVALID-FEASIBLE',reason:'zero births on the history-0 triple (all 3 arms run to completion). Line closed without spending the bank.',births:b0};
      writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
        executionSources:read(join(outputAbs,'attempt.json')).sourceSha256,scoringSources:sources});
      throw new Error('STAGE-0 FAIL: zero births on the first-history triple. INVALID-FEASIBLE.');
    }
  }
  // Stage 1: remaining histories.
  runAllHistories(p.histories.slice(1));
  assert.deepEqual(mPopDevV2Sources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=P2_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const totalBirths=rows.reduce((x,r)=>x+(r.endpoint?.totals?.births??0),0);
  const decision={...scoreMpop(rows,totalBirths),ledger};
  assert.equal(ledger.mains,P2_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,P2_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return decision;
}
