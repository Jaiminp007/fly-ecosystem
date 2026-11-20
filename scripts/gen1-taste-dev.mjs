// GEN1-TASTE Phase-A dev instrument (FROZEN under docs/GEN1_TASTE_PLAN_V1.md).
// Offspring taste under copybest (exact best-founder weights) vs unlearned
// (naive newborns): 2 histories x 2 arms = 4 mains (1792 ticks), 0 probes.
// Matched founders (both learn) isolate offspring weight content. Collector
// sums per-agent lifetime food from observe events; lineage maps id->
// generation; metric = mean Gen1 lifetime food. Legacy nutrients (not the
// compound window), decoupled bar-50 mating (inherit-V1 proven births).
// GO iff pooled copybest Gen1 food > pooled naive x1.1; Gen1==0 anywhere
// -> INCOMPLETE-NOBIRTHS. Thin n=2. Offspring taste only.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const GT_EXPERIMENT='gen1-taste-dev';
export const GT_ARMS=Object.freeze(['copybest','unlearned']);
export const GT_TX=Object.freeze({copybest:'copybest',unlearned:'none'});
export const GT_TICKS=1792;
export const GT_MARGIN=1.1;
export const GT_EXPECT_MAINS=4, GT_EXPECT_PROBES=0;
export const GT_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474145+j));
export const GT_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490028+j));
const GT_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[490001,490009],[490010,490018],[490019,490027],[490028,490036]];
export const GT_SPENT_SEEDS=Object.freeze([381001,...GT_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const GT_OP_CAP=20_000_000_000, GT_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gtExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-taste-dev.mjs','docs/GEN1_TASTE_PLAN_V1.md','tests/gen1-taste-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gtSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-taste-dev.mjs','scripts/mate-inherit-dev.mjs','scripts/mate-social-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_TASTE_PLAN_V1.md'])visit(resolve(root,name));
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
export function gtBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,GT_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gtExtraTokens())excluded.add(t);
  for(const s of GT_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of GT_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=GT_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=GT_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:GT_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-TASTE V1 dev bank (deterministic fresh 474145-474162, 18 seeds, 2 main histories). Spend: 4 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
}
export function summarizeGen1Food(foodByAgent,lineage){
  // Mean lifetime food per generation-1 agent. Pure. Null when no Gen1.
  let n=0,sum=0;
  for(const e of lineage){
    if(e.generation!==1)continue;
    n++;sum+=foodByAgent[e.id]??0;
  }
  if(n===0)return null;
  return {n,mean:sum/n};
}
export function runOne(history,arm){
  // Single matched-founder run: founders learn; newborns get best-copy
  // (copybest, exact) or naive (unlearned). Collector sums lifetime food
  // per agent; lineage isolates Gen1. Returns row (no disk).
  assert.ok(GT_ARMS.includes(arm));
  const foodByAgent={};
  const emit=e=>{if(e&&e.type==='observe'&&e.own&&Number.isInteger(e.own.agentId)&&Number.isFinite(e.own.lastFood))foodByAgent[e.own.agentId]=(foodByAgent[e.own.agentId]??0)+e.own.lastFood;};
  const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit,
    reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:GT_TX[arm]});
  run.advance(GT_TICKS);
  const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
  const gen1=summarizeGen1Food(foodByAgent,run.world.lineage);
  const births=run.world.totals.births;
  assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+births,'Founder accounting broken for '+arm+'/'+history.seed);
  return {history:{seed:history.seed},arm,stage:'main',transmission:GT_TX[arm],
    births,gen1n:gen1?gen1.n:0,gen1food:gen1?gen1.mean:null,endpoint};
}
export function runGen1Taste({bankPath,output,resume=false}){
  const sources=gtSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=gtBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-taste-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:GT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...GT_ARMS],histories:p.histories.map(h=>h.seed),
      transmission:{...GT_TX},mating:{reproduction:true,matingActionRequired:false,matingEnergyBar:50},nutrient:'legacy',
      caps:{executions:300,aggregateScalarOperations:GT_OP_CAP,wallSeconds:GT_WALL_CAP_SECONDS},
      scope:'GEN1-TASTE V1 single attempt. Copybest-exact vs naive Gen1 lifetime food, matched founders. GO iff pooled copybest > pooled naive x1.1; Gen1==0 anywhere -> INCOMPLETE-NOBIRTHS; else NOGO. Offspring taste only.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*GT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=GT_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    for(const arm of GT_ARMS){
      const {wall}=timed(`run-${h.seed}-${arm}`,()=>{
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){
          console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));return;
        }
        if(resume)redone.push(`${h.seed}:${arm}`);
        row=runOne(h,arm);
        note(1,0,GT_TICKS,row.endpoint.scalarOperations);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${h.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:h.seed,births:row.births,gen1n:row.gen1n,gen1food:row.gen1food===null?null:+row.gen1food.toFixed(4)}));
      });
      runtimes[`run-${h.seed}-${arm}`]=wall;checkpointLedger();
    }
  }
  assert.deepEqual(gtSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=GT_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,GT_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,GT_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1TasteRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreGen1TasteRows(rows){
  // Copybest-exact vs naive Gen1 lifetime food, pooled over pairs.
  // Gen1==0 anywhere -> void (mechanism untested). GO iff pooled copybest
  // exceeds pooled naive x1.1; else NOGO.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===4&&GT_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&Number.isInteger(r.births)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder);}));
  const val=(a,s)=>{const r=byArmSeed[a+':'+s];return r&&Number.isFinite(r.gen1food)?r.gen1food:null;};
  const complete=g1&&seeds.every(s=>val('copybest',s)!==null&&val('unlearned',s)!==null);
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const pooled=a=>mean(seeds.map(s=>val(a,s)));
  const anyZeroGen1=g1&&seeds.some(s=>{const r=byArmSeed['copybest:'+s],u=byArmSeed['unlearned:'+s];return r.gen1n===0||u.gen1n===0;});
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/births/endpoints)'}
    :anyZeroGen1?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:'Gen1==0 in some arm:history — no offspring to score (void, inherit precedent)'}
    :!complete?{go:false,verdict:'INVALID',reason:'gen1 food missing (collector/lineage failure)'}
    :(pooled('copybest')>pooled('unlearned')*GT_MARGIN)?{go:true,verdict:'GEN1-TASTE-GO-V1',reason:`copybest Gen1 out-forages naive: pooled ${pooled('copybest').toFixed(4)} vs ${pooled('unlearned').toFixed(4)} x${GT_MARGIN} (thin n=2, offspring taste only)`}
    :{go:false,verdict:'GEN1-TASTE-NOGO-V1',reason:`copybest Gen1 does not out-forage naive: pooled ${pooled('copybest').toFixed(4)} vs ${pooled('unlearned').toFixed(4)} (x${GT_MARGIN})`};
  return {perSeed:Object.fromEntries(seeds.map(s=>[s,{copybest:val('copybest',s)===null?null:+val('copybest',s).toFixed(4),unlearned:val('unlearned',s)===null?null:+val('unlearned',s).toFixed(4)}])),
    pooled:{copybest:complete?+pooled('copybest').toFixed(4):null,unlearned:complete?+pooled('unlearned').toFixed(4):null},
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
