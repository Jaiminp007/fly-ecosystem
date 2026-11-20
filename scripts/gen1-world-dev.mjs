// GEN1-WORLD Phase-A dev instrument (FROZEN under docs/GEN1_WORLD_PLAN_V1.md).
// Naive-offspring foraging in deep vs shallow parental worlds (no copy)
// (naive newborns): 2 histories x 2 arms = 4 mains (1792 ticks), 0 probes.
// Matched founders (both learn) isolate offspring weight content. Collector
// sums per-agent lifetime food from observe events; lineage maps id->
// generation; metric = mean Gen1 lifetime food. Legacy nutrients (not the
// compound window), decoupled bar-50 mating (inherit-V1 proven births).
// GO iff pooled Gen1 food > pooled naive x1.1; Gen1==0 anywhere
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

export const GW_EXPERIMENT='gen1-world-dev';
export const GW_ARMS=Object.freeze(['deep','shallow']);
export const GW_MARGIN=1.1;
export const GW_EXPECT_MAINS=4, GW_EXPECT_PROBES=0;
export const GW_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474235+j));
export const GW_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490046+j));
const GW_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045],[490046,490054]];
export const GW_SPENT_SEEDS=Object.freeze([381001,...GW_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const GW_OP_CAP=20_000_000_000, GW_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gwExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-world-dev.mjs','docs/GEN1_WORLD_PLAN_V1.md','tests/gen1-world-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gwSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-world-dev.mjs','scripts/mate-inherit-dev.mjs','scripts/mate-social-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_WORLD_PLAN_V1.md'])visit(resolve(root,name));
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
export function gwBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,GW_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gwExtraTokens())excluded.add(t);
  for(const s of GW_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of GW_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=GW_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=GW_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:GW_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-WORLD V1 dev bank (deterministic fresh 474235-474252, 18 seeds, 2 main histories). Spend: 4 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
}
export function summarizeGen1Rate(foodByAgent,lineage,endTick){
  // Mean food per tick alive over generation-1 agents. Pure. Null when no
  // Gen1. Normalizes lifespan/horizon (deep vs shallow worlds).
  let n=0,sum=0;
  for(const e of lineage){
    if(e.generation!==1)continue;
    const died=Number.isInteger(e.died)?e.died:endTick;
    const alive=Math.max(1,died-(e.born??0));
    n++;sum+=(foodByAgent[e.id]??0)/alive;
  }
  if(n===0)return null;
  return {n,mean:sum/n};
}
export const GW_TICKS=Object.freeze({deep:1792,shallow:512});
export const GW_BAR=30;
export function runOne(history,arm){
  // Single matched-founder run: founders learn; newborns always naive
  // ('none' — no weight copy anywhere). Collector sums lifetime food per
  // agent; lineage isolates Gen1; rate normalizes lifespan. The arms differ
  // ONLY in world depth (ticks). Returns row (no disk).
  assert.ok(GW_ARMS.includes(arm));
  const ticks=GW_TICKS[arm];
  const foodByAgent={};
  const emit=e=>{if(e&&e.type==='observe'&&e.own&&Number.isInteger(e.own.agentId)&&Number.isFinite(e.own.lastFood))foodByAgent[e.own.agentId]=(foodByAgent[e.own.agentId]??0)+e.own.lastFood;};
  const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit,
    reproduction:true,matingActionRequired:false,matingEnergyBar:GW_BAR,verticalTransmission:'none'});
  run.advance(ticks);
  const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
  const gen1=summarizeGen1Rate(foodByAgent,run.world.lineage,run.world.tick);
  const births=run.world.totals.births;
  assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+births,'Founder accounting broken for '+arm+'/'+history.seed);
  return {history:{seed:history.seed},arm,stage:'main',ticks,transmission:'none',
    births,gen1n:gen1?gen1.n:0,gen1rate:gen1?gen1.mean:null,endpoint};
}
export function runGen1World({bankPath,output,resume=false}){
  const sources=gwSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=gwBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-world-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:{...GW_TICKS},founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...GW_ARMS],histories:p.histories.map(h=>h.seed),
      transmission:'none',mating:{reproduction:true,matingActionRequired:false,matingEnergyBar:GW_BAR},nutrient:'legacy',
      caps:{executions:300,aggregateScalarOperations:GW_OP_CAP,wallSeconds:GW_WALL_CAP_SECONDS},
      scope:'GEN1-WORLD V1 single attempt. Naive Gen1 food-rate in deep (1792) vs shallow (512) parental worlds, no weight copy. GO iff max/min > x1.1 either way (world matters); Gen1==0 anywhere -> INCOMPLETE-NOBIRTHS; else NOGO. World effect only.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=GW_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    for(const arm of GW_ARMS){
      const {wall}=timed(`run-${h.seed}-${arm}`,()=>{
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){
          console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));return;
        }
        if(resume)redone.push(`${h.seed}:${arm}`);
        row=runOne(h,arm);
        note(1,0,GW_TICKS[arm],row.endpoint.scalarOperations);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${h.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:h.seed,births:row.births,gen1n:row.gen1n,gen1rate:row.gen1rate===null?null:+row.gen1rate.toFixed(4)}));
      });
      runtimes[`run-${h.seed}-${arm}`]=wall;checkpointLedger();
    }
  }
  assert.deepEqual(gwSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=GW_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,GW_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,GW_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1WorldRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreGen1WorldRows(rows){
  // Naive Gen1 food-rate in deep vs shallow parental worlds, pooled over
  // pairs. Gen1==0 anywhere -> void (mechanism untested). Two-sided GO
  // iff max/min > x1.1 (world matters either way); else NOGO.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===4&&GW_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&Number.isInteger(r.births)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder);}));
  const val=(a,s)=>{const r=byArmSeed[a+':'+s];return r&&Number.isFinite(r.gen1rate)?r.gen1rate:null;};
  const complete=g1&&seeds.every(s=>val('deep',s)!==null&&val('shallow',s)!==null);
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const pooled=a=>mean(seeds.map(s=>val(a,s)));
  const anyZeroGen1=g1&&seeds.some(s=>{const r=byArmSeed['deep:'+s],u=byArmSeed['shallow:'+s];return r.gen1n===0||u.gen1n===0;});
  const hi=complete?Math.max(pooled('deep'),pooled('shallow')):null;
  const lo=complete?Math.min(pooled('deep'),pooled('shallow')):null;
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/births/endpoints)'}
    :anyZeroGen1?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:'Gen1==0 in some arm:history — no offspring to score (void, inherit precedent)'}
    :!complete?{go:false,verdict:'INVALID',reason:'gen1 rate missing (collector/lineage failure)'}
    :(hi>lo*GW_MARGIN)?{go:true,verdict:'GEN1-WORLD-GO-V1',reason:`parental world depth moves naive Gen1 foraging: deep ${pooled('deep').toFixed(4)} vs shallow ${pooled('shallow').toFixed(4)} (ratio ${(hi/lo).toFixed(2)}x, thin n=2, world effect)`}
    :{go:false,verdict:'GEN1-WORLD-NOGO-V1',reason:`parental world depth does not move naive Gen1 foraging: deep ${pooled('deep').toFixed(4)} vs shallow ${pooled('shallow').toFixed(4)} (x${GW_MARGIN})`};
  return {perSeed:Object.fromEntries(seeds.map(s=>[s,{deep:val('deep',s)===null?null:+val('deep',s).toFixed(4),shallow:val('shallow',s)===null?null:+val('shallow',s).toFixed(4)}])),
    pooled:{deep:complete?+pooled('deep').toFixed(4):null,shallow:complete?+pooled('shallow').toFixed(4):null},
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
