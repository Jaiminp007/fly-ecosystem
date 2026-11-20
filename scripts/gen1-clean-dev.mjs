// GEN1-CLEAN Phase-A dev instrument (FROZEN under docs/GEN1_CLEAN_PLAN_V1.md).
// Identical naive minds in depleted vs fresh worlds: parental run learns
// 1024 ticks (depletes); snapshot init at 0; at 1024 copy init back over
// trained weights (V1 transplant op), clear store (memory-reset helper),
// freeze all, set every fly energy to 48 (newborn-level, uniform);
// advance K=1792; survival fraction. Fresh arm: same history, same
// placement at tick 0, same K. Minds identical by construction — only the
// world differs. Reproduction OFF (no births). 2 histories x 2 arms =
// 4 mains. Fresh arm gets toxin-free codebook (all +1, same geometry).
// Manipulation check (clean toxin ~0) then rescue test: GO iff fresh-clean
// survives like depleted (>=deep x0.9); else NOGO. Thin n=2.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {freezeTasteEnergyBody} from '../learning/taste-energy.mjs';
import {makeCueCodebook,enterCuePhase} from '../learning/cue-foraging.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {clearStore} from './memory-reset-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,checkTransplantIntegrity} from './turn-gated-dev-v1m.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,BT_TICKS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const GC2_EXPERIMENT='gen1-clean-dev';
export const GC2_ARMS=Object.freeze(['deep','fresh']);
export const GC2_DEPLETE_TICKS=1024, GC2_MEASURE_TICKS=1792;
export const GC2_PLACE_ENERGY=48;
export const GC2_MARGIN=1.1;
export const GC2_EXPECT_MAINS=4, GC2_EXPECT_PROBES=0;
export const GC2_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474343+j));
export const GC2_BIN_TICKS=64;
export const GC2_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490082+j));
const GC2_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[474235,474252],[474253,474270],[474271,474288],[474289,474306],[474325,474342],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045],[490046,490054],[490055,490063],[490064,490072],[490073,490081],[490082,490090]];
export const GC2_SPENT_SEEDS=Object.freeze([381001,...GC2_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const GC2_OP_CAP=20_000_000_000, GC2_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gc2ExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-clean-dev.mjs','docs/GEN1_CLEAN_PLAN_V1.md','tests/gen1-clean-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gc2Sources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-clean-dev.mjs','scripts/memory-reset-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_CLEAN_PLAN_V1.md'])visit(resolve(root,name));
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
export function gc2Bank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,GC2_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gc2ExtraTokens())excluded.add(t);
  for(const s of GC2_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of GC2_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=GC2_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=GC2_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:GC2_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-CLEAN V1 dev bank (deterministic fresh 474343-474360, 18 seeds, 2 main histories). Spend: 4 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function cleanCodebook(history){
  // Toxin-free codebook: same deterministic construction as the engine's
  // makeCueCodebook(history.cueSeed), then every valence forced to +1
  // (same bits/ids/order — only the sign changes). Pure. Fixture-tested.
  const cb=makeCueCodebook(history.cueSeed);
  for(const fam of Object.keys(cb))for(const item of cb[fam])item.valence=1;
  return cb;
}
export function placeNaive(run,initSnap){
  // Place identical naive minds: init weights back (V1 transplant op),
  // store cleared, frozen, energies to newborn-level. Re-baselines the
  // world energy books by the placement delta (disclosed intervention —
  // keeps the conservation check functional post-placement; endpoints use
  // run.startingEnergy, untouched). initSnap = tick-0 (zero learned bits).
  const cp=copyWeights(initSnap,run.learners);
  const chk=checkTransplantIntegrity(initSnap,run.learners);
  assert.ok(chk.ok,'placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(initSnap),digestWeights(snapshotWeights(run.learners)),'placement digest mismatch');
  for(const id of Object.keys(run.learners)){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=GC2_PLACE_ENERGY-fly.energy;fly.energy=GC2_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function survivalFraction(run){
  // Fraction of founders alive. Pure. No censoring (all placed together,
  // observed full K unless the world ends early — it won't, K fixed).
  const alive=run.world.flies.length;
  assert.ok(alive<=BT_FOUNDERS);
  return alive/BT_FOUNDERS;
}
export function meteredAdvance(run,ticks){
  // Advance tick-by-tick accumulating per-agent toxin damage + food intake
  // (engine receipts, read-only) + binned mean energies. Same world-steps
  // as bulk advance; metering only. Returns per-agent {toxin,food} sums,
  // energy curve (bin means), and ticks actually run.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  const toxin={},food={};for(const id of ids){toxin[id]=0;food[id]=0;}
  const energyCurve=[];
  let ran=0;
  for(let k=0;k<ticks;k++){
    if(!run.step())break;
    ran++;
    for(const id of ids)toxin[id]+=run.lastDamage?.[id]??0;
    for(const fly of run.world.flies)food[fly.id]=(food[fly.id]??0)+(fly.lastFood??0);
    if(ran%GC2_BIN_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      energyCurve.push(es.length?es.reduce((x,y)=>x+y,0)/es.length:0);
    }
  }
  return {toxin,food,energyCurve,ran};
}
export function runGen1Clean({bankPath,output,resume=false}){
  const sources=gc2Sources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=gc2Bank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-clean-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...GC2_ARMS],histories:p.histories.map(h=>h.seed),
      depleteTicks:GC2_DEPLETE_TICKS,measureTicks:GC2_MEASURE_TICKS,placeEnergy:GC2_PLACE_ENERGY,margin:GC2_MARGIN,
      caps:{executions:300,aggregateScalarOperations:GC2_OP_CAP,wallSeconds:GC2_WALL_CAP_SECONDS},
      scope:'GEN1-CLEAN V1 single attempt. Identical naive minds in depleted vs fresh worlds, metered toxin/food/energy per tick. Manipulation check (clean toxin ~0) then GO iff fresh-clean >= deep x0.9 (toxins necessary); else NOGO (boom-bust). No new rate dials.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=GC2_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    const {wall}=timed(`run-${h.seed}`,()=>{
      for(const arm of GC2_ARMS){
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){
          console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${h.seed}:${arm}`);
        const run=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        const initSnap=snapshotWeights(run.learners);
        if(arm==='deep')run.advance(GC2_DEPLETE_TICKS);
        else{const clean=cleanCodebook(h);run.resource=enterCuePhase(run.world,CONTINUAL_PHASES[0],h.resourceSeeds[0],clean);run.codebook=clean;}
        const placed=placeNaive(run,initSnap);
        const metered=meteredAdvance(run,GC2_MEASURE_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${h.seed}`);
        const surv=survivalFraction(run);
        row={history:{seed:h.seed},arm,stage:'main',transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta,survival:+surv.toFixed(4),
          meteredTicks:metered.ran,toxin:metered.toxin,food:metered.food,energyCurve:metered.energyCurve.map(v=>+v.toFixed(2)),
          depleteTicks:arm==='deep'?GC2_DEPLETE_TICKS:0,measureTicks:GC2_MEASURE_TICKS,endpoint};
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+h.seed);
        note(1,0,(arm==='deep'?GC2_DEPLETE_TICKS:0)+GC2_MEASURE_TICKS,endpoint.scalarOperations);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${h.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:h.seed,survival:+surv.toFixed(3),ranTicks:metered.ran}));
      }
    });
    runtimes[`run-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(gc2Sources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=GC2_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,GC2_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,GC2_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1CleanRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function meanToxin(row){
  // Mean cumulative toxin damage per placed agent. Pure. Non-negative by
  // construction (damage receipts) — nothing to cancel.
  if(!row||typeof row.toxin!=='object')return null;
  const vs=Object.values(row.toxin);
  if(!vs.length)return null;
  return vs.reduce((x,y)=>x+y,0)/vs.length;
}
export function scoreGen1CleanRows(rows){
  // Pooled fresh-clean vs deep-toxic. Manipulation check FIRST: clean-arm
  // toxin must be ~0 (else the swap failed -> INVALID). Then rescue test:
  // GO iff fresh-clean survival >= deep survival x0.9 (toxins were
  // necessary for fresh death). Else NOGO (clean still dies: boom-bust/
  // starvation, not poison). No void (always scores).
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===4&&GC2_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&r.toxin&&Number.isFinite(r.survival)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder);}));
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const get=(a,s)=>byArmSeed[a+':'+s];
  const pooledT=a=>mean(seeds.map(s=>{const r=get(a,s);return r?meanToxin(r):NaN;}));
  const pooledS=a=>mean(seeds.map(s=>{const r=get(a,s);return r&&Number.isFinite(r.survival)?r.survival:NaN;}));
  const tf=pooledT('fresh'),td=pooledT('deep');
  const sf=pooledS('fresh'),sd=pooledS('deep');
  const finT=Number.isFinite(tf)&&Number.isFinite(td);
  const gate=!g1||!finT?{go:false,verdict:'INVALID',reason:'integrity failed (mains/toxin-tables)'}
    :!(tf<0.5)?{go:false,verdict:'INVALID',reason:'manipulation check failed: clean arm loads toxin '+tf.toFixed(2)+' (swap broken — mechanism untested)'}
    :(sf>=sd*0.9)?{go:true,verdict:'GEN1-CLEAN-GO-V1',reason:'toxin-free fresh survives like depleted: fresh '+sf.toFixed(3)+' vs deep '+sd.toFixed(3)+' (>=deep x0.9; toxin '+tf.toFixed(2)+' vs '+td.toFixed(2)+') — TOXINS were necessary for fresh death (thin n=2)'}
    :{go:false,verdict:'GEN1-CLEAN-NOGO-V1',reason:'clean fresh still dies: fresh '+sf.toFixed(3)+' vs deep '+sd.toFixed(3)+' (<deep x0.9; toxin '+tf.toFixed(2)+' vs '+td.toFixed(2)+') — boom-bust/starvation, not poison'};
  const f2=v=>Number.isFinite(v)?+v.toFixed(2):null;
  const f3=v=>Number.isFinite(v)?+v.toFixed(3):null;
  const ps={};for(const sd2 of seeds){const f=get('fresh',sd2),d=get('deep',sd2);
    ps[sd2]={freshToxin:f?f2(meanToxin(f)):null,deepToxin:d?f2(meanToxin(d)):null,freshSurvival:f&&Number.isFinite(f.survival)?f3(f.survival):null,deepSurvival:d&&Number.isFinite(d.survival)?f3(d.survival):null};}
  return {perSeed:ps,toxin:{fresh:f2(tf),deep:f2(td)},survival:{fresh:f3(sf),deep:f3(sd)},g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
