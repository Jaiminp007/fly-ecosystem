// GEN1-BITASK dev instrument (FROZEN under docs/GEN1_MUTSAME_PLAN_V1.md). Shared-colony fate:
// Train A founders; birth colony (maternal) -> offspring birth weights;
// shared colony with N copy + N mut(0.05) + N naive sides, all frozen at
// birth, reproduction OFF, matched 1792 horizon, original A cues.
// Scored: mut survival/intake gaps vs naive; copy descriptive.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {freezeTasteEnergyBody} from '../learning/taste-energy.mjs';
import {clearStore} from './memory-reset-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,checkTransplantIntegrity} from './turn-gated-dev-v1m.mjs';
import {enterCuePhase} from '../learning/cue-foraging.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,BT_TICKS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const BTA_EXPERIMENT='gen1-bitask-dev';
export const BTA_ARMS=Object.freeze(['trainA','skillT','skillN','colBi','colCopy','colNaive','aBi','aCopy','aNaive','bBi','bCopy','bNaive']);
export const BTA_TRAIN_TICKS=512, BTA_BIRTH_TICKS=900, BTA_SKILL_TICKS=256, BTA_APROBE_TICKS=256;
export const BTA_BPROBE_TICKS=256;
export const BTA_PLACE_ENERGY=48;
export const BTA_MIN_OFFSPRING=4;
export const BTA_SURV_EDGE=0.10, BTA_INTAKE_EDGE=0.002;
export const BTA_EXPECT_MAINS=2, BTA_EXPECT_PROBES=22;
export const BTA_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>475495+j));
export const BTA_BIN_TICKS=64, BTA_SERIES_TICKS=32;
export const BTA_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490658+j));
const BTA_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[474235,474252],[474253,474270],[474271,474288],[474289,474306],[474325,474342],[474343,474360],[474361,474378],[474379,474396],[474397,474414],[474415,474432],[474433,474450],[474451,474468],[474469,474486],[474487,474504],[474505,474522],[474523,474540],[474541,474558],[474559,474576],[474577,474594],[474595,474612],[474613,474630],[474631,474648],[474649,474666],[474667,474684],[474685,474702],[474703,474720],[474721,474738],[474739,474756],[474757,474774],[474775,474792],[474793,474810],[474811,474828],[474829,474846],[474847,474864],[474865,474882],[474883,474900],[474901,474918],[474919,474936],[474937,474954],[474955,474972],[474973,474990],[474991,475008],[475009,475026],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045],[490046,490054],[490055,490063],[490064,490072],[490073,490081],[490082,490090],[490091,490099],[490100,490108],[490118,490126],[490127,490135],[490136,490144],[490145,490153],[490154,490162],[490163,490171],[490172,490180],[490181,490189],[490190,490198],[490199,490207],[490208,490216],[490217,490225],[490226,490234],[490235,490243],[490244,490252],[490253,490261],[490262,490270],[490271,490279],[490280,490288],[490289,490297],[490298,490306],[490307,490315],[490316,490324],[490325,490333],[490334,490342],[490343,490351],[490352,490360],[490361,490369],[490370,490378],[490379,490387],[490388,490396],[490397,490405],[490406,490414],[490415,490423],[475027,475044],[475045,475062],[490424,490432],[490433,490441],[475063,475080],[475081,475098],[475099,475116],[475117,475134],[475135,475152],[475153,475170],[475171,475188],[475189,475206],[475207,475224],[475225,475242],[475243,475260],[475261,475278],[475279,475296],[475297,475314],[475315,475332],[475333,475350],[475351,475368],[475387,475404],[475405,475422],[475423,475440],[475441,475458],[475459,475476],[475477,475494],[490442,490450],[490451,490459],[490460,490468],[490469,490477],[490478,490486],[490487,490495],[490496,490504],[490505,490513],[490514,490522],[490523,490531],[490532,490540],[490541,490549],[490550,490558],[490559,490567],[490568,490576],[490577,490585],[490586,490594],[490595,490603],[490604,490612],[490613,490621],[490622,490630],[490631,490639],[490640,490648],[490649,490657]];
export const BTA_SPENT_SEEDS=Object.freeze([381001,...BTA_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const BTA_OP_CAP=20_000_000_000, BTA_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gmsExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-bitask-dev.mjs','docs/GEN1_MUTSAME_PLAN_V1.md','tests/gen1-bitask-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gmsSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-bitask-dev.mjs','scripts/memory-reset-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_MUTSAME_PLAN_V1.md'])visit(resolve(root,name));
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
export function gmsBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,BTA_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gmsExtraTokens())excluded.add(t);
  for(const s of BTA_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of BTA_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=BTA_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=BTA_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:BTA_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-BITASK V1 dev bank (deterministic fresh 475495-475512, 18 seeds, 2 main histories). Spend: 2 trains + 4 skill + 6 birth-colony + 6 A-probe + 6 B-probe runs (24 total). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function placeMutsameSkilled(run,aSnap){
  // Place A-trained minds: A-weights in (transplant op), store cleared,
  // frozen, energies to uniform. Same books re-baseline as placeNaiveL2.
  const cp=copyWeights(aSnap,run.learners);
  const chk=checkTransplantIntegrity(aSnap,run.learners);
  assert.ok(chk.ok,'trained placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(aSnap),digestWeights(snapshotWeights(run.learners)),'trained placement digest mismatch');
  for(const id of Object.keys(run.learners)){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=BTA_PLACE_ENERGY-fly.energy;fly.energy=BTA_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function placeBitaskMixed(run,trainedSnap,initSnap){
  // Mixed founder placement for the biparental colony (id-sorted
  // order): odd founder ids receive the trained weights, even ids the
  // init weights. Store cleared, all frozen, energies uniform + book
  // delta. Digest-checked per side.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  const mothers=ids.filter(id=>id%2===1), fathers=ids.filter(id=>id%2===0);
  assert.ok(mothers.length>0&&fathers.length>0,'mixed-sex founders needed');
  const src={};
  for(const id of mothers){assert.ok(trainedSnap[id],'trained weights missing for '+id);src[id]=trainedSnap[id];}
  for(const id of fathers){assert.ok(initSnap[id],'init weights missing for '+id);src[id]=initSnap[id];}
  const cp=copyWeights(src,run.learners);
  const chk=checkTransplantIntegrity(src,run.learners);
  assert.ok(chk.ok,'mixed placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(src),digestWeights(snapshotWeights(run.learners)),'mixed placement digest mismatch');
  for(const id of ids){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=BTA_PLACE_ENERGY-fly.energy;fly.energy=BTA_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function placeNaiveL2(run,initSnap){
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
  for(const fly of run.world.flies){delta+=BTA_PLACE_ENERGY-fly.energy;fly.energy=BTA_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function mulberry32(seed){
  // Deterministic PRNG (fixture-tested). Seeds the placed-noise draw so
  // the mut side is reproducible per history.
  let a=seed>>>0;
  return ()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
}
export function mutateWeights(w,noise,rand){
  // Deep Gaussian (Box-Muller, deterministic rand) perturb of every
  // numeric leaf. Pure (input untouched). Fixture-tested.
  const g=()=>{let u=0,v=0;while(u===0)u=rand();while(v===0)v=rand();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
  const rec=x=>{if(typeof x==='number')return x+g()*noise;
    if(Array.isArray(x))return x.map(rec);
    if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,rec(v)]));
    return x;};
  return rec(w);
}
export function placeBirthcarryGroup(run,weightsArray){
  // Place one matched side in a task-B probe (id-sorted order): each
  // member keeps its own extracted weights. Store cleared, frozen
  // (pure transmitted-content test on the novel task), energies
  // uniform + book delta. Digest-checked.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  assert.equal(ids.length,weightsArray.length,'B-probe group size mismatch');
  const src={};ids.forEach((id,k)=>{src[id]=weightsArray[k];});
  const cp=copyWeights(src,run.learners);
  const chk=checkTransplantIntegrity(src,run.learners);
  assert.ok(chk.ok,'B-probe placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(src),digestWeights(snapshotWeights(run.learners)),'B-probe placement digest mismatch');
  for(const id of ids){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=BTA_PLACE_ENERGY-fly.energy;fly.energy=BTA_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function enterPhaseB8s(run,history){
  // Start a fresh run in phase B using the engine's own entry (mirrors
  // TasteExperiment.step phase-B lines: same fn, same phase, same
  // resourceSeeds[1]; nutrientOverride null path assigns nothing).
  run.phaseIndex=1;run.phaseEnd=512;
  run.resource=enterCuePhase(run.world,CONTINUAL_PHASES[1],history.resourceSeeds[1],run.codebook);
  return {phase:'B',seed:history.resourceSeeds[1]};
}
export function survivalFraction(run){
  // Fraction of founders alive. Pure. No censoring (all placed together,
  // observed full K unless the world ends early — it won't, K fixed).
  const alive=run.world.flies.length;
  assert.ok(alive<=run.founderIds.length);
  return alive/run.founderIds.length;
}
export function meteredAdvanceCauses(run,ticks,freezeNew=false){
  // meteredAdvance + per-agent cause tables + newborn handling. Same
  // world-steps as bulk advance; metering only. Each tick registers
  // newborn ids (init sums/lifespan/lastSeen/agents with born=tick) so
  // colonies meter offspring fully. If freezeNew, freezes any
  // acquisition-on learner post-step (newborns stay exactly as
  // transmitted = pure transmitted-content test; symmetric both arms;
  // no-op where all frozen). Lifespans read at registration; each tick
  // snapshot last-seen {energy,age} per alive agent; on disappearance
  // (died during the tick) infer cause via inferCause. Returns metered
  // fields + agents table.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  const toxin={},food={},cost={};for(const id of ids){toxin[id]=0;food[id]=0;cost[id]=0;}
  const registered=new Set(ids);
  const lifespan={};for(const fly of run.world.flies)lifespan[fly.id]=fly.genome?.traits?.lifespan;
  const lastSeen={};for(const fly of run.world.flies)lastSeen[fly.id]={energy:fly.energy,age:fly.age};
  const agents={};for(const id of ids)agents[id]={id,born:0,died:null,cause:null,lastEnergy:null};
  const energyCurve=[], series=[];
  let ran=0, tickIntakeAcc=0;
  const inferCause=(lastEnergy,lastAge,ls)=>{
    const L=Number.isFinite(ls)?ls:Infinity;
    if(lastAge>=L)return lastEnergy<=1?'both':'age';
    return 'energy';
  };
  for(let k=0;k<ticks;k++){
    if(!run.step())break;
    ran++;
    for(const fly of run.world.flies){
      if(!registered.has(fly.id)){
        registered.add(fly.id);ids.push(fly.id);
        toxin[fly.id]=0;food[fly.id]=0;cost[fly.id]=0;
        lifespan[fly.id]=fly.genome?.traits?.lifespan;
        lastSeen[fly.id]={energy:fly.energy,age:fly.age};
        agents[fly.id]={id:fly.id,born:ran,died:null,cause:null,lastEnergy:null};
      }
      if(freezeNew){const st=run.learners[fly.id];if(st&&st.acquisition)freezeTasteEnergyBody(st);}
    }
    for(const id of ids)toxin[id]+=run.lastDamage?.[id]??0;
    const alive=new Set();
    let tickIntake=0;
    for(const fly of run.world.flies){
      food[fly.id]=(food[fly.id]??0)+(fly.lastFood??0);
      cost[fly.id]=(cost[fly.id]??0)+(fly.lastEnergyCost??0);
      tickIntake+=(fly.lastFood??0);
      lastSeen[fly.id]={energy:fly.energy,age:fly.age};
      alive.add(fly.id);
    }
    tickIntakeAcc+=tickIntake;
    for(const id of ids)if(agents[id].died===null&&!alive.has(id)){
      agents[id].died=ran;agents[id].lastEnergy=+lastSeen[id].energy.toFixed(2);
      agents[id].cause=inferCause(lastSeen[id].energy,lastSeen[id].age,lifespan[id]);
    }
    if(ran%BTA_BIN_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      energyCurve.push(es.length?es.reduce((x,y)=>x+y,0)/es.length:0);
    }
    if(ran%BTA_SERIES_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      series.push({tick:ran,intake:+tickIntakeAcc.toFixed(3),
        energyMean:es.length?+(es.reduce((x,y)=>x+y,0)/es.length).toFixed(2):0,alive:es.length});
      tickIntakeAcc=0;
    }
  }
  for(const id of ids)if(agents[id].died===null)agents[id].lastEnergy=+lastSeen[id].energy.toFixed(2);
  return {toxin,food,cost,energyCurve,series,ran,agents:Object.values(agents)};
}
export function runGen1Bitask({bankPath,output,resume=false}){
  const sources=gmsSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=gmsBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-mutsame-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...BTA_ARMS],histories:p.histories.map(h=>h.seed),
      placeEnergy:BTA_PLACE_ENERGY,survEdge:BTA_SURV_EDGE,intakeEdge:BTA_INTAKE_EDGE,
      caps:{executions:300,aggregateScalarOperations:BTA_OP_CAP,wallSeconds:BTA_WALL_CAP_SECONDS},
      scope:'GEN1-BITASK V1 single attempt. A512 train, skill pair (256, gate), 3 birth colonies/history (900, bi-mixed/biparental + copy-maternal + naive, A1 mating, frozen newborns), matched-N frozen A-probes 256 (birth-gap gate) + frozen B-probes 256 via engine B-entry (novel task, no learning): bi vs copy vs naive. Gates: A-digest else INVALID; skill else INCOMPLETE-NOSKILL; pooled births<4/arm else INCOMPLETE-LOWBIRTHS; A-gap<=+0.002 either pair else INCOMPLETE-NOGAP. Scored per-pair both pairs: bi B-gap>+0.002 else NOGO. Copy descriptive. No gauntlet, no return, no new food/sensors.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops,founders=BT_FOUNDERS)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*founders;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=BTA_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    const {wall}=timed(`run-${h.seed}`,()=>{
      // Task A train: standard codebook (constructor default), learn ON.
      let trow=rows.find(r=>r.history.seed===h.seed&&r.arm==='trainA');
      if(trow&&trow.endpoint){console.log(JSON.stringify({stage:'skip',arm:'trainA',seed:h.seed,reason:'complete on disk'}));}
      else{
        if(resume)redone.push(`${h.seed}:trainA`);
        const run=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        const initSnap=snapshotWeights(run.learners);
        const initDigest=digestWeights(initSnap);
        run.advance(BTA_TRAIN_TICKS);
        const aSnap=snapshotWeights(run.learners);
        const aDigest=digestWeights(aSnap);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`trainA/${h.seed}`);
        const surv=survivalFraction(run);
        trow={history:{seed:h.seed},arm:'trainA',stage:'train',survival:+surv.toFixed(4),
          meteredTicks:BTA_TRAIN_TICKS,
          initDigest,aDigest,aWeights:aSnap,
          deathCauses:{...(run.world.totals.deathCauses??{energy:0,age:0})},endpoint};
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for trainA/'+h.seed);
        note(1,0,BTA_TRAIN_TICKS,endpoint.scalarOperations);
        rows.push(trow);
        writeOver(join(outputAbs,'rows',`${h.seed}-trainA.json`),trow);
        checkpointLedger();
        console.log(JSON.stringify({stage:'train',arm:'trainA',seed:h.seed,learnedA:aDigest!==initDigest,ranTicks:BTA_TRAIN_TICKS}));
      }
      const aSnap=trow.aWeights;
      const mkRun=(extra={},ref=null)=>new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,...(ref?{reference:ref}:{}),...extra});
      const pushRow=(arm,stage,run,metered,extra={})=>{
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${h.seed}`);
        const surv=survivalFraction(run);
        const finalDigest=digestWeights(snapshotWeights(run.learners));
        const row={history:{seed:h.seed},arm,stage,frozen:extra.frozen??true,transferred:extra.transferred,placedEnergyDelta:extra.placedEnergyDelta,survival:+surv.toFixed(4),
          meteredTicks:metered?metered.ran:extra.ticks,toxin:metered?metered.toxin:undefined,food:metered?metered.food:extra.food,cost:metered?metered.cost:undefined,energyCurve:metered?metered.energyCurve.map(v=>+v.toFixed(2)):[],series:metered?metered.series:[],agents:metered?metered.agents:extra.agents,
          founders:[...run.founderIds],vt:extra.vt??'none',sideIds:extra.sideIds??null,
          trainDigest:trow.aDigest,finalDigest,
          deathCauses:{...(run.world.totals.deathCauses??{energy:0,age:0})},endpoint};
        assert.equal(run.world.flies.length+run.world.totals.deaths,run.founderIds.length+run.world.totals.births,'Founder accounting broken for '+arm+'/'+h.seed);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${h.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage,arm,seed:h.seed,survival:+surv.toFixed(3),ranTicks:metered?metered.ran:extra.ticks}));
        return row;
      };
      for(const spec of [{arm:'skillT',snap:'a'},{arm:'skillN',snap:null}]){
        const arm=spec.arm;
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));}
        else{
          if(resume)redone.push(`${h.seed}:${arm}`);
          const run=mkRun();
          const snap=spec.snap==='a'?aSnap:null;
          const placed=snap?placeMutsameSkilled(run,snap):placeNaiveL2(run,snapshotWeights(run.learners));
          const metered=meteredAdvanceCauses(run,BTA_SKILL_TICKS,false);
          note(0,1,BTA_SKILL_TICKS,run.endpoint().scalarOperations);
          row=pushRow(arm,'probe',run,metered,{transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta});
        }
      }
      // Birth colonies: bi (mixed trained/naive founders, biparental), copy
      // (uniform trained, maternal), naive (uniform naive, none). A1 mating,
      // frozen newborns (birth-exact). Extract offspring birth weights.
      const colonies={}, colRuns={};
      for(const spec of [{arm:'colBi',vt:'biparental',mixed:true},{arm:'colCopy',vt:'maternal',mixed:false},{arm:'colNaive',vt:'none',mixed:false}]){
        const arm=spec.arm;
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));}
        else{
          if(resume)redone.push(`${h.seed}:${arm}`);
          const run=mkRun({reproduction:true,verticalTransmission:spec.vt,transmissionNoise:null,matingActionRequired:false,matingEnergyBar:10,matingRangeMultiplier:3});
          const initSnap=snapshotWeights(run.learners);
          const placed=spec.mixed?placeBitaskMixed(run,aSnap,initSnap):(spec.vt==='none'?placeNaiveL2(run,initSnap):placeMutsameSkilled(run,aSnap));
          const metered=meteredAdvanceCauses(run,BTA_BIRTH_TICKS,true);
          const wmap=snapshotWeights(run.learners);
          const kids=Object.keys(run.learners).map(Number).filter(id=>!run.founderIds.includes(id)).sort((a,b)=>a-b);
          colRuns[arm]=kids.map(id=>wmap[id]);
          note(0,1,BTA_BIRTH_TICKS,run.endpoint().scalarOperations);
          row=pushRow(arm,'colony',run,metered,{transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta,vt:spec.vt});
        }
        colonies[arm]=row;
      }
      // Matched-N offspring groups (min per history, first-k by id,
      // disclosed). Frozen A-probes (256) = birth-gap gate; frozen
      // B-probes via engine B-entry (novel task, no learning) = scored.
      // Resume re-runs incomplete chains from the colonies (weights live
      // in memory only).
      const matchedN=Math.min(...['colBi','colCopy','colNaive'].map(a=>(colonies[a].agents||[]).filter(x=>!colonies[a].founders.includes(x.id)).length));
      assert.ok(matchedN>=2,'probe groups <2 for '+h.seed);
      assert.ok(colonies['colBi'].agents.some(x=>!colonies['colBi'].founders.includes(x.id)),'bi colony childless for '+h.seed);
      for(const spec of [{arm:'aBi',col:'colBi',task:'A'},{arm:'aCopy',col:'colCopy',task:'A'},{arm:'aNaive',col:'colNaive',task:'A'},{arm:'bBi',col:'colBi',task:'B'},{arm:'bCopy',col:'colCopy',task:'B'},{arm:'bNaive',col:'colNaive',task:'B'}]){
        const arm=spec.arm;
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));}
        else{
          if(resume)redone.push(`${h.seed}:${arm}`);
          assert.ok(colRuns[spec.col],'probe needs fresh colony run for '+h.seed+' (resume mid-chain re-runs colonies)');
          const grp=colRuns[spec.col].slice(0,matchedN);
          const ref={...VALUE_REFERENCE,founders:matchedN};
          const run=mkRun({},ref);
          const be=spec.task==='B'?enterPhaseB8s(run,h):null;
          const placed=placeBirthcarryGroup(run,grp);
          const metered=meteredAdvanceCauses(run,spec.task==='B'?BTA_BPROBE_TICKS:BTA_APROBE_TICKS,false);
          note(0,1,spec.task==='B'?BTA_BPROBE_TICKS:BTA_APROBE_TICKS,run.endpoint().scalarOperations);
          row=pushRow(arm,spec.task==='B'?'bprobe':'aprobe',run,metered,{transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta,frozen:true,bPhase:be});
        }
      }
    });
    runtimes[`run-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(gmsSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=BTA_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,BTA_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,BTA_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1BitaskRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function mutsameRate(row){
  // Net intake per agent-tick. Pure. Fixture-tested.
  if(!row||!row.food||!row.meteredTicks)return null;
  const ids=Object.keys(row.food);
  if(!ids.length)return null;
  const n=Array.isArray(row.agents)&&row.agents.length?row.agents.length:ids.length;
  let f=0;for(const id of ids)f+=row.food[id]??0;
  return f/n/row.meteredTicks;
}
export function mutsameOffspringIds(row){
  // Non-founder agent ids (any generation). Pure.
  if(!row||!Array.isArray(row.agents))return null;
  const f=new Set(row.founders||[]);
  return row.agents.filter(a=>!f.has(a.id));
}
export function mutsameOffspringSurvival(row){
  // Fraction of offspring alive at end. Pure.
  const off=mutsameOffspringIds(row);
  if(!off||!off.length)return null;
  return off.filter(a=>a.died===null).length/off.length;
}
export function sideSurvival(row,ids){
  // Survival fraction over a placed side id-set. Pure. Null on empty.
  if(!row||!Array.isArray(row.agents)||!Array.isArray(ids)||!ids.length)return null;
  const set=new Set(ids);
  const members=row.agents.filter(a=>set.has(a.id));
  if(!members.length)return null;
  return members.filter(a=>a.died===null).length/members.length;
}
export function sideIntake(row,ids){
  // Mean per-agent-tick food intake over a placed side id-set. Pure.
  if(!row||!row.food||!row.meteredTicks||!Array.isArray(ids)||!ids.length)return null;
  let f=0;for(const id of ids)f+=(row.food[id]??0);
  return f/ids.length/row.meteredTicks;
}
export function probeIntake8s(row){
  // Per-agent-tick food intake over a probe row (all agents scored).
  if(!row||!row.food||!row.meteredTicks)return null;
  const ids=Object.keys(row.food).map(Number);
  if(!ids.length)return null;
  let f=0;for(const id of ids)f+=(row.food[id]??0);
  return f/ids.length/row.meteredTicks;
}
export function scoreGen1BitaskRows(rows){
  // A-content gate FIRST (every trainA aDigest != init) else INVALID.
  // Then SKILL gate: pooled skillT rate must exceed pooled skillN
  // else INCOMPLETE-NOSKILL (void — nothing to transmit). Then
  // BIRTHS gate: pooled colony offspring per arm (all three) must reach
  // 4 else INCOMPLETE-LOWBIRTHS (void). Then NOGAP gate: birth A-gap
  // (bi − naive on task A) <= +0.002 either pair → INCOMPLETE-NOGAP
  // (void — nothing to transfer). Then GO iff FOR EACH pair the
  // novel-task B-probe gap (bi − naive) > +0.002 (recombined skill
  // helps on the novel task). Else NOGO. Copy A/B-gaps reported
  // descriptively (no gate).
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===24&&BTA_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&Number.isFinite(r.survival)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&((a==='trainA')?(typeof r.aDigest==='string'):(r.food&&Array.isArray(r.agents)));}));
  const get=(a,s)=>byArmSeed[a+':'+s];
  const pooledR=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r?mutsameRate(r):NaN;});return vs.every(Number.isFinite)?vs.reduce((x,y)=>x+y,0)/vs.length:NaN;};
  const pooledON=a=>seeds.map(s=>{const r=get(a,s);const off=r?mutsameOffspringIds(r):null;return off?off.length:NaN;}).reduce((x,y)=>x+y,0);
  const pairGap=(a,b)=>seeds.map(s=>{const ra=get(a,s),rb=get(b,s);const va=ra?probeIntake8s(ra):NaN,vb=rb?probeIntake8s(rb):NaN;return (Number.isFinite(va)&&Number.isFinite(vb))?va-vb:NaN;});
  const rST=pooledR('skillT'), rSN=pooledR('skillN');
  const nB=pooledON('colBi'), nC=pooledON('colCopy'), nN=pooledON('colNaive');
  const ag=pairGap('aBi','aNaive'), cg=pairGap('bBi','bNaive'), mg=pairGap('bCopy','bNaive');
  const pB=pooledR('bBi'), pC=pooledR('bCopy'), pN=pooledR('bNaive');
  const qB=pooledR('aBi'), qN=pooledR('aNaive');
  const gate=!g1||![rST,rSN,pB,pC,pN,qB,qN].every(Number.isFinite)||![nB,nC,nN].every(Number.isFinite)||!ag.every(Number.isFinite)||!cg.every(Number.isFinite)||!mg.every(Number.isFinite)?{go:false,verdict:'INVALID',reason:'integrity failed (mains/probe-tables)'}
    :!seeds.every(s=>{const r=get('trainA',s);return r&&r.aDigest&&r.initDigest&&r.aDigest!==r.initDigest;})?{go:false,verdict:'GEN1-BITASK-INVALID-NOLEARN',reason:'A did not learn (digest unmoved — no content to test)'}
    :!(rST>rSN)?{go:false,verdict:'GEN1-BITASK-INCOMPLETE-NOSKILL',reason:'no usable skill on this bank: skillT '+rST.toFixed(4)+'/tick vs skillN '+rSN.toFixed(4)+'/tick (void)'}
    :(nB<BTA_MIN_OFFSPRING||nC<BTA_MIN_OFFSPRING||nN<BTA_MIN_OFFSPRING)?{go:false,verdict:'GEN1-BITASK-INCOMPLETE-LOWBIRTHS',reason:'too few offspring to form probe groups (bi '+nB+' copy '+nC+' naive '+nN+' < '+BTA_MIN_OFFSPRING+'/arm — void)'}
    :!ag.every(g=>g>0.002)?{go:false,verdict:'GEN1-BITASK-INCOMPLETE-NOGAP',reason:'no birth A-gap to transfer on every pair: bi '+qB.toFixed(4)+' vs naive '+qN.toFixed(4)+'/tick (void)'}
    :cg.every(g=>g>0.002)?{go:true,verdict:'GEN1-BITASK-GO-V1',reason:'recombined skill helps on the novel task, both pairs: B-gaps '+cg.map(v=>v.toFixed(4)).join('/')+'/tick (bi '+pB.toFixed(4)+' vs naive '+pN.toFixed(4)+'); copy gaps '+mg.map(v=>v.toFixed(4)).join('/')+' descriptive; A-gaps '+ag.map(v=>v.toFixed(4)).join('/')+'; n='+nB+'/'+nC+'/'+nN+''}
    :{go:false,verdict:'GEN1-BITASK-NOGO-V1',reason:'recombined skill does not transfer to the novel task: B-gaps '+cg.map(v=>v.toFixed(4)).join('/')+'/tick (bi '+pB.toFixed(4)+' vs naive '+pN.toFixed(4)+', need >+0.002 both pairs); copy gaps '+mg.map(v=>v.toFixed(4)).join('/')+' descriptive; A-gaps '+ag.map(v=>v.toFixed(4)).join('/')+''};
  const f3=v=>Number.isFinite(v)?+v.toFixed(3):null;
  const f4=v=>Number.isFinite(v)?+v.toFixed(4):null;
  const ps={};for(const sd of seeds){const T=get('trainA',sd);
    ps[sd]={trainLearnedA:T?T.aDigest!==T.initDigest:null};
    for(const a of BTA_ARMS){if(a==='trainA')continue;const R=get(a,sd);
      ps[sd][a+'Rate']=R?f4(mutsameRate(R)):null;ps[sd][a+'Offspring']=R?(mutsameOffspringIds(R)||[]).length:null;
      ps[sd][a+'OffspringSurv']=R?f3(mutsameOffspringSurvival(R)):null;
      ps[sd][a+'Survival']=R&&Number.isFinite(R.survival)?f3(R.survival):null;
      ps[sd][a+'Causes']=causeSplit(R);ps[sd][a+'Exact']=R?.deathCauses??null;}}
  return {perSeed:ps,rate:{skillT:f4(rST),skillN:f4(rSN)},aprobeIntake:{bi:f4(qB),naive:f4(qN)},bprobeIntake:{bi:f4(pB),copy:f4(pC),naive:f4(pN)},aGap:{pairs:ag.map(v=>+v.toFixed(4))},biGap:{pairs:cg.map(v=>+v.toFixed(4))},copyGap:{pairs:mg.map(v=>+v.toFixed(4))},births:{bi:nB,copy:nC,naive:nN},g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
export function causeSplit(r){
  // Count per-agent causes from the row agents table. Pure.
  if(!r||!Array.isArray(r.agents))return null;
  const out={energy:0,age:0,both:0,alive:0};
  for(const a of r.agents){if(a.died===null)out.alive++;else if(a.cause==='age')out.age++;else if(a.cause==='both')out.both++;else out.energy++;}
  return out;
}
