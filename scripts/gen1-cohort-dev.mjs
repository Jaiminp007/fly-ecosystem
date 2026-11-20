// GEN1-COHORT Phase-A dev instrument (FROZEN under docs/GEN1_COHORT_PLAN_V1.md).
// Birth-cohort 200-tick survival in one run: early-born (fresh world) vs
// late-born (depleted world) Gen1s, naive throughout (no weight copy).
// Same run = horizon-matched by construction; 200-tick window with born
// <=1592 cap = censoring-proof (all included fully observed). Lineage only
// (no collector, no emit). 2 histories = 2 mains, 0 probes. GO iff pooled
// max/min survival > 1.1 either way; empty window -> NOBIRTHS void.
// Thin n=2. Offspring survival only.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,BT_TICKS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const GC_EXPERIMENT='gen1-cohort-dev';
export const GC_EARLY_MAX=400, GC_LATE_MIN=1200, GC_LATE_MAX=1592, GC_WINDOW=200;
export const GC_MARGIN=1.1;
export const GC_EXPECT_MAINS=2, GC_EXPECT_PROBES=0;
export const GC_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474271+j));
const GC_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[474235,474252],[474253,474270],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045],[490046,490054],[490055,490063]];
export const GC_SPENT_SEEDS=Object.freeze([381001,...GC_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const GC_OP_CAP=20_000_000_000, GC_WALL_CAP_SECONDS=3600;
export const GC_BAR=30;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gcExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-cohort-dev.mjs','docs/GEN1_COHORT_PLAN_V1.md','tests/gen1-cohort-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gcSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-cohort-dev.mjs','scripts/gen1-life-dev.mjs','scripts/gen1-world-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_COHORT_PLAN_V1.md'])visit(resolve(root,name));
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
export function gcBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,GC_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gcExtraTokens())excluded.add(t);
  for(const s of GC_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of GC_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=GC_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=GC_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:GC_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-COHORT V1 dev bank (deterministic fresh 474271-474288, 18 seeds, 2 main histories). Spend: 2 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function cohortSurvival(lineage,endTick){
  // 200-tick survival per birth cohort (early: born<=400 fresh-ish;
  // late: 1200<=born<=1592 deep + fully observable). Pure. Null counts
  // when a window is empty. Censoring-proof: every included Gen1 has
  // >=200 observable ticks (late cap 1592+200=1792=end).
  const early=[],late=[];
  for(const e of lineage){
    if(e.generation!==1||!Number.isInteger(e.born))continue;
    const survived=e.died===null||e.died===undefined?true:(e.died-e.born)>=GC_WINDOW;
    if(e.born<=GC_EARLY_MAX)early.push(survived?1:0);
    else if(e.born>=GC_LATE_MIN&&e.born<=GC_LATE_MAX)late.push(survived?1:0);
  }
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  return {earlyN:early.length,lateN:late.length,
    early:early.length?mean(early):null,late:late.length?mean(late):null};
}
export function runGen1Cohort({bankPath,output,resume=false}){
  const sources=gcSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=gcBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-cohort-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},histories:p.histories.map(h=>h.seed),
      windows:{early:'born<=400',late:'1200<=born<=1592',surviveTicks:GC_WINDOW},transmission:'none',mating:{reproduction:true,matingActionRequired:false,matingEnergyBar:GC_BAR},nutrient:'legacy',
      caps:{executions:300,aggregateScalarOperations:GC_OP_CAP,wallSeconds:GC_WALL_CAP_SECONDS},
      scope:'GEN1-COHORT V1 single attempt. Early-vs-late Gen1 200-tick survival in one run (horizon-matched, toxin-proof). GO iff pooled max/min > x1.1; empty window -> NOBIRTHS void; else NOGO. Offspring survival only.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=GC_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    const {wall}=timed(`run-${h.seed}`,()=>{
      let row=rows.find(r=>r.history.seed===h.seed);
      if(row&&row.endpoint){
        console.log(JSON.stringify({stage:'skip',seed:h.seed,reason:'complete on disk'}));return;
      }
      if(resume)redone.push(`${h.seed}`);
      const run=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,
        reproduction:true,matingActionRequired:false,matingEnergyBar:GC_BAR,verticalTransmission:'none'});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${h.seed}`);
      const cohorts=cohortSurvival(run.world.lineage,run.world.tick);
      row={history:{seed:h.seed},arm:'cohort',stage:'main',cohorts,births:run.world.totals.births,endpoint};
      assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+h.seed);
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${h.seed}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',seed:h.seed,births:row.births,earlyN:cohorts.earlyN,early:cohorts.early,lateN:cohorts.lateN,late:cohorts.late}));
    });
    runtimes[`run-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(gcSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=GC_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,GC_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,GC_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1CohortRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreGen1CohortRows(rows){
  // Pooled early-vs-late 200-tick survival. Either window empty pooled ->
  // void. Two-sided GO iff max/min > x1.1; else NOGO.
  const g1=rows.length===2&&rows.every(r=>r.cohorts&&Number.isInteger(r.births)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
  const pool=w=>{const a=[];for(const r of rows){const c=r.cohorts[w+'N'];const v=r.cohorts[w];for(let i=0;i<c;i++)a.push(v);}return a;};
  const early=pool('early'),late=pool('late');
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const pe=early.length?mean(early):null,pl=late.length?mean(late):null;
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/cohorts)'}
    :(pe===null||pl===null)?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:'a birth window is empty pooled (early n='+early.length+', late n='+late.length+') — no comparison (void, inherit precedent)'}
    :(Math.max(pe,pl)>Math.min(pe,pl)*GC_MARGIN||(Math.min(pe,pl)===0&&Math.max(pe,pl)>0))?{go:true,verdict:'GEN1-COHORT-GO-V1',reason:`birth world matters for Gen1 200-tick survival: early ${pe.toFixed(3)} (n=${early.length}) vs late ${pl.toFixed(3)} (n=${late.length}) (thin n=2 histories, horizon-matched)`}
    :{go:false,verdict:'GEN1-COHORT-NOGO-V1',reason:`birth world does not move Gen1 200-tick survival: early ${pe===null?'null':pe.toFixed(3)} (n=${early.length}) vs late ${pl===null?'null':pl.toFixed(3)} (n=${late.length})`};
  return {early:{n:early.length,rate:pe===null?null:+pe.toFixed(3)},late:{n:late.length,rate:pl===null?null:+pl.toFixed(3)},
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
