// RETENTION-READAPT Phase-A dev instrument (FROZEN under docs/RETENTION_READAPT_PLAN_V1.md).
// Live A-readaptation during B via replay-diverge: per arm, 5 runs replay
// A->B deterministically to tick T in {512,640,768,896,1024}, then THAT run
// switches to A-regime (direct enterCuePhase, same mapping family) and
// measures 128 ticks WITH LEARNING ON (candidate never frozen; unlearned
// UNFROZEN at switch, acquisition=true — fair live baseline). Same positions,
// same depletion; weights + learning differ. Tests whether B-training helps
// live A-recovery (content+dynamics) vs pure live relearning (dynamics).
// 2 pairs x (5 T x 2 arms) = 20 mains, 0 probes. GO iff pooled T=1024 AND
// pooled mean-during-B exceed matched unlearned x1.1; baseline T=512 must
// exceed unlearned x1.1 else INCOMPLETE-NOLEARN. Pre-registered: GO means
// live cope, NOT weight retention (frozen cells voided; M-RELEARN ceiling).
// Thin n=2. Retention only; no transfer/RSI/population claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {enterCuePhase} from '../learning/cue-foraging.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const RR_EXPERIMENT='retention-readapt-dev';
export const RR_PAIRS=2;
export const RR_ARMS=Object.freeze(['candidate','unlearned']);
export const RR_SWITCH_TICKS=Object.freeze([512,640,768,896,1024]);
export const RR_MEASURE_TICKS=128;
export const RR_MARGIN=1.1;
export const RR_EXPECT_MAINS=20, RR_EXPECT_PROBES=0;
export const RR_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474091+j));
export const RR_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490010+j));
const RR_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[490001,490009],[490010,490018]];
export const RR_SPENT_SEEDS=Object.freeze([381001,...RR_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const RR_OP_CAP=20_000_000_000, RR_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function rrExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/retention-readapt-dev.mjs','docs/RETENTION_READAPT_PLAN_V1.md','tests/retention-readapt-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rrSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/retention-readapt-dev.mjs','scripts/retention-during-dev.mjs','scripts/taste-backward-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/cue-foraging.mjs','learning/continual-regimes.mjs','learning/taste-pressure.mjs','docs/RETENTION_READAPT_PLAN_V1.md'])visit(resolve(root,name));
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
export function rrBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,RR_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of rrExtraTokens())excluded.add(t);
  for(const s of RR_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of RR_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=RR_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=RR_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:RR_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RETENTION-READAPT V1 dev bank (deterministic fresh 474091-474108, 18 seeds, 2 main histories). Spend: 20 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function branchRate(foodStart,tickStart,foodEnd,tickEnd){
  // Colony food per tick over the frozen A-measure (live world). Pure.
  assert.ok(Number.isFinite(foodStart)&&Number.isFinite(foodEnd));
  assert.ok(Number.isFinite(tickStart)&&Number.isFinite(tickEnd)&&tickEnd>tickStart);
  assert.ok(foodEnd>=foodStart,'food totals must not decrease over the measure');
  return (foodEnd-foodStart)/(tickEnd-tickStart);
}
export function runOne(history,arm,switchTick){
  // Single replay-diverge run: advance(switchTick) on auto A/B, switch THAT
  // run to A-regime, freeze, measure RR_MEASURE_TICKS live. Returns row
  // (no disk). Pure driver op (worlds run here — triage/bank only).
  assert.ok(RR_SWITCH_TICKS.includes(switchTick));
  const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
  run.advance(switchTick);
  const e0=run.endpoint();
  const energyBefore=run.world.energy();
  run.resource=enterCuePhase(run.world,CONTINUAL_PHASES[0],history.resourceSeeds[0],run.codebook);
  assert.equal(run.world.energy(),energyBefore,'regime switch must preserve world energy');
  run.phaseEnd=1e9;
  for(const id of Object.keys(run.learners)){
    if(arm==='unlearned')run.learners[id].acquisition=true;
  }
  run.advance(RR_MEASURE_TICKS);
  const e1=run.endpoint();checkMainIntegrity(e1,`${arm}/${history.seed}:T${switchTick}`);
  const rate=branchRate(e0.totals.foodEaten,e0.tick,e1.totals.foodEaten,e1.tick);
  assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed+':T'+switchTick);
  return {history:{seed:history.seed},arm,stage:'main',switchTick,foodRate:rate,endpoint:e1,
    trainTicks:switchTick,measureTicks:RR_MEASURE_TICKS};
}
export function runRetentionReadapt({bankPath,output,resume=false}){
  const sources=rrSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rrBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'retention-readapt-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:'T+128',founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...RR_ARMS],histories:p.histories.map(h=>h.seed),switchTicks:[...RR_SWITCH_TICKS],
      measureTicks:RR_MEASURE_TICKS,margin:RR_MARGIN,
      caps:{executions:300,aggregateScalarOperations:RR_OP_CAP,wallSeconds:RR_WALL_CAP_SECONDS},
      scope:'RETENTION-READAPT V1 single attempt. Live A-readaptation during B via replay-diverge (learning on, unlearned unfreezes at switch). GO iff pooled T=1024 AND pooled mean-during-B exceed matched live naive x1.1; baseline T=512 must exceed naive x1.1 else INCOMPLETE-NOLEARN; else NOGO. GO means live cope, not weight retention. Retention only.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*(1024+RR_MEASURE_TICKS)+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=RR_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    for(const arm of RR_ARMS){
      const {wall}=timed(`run-${h.seed}-${arm}`,()=>{
        for(const t of RR_SWITCH_TICKS){
          let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm&&r.switchTick===t);
          if(row&&row.endpoint){
            console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,switchTick:t,reason:'complete on disk'}));continue;
          }
          if(resume)redone.push(`${h.seed}:${arm}:T${t}`);
          row=runOne(h,arm,t);
          note(1,0,t+RR_MEASURE_TICKS,row.endpoint.scalarOperations);
          rows.push(row);
          writeOver(join(outputAbs,'rows',`${h.seed}-${arm}-T${t}.json`),row);
          checkpointLedger();
          console.log(JSON.stringify({stage:'world',arm,seed:h.seed,switchTick:t,foodRate:+row.foodRate.toFixed(4)}));
        }
      });
      runtimes[`run-${h.seed}-${arm}`]=wall;checkpointLedger();
    }
  }
  assert.deepEqual(rrSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=RR_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,RR_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,RR_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreRetentionReadaptRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreRetentionReadaptRows(rows){
  // Online A-retention during B, pooled over pairs, matched-T unlearned.
  // Baseline T=512 must exceed naive x1.1 (else no skill to retain -> void).
  // GO iff pooled T=1024 AND pooled mean-during-B (640/768/896/1024) exceed
  // matched naive x1.1; else NOGO. All-zero -> INVALID.
  const byArmT={};
  for(const r of rows){
    if(r.stage!=='main'||!r.endpoint)continue;
    byArmT[r.arm+':'+r.switchTick]=byArmT[r.arm+':'+r.switchTick]??[];
    byArmT[r.arm+':'+r.switchTick].push(r.foodRate);
  }
  const pooled=(arm,t)=>{const a=byArmT[arm+':'+t];assert.ok(a&&a.length===2,'missing pair for '+arm+':T'+t);return (a[0]+a[1])/2;};
  const g1=rows.length===20&&RR_SWITCH_TICKS.every(t=>byArmT['candidate:'+t]&&byArmT['candidate:'+t].length===2&&byArmT['unlearned:'+t]&&byArmT['unlearned:'+t].length===2)&&
    rows.every(r=>Number.isFinite(r.foodRate)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
  const allZero=g1&&rows.every(r=>r.foodRate===0);
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const baseline=pooled('candidate',512),unBase=pooled('unlearned',512);
  const postB=pooled('candidate',1024),unPost=pooled('unlearned',1024);
  const duringB=mean([640,768,896,1024].map(t=>pooled('candidate',t)));
  const unDuring=mean([640,768,896,1024].map(t=>pooled('unlearned',t)));
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/foodRates)'}
    :allZero?{go:false,verdict:'INVALID',reason:'all-zero feeding (instrument failure)'}
    :!(baseline>unBase*RR_MARGIN)?{go:false,verdict:'INCOMPLETE-NOLEARN',reason:`no live A-skill to test: pooled T=512 food rate ${baseline.toFixed(4)} <= live naive ${unBase.toFixed(4)} x${RR_MARGIN} (void)`}
    :(postB>unPost*RR_MARGIN&&duringB>unDuring*RR_MARGIN)?{go:true,verdict:'RETENTION-READAPT-GO-V1',reason:`A-skill readapts live during B: pooled T=1024 ${postB.toFixed(4)} and mean-during-B ${duringB.toFixed(4)} exceed matched live naive ${unPost.toFixed(4)}/${unDuring.toFixed(4)} x${RR_MARGIN} (thin n=2, live cope — not weight retention)`}
    :{go:false,verdict:'RETENTION-READAPT-NOGO-V1',reason:`A-skill does not readapt live during B: pooled T=1024 ${postB.toFixed(4)} vs live naive ${unPost.toFixed(4)}, mean-during-B ${duringB.toFixed(4)} vs live naive ${unDuring.toFixed(4)} (x${RR_MARGIN})`};
  return {perT:Object.fromEntries(RR_SWITCH_TICKS.map(t=>[t,{cand:+pooled('candidate',t).toFixed(4),un:+pooled('unlearned',t).toFixed(4)}])),
    pooled:{baseline:+baseline.toFixed(4),postB:+postB.toFixed(4),duringB:+duringB.toFixed(4)},
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
