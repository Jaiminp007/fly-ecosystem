// MEMORY-RESET Phase-A dev instrument (FROZEN under docs/MEMORY_RESET_PLAN_V1.md).
// Return-A benefit memory-dissociation: 5 arms x 2 histories = 10 mains
// (1792). advance(1536) [A/B/C], per-arm memory op, advance(256) [return-A].
// intact (nothing) / wreset (zero w) / sreset (clear store) / both (engine
// full wipe) / unlearned (naive). Metric: retA food rate (imported backward
// core). GO iff full wipe erases benefit to naive (memory-dependent);
// NOGO iff benefit survives (elsewhere); NOBENEFIT void if intact fails.
// Thin n=2. No transfer/RSI/population claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {resetTasteEnergyBody} from '../learning/taste-energy.mjs';
import {segmentRates} from './taste-backward-dev.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,BT_TICKS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const MR_EXPERIMENT='memory-reset-dev';
export const MR_ARMS=Object.freeze(['intact','wreset','sreset','both','unlearned']);
export const MR_RESET_TICK=1536, MR_RETURN_TICKS=256;
export const MR_MARGIN=1.1;
export const MR_EXPECT_MAINS=10, MR_EXPECT_PROBES=0;
export const MR_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474181+j));
const MR_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045]];
export const MR_SPENT_SEEDS=Object.freeze([381001,...MR_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const MR_OP_CAP=20_000_000_000, MR_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mrExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/memory-reset-dev.mjs','docs/MEMORY_RESET_PLAN_V1.md','tests/memory-reset-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mrSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/memory-reset-dev.mjs','scripts/taste-backward-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/continual-regimes.mjs','learning/taste-pressure.mjs','docs/MEMORY_RESET_PLAN_V1.md'])visit(resolve(root,name));
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
export function mrBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,MR_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mrExtraTokens())excluded.add(t);
  for(const s of MR_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of MR_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=MR_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=MR_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:MR_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MEMORY-RESET V1 dev bank (deterministic fresh 474181-474198, 18 seeds, 2 main histories). Spend: 10 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function zeroWeights(state){
  // Weights-only wipe (taste/actor/critic zeroed; store/eligibility kept).
  // Distinct from engine full reset (which also clears store).
  assert.ok(state&&state.weights);
  for(const k of ['taste','actor','critic'])if(Array.isArray(state.weights[k]))state.weights[k].fill(0);
  return state;
}
export function clearStore(state){
  // Store-only wipe (recent/older/olderSeen cleared; weights kept).
  state.recent=[];state.older=[];state.olderSeen=0;
  return state;
}
export function applyReset(run,arm){
  // Per-arm memory op at return-A start (tick 1536). Pure driver op.
  assert.ok(MR_ARMS.includes(arm));
  if(arm==='intact'||arm==='unlearned')return arm;
  for(const id of Object.keys(run.learners)){
    const st=run.learners[id];
    if(arm==='wreset')zeroWeights(st);
    else if(arm==='sreset')clearStore(st);
    else if(arm==='both')resetTasteEnergyBody(st);
  }
  return arm;
}
export function runMemoryReset({bankPath,output,resume=false}){
  const sources=mrSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mrBank(bankPathAbs);
  assert.equal(p.histories.length,2);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'memory-reset-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...MR_ARMS],histories:p.histories.map(h=>h.seed),
      resetTick:MR_RESET_TICK,margin:MR_MARGIN,
      caps:{executions:300,aggregateScalarOperations:MR_OP_CAP,wallSeconds:MR_WALL_CAP_SECONDS},
      scope:'MEMORY-RESET V1 single attempt. Return-A benefit x memory factorial. GO iff full wipe erases benefit to naive (memory-dependent); NOGO iff benefit survives; NOBENEFIT void if intact fails. No transfer/RSI/population claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=MR_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    const {wall}=timed(`mr-${h.seed}`,()=>{
      for(const arm of MR_ARMS){
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){
          console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${h.seed}:${arm}`);
        const expArm=arm==='unlearned'?'unlearned':'candidate';
        const run=new TasteExperiment({history:h,arm:expArm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        run.advance(MR_RESET_TICK);
        applyReset(run,arm);
        run.advance(MR_RETURN_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${h.seed}`);
        const seg=segmentRates(run.phaseRows);
        row={history:{seed:h.seed},arm,seg,phaseRows:run.phaseRows,endpoint};
        assert.ok(seg&&Number.isFinite(seg.retA.rate)&&Number.isFinite(seg.A.rate),'return segments malformed');
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+h.seed);
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${h.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:h.seed,retA:+seg.retA.rate.toFixed(4)}));
      }
    });
    runtimes[`mr-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(mrSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=MR_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,MR_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,MR_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreMemoryResetRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreMemoryResetRows(rows){
  // Pooled n=2. Guard: intact retA > naive x1.1 (else nothing to erase).
  // GO iff full-wipe (both) retA <= naive x1.1 (memory-dependent).
  // Else NOGO (survives -> elsewhere). Descriptive singles regardless.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===10&&MR_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&r.seg&&Number.isFinite(r.seg.retA.rate)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder);}));
  const mean2=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const pooled=a=>{const vs=seeds.map(s=>{const r=byArmSeed[a+':'+s];return r&&r.seg?r.seg.retA.rate:NaN;});return mean2(vs);};
  const intact=pooled('intact'),un=pooled('unlearned');
  const w=pooled('wreset'),s=pooled('sreset'),b=pooled('both');
  const gate=!g1||![intact,un,w,s,b].every(Number.isFinite)?{go:false,verdict:'INVALID',reason:'integrity failed (mains/segments)'}
    :!(intact>un*MR_MARGIN)?{go:false,verdict:'INCOMPLETE-NOBENEFIT',reason:`return-A benefit did not replicate: intact ${intact.toFixed(4)} <= naive ${un.toFixed(4)} x${MR_MARGIN} (void)`}
    :(b<=un*MR_MARGIN)?{go:true,verdict:'MEMORY-RESET-GO-V1',reason:`full wipe erases benefit to naive: both ${b.toFixed(4)} <= naive ${un.toFixed(4)} x${MR_MARGIN} (memory-dependent; w:${w.toFixed(4)} s:${s.toFixed(4)} vs intact ${intact.toFixed(4)})`}
    :{go:false,verdict:'MEMORY-RESET-NOGO-V1',reason:`benefit survives full wipe: both ${b.toFixed(4)} > naive ${un.toFixed(4)} x${MR_MARGIN} (memory-independent; w:${w.toFixed(4)} s:${s.toFixed(4)} vs intact ${intact.toFixed(4)})`};
  return {perArm:Object.fromEntries(MR_ARMS.map(a=>[a,+pooled(a).toFixed(4)])),
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
