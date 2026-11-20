// GEN1-BIPAR2 dev instrument (FROZEN under docs/GEN1_MUTHEIR_PLAN_V1.md). Heir ecology + mut arm:
// Task A: standard cue codebook, learn ON, 512 ticks; snapshot A-weights.
// Task B probes (256 ticks, FROZEN): transplant A-weights vs naive init
// into the SAME positions with swapped cue identities (fresh random bits,
// valences preserved). Minds identical by construction � only the
// world differs only in cue bits. Reproduction OFF (no births). 2 trains
// + 4 probes. A-digest must move (else INVALID); GO iff transplant rate >
// naive x1.1 (positional benefit survives); else NOGO (inversion/null).
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
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,BT_TICKS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const BP2_EXPERIMENT='gen1-bipar2-dev';
export const BP2_ARMS=Object.freeze(['trainAB','skillT','skillN','bi','copy','naivekid']);
export const BP2_MIN_OFFSPRING=6;
export const BP2_TRAIN_TICKS=512, BP2_PROBE_TICKS=1792, BP2_SKILL_TICKS=256;
export const BP2_DEPLETE_TICKS=1024, BP2_MEASURE_TICKS=1792;
export const BP2_PLACE_ENERGY=48;
export const BP2_MARGIN=1.1;
export const BP2_EXPECT_MAINS=2, BP2_EXPECT_PROBES=10;
export const BP2_MUT_NOISE=0.05;
export const BP2_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>475261+j));
export const BP2_BIN_TICKS=64, BP2_SERIES_TICKS=32;
export const BP2_NEVER_FRAC=0.1, BP2_SUPERMAJORITY=2/3, BP2_MIN_LOSERS=4;
export const BP2_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490541+j));
const BP2_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[474235,474252],[474253,474270],[474271,474288],[474289,474306],[474325,474342],[474343,474360],[474361,474378],[474379,474396],[474397,474414],[474415,474432],[474433,474450],[474451,474468],[474469,474486],[474487,474504],[474505,474522],[474523,474540],[474541,474558],[474559,474576],[474577,474594],[474595,474612],[474613,474630],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045],[490046,490054],[490055,490063],[490064,490072],[490073,490081],[490082,490090],[490091,490099],[490100,490108],[490118,490126],[490127,490135],[490136,490144],[490145,490153],[490154,490162],[490163,490171],[490172,490180],[490181,490189],[490190,490198],[490199,490207],[490208,490216],[490217,490225],[490226,490234],[474631,474648],[474649,474666],[474667,474684],[474685,474702],[474703,474720],[474721,474738],[474739,474756],[474757,474774],[474775,474792],[474793,474810],[474811,474828],[474829,474846],[474847,474864],[474865,474882],[474883,474900],[474901,474918],[474919,474936],[474937,474954],[474955,474972],[474973,474990],[474991,475008],[475009,475026],[475027,475044],[490235,490243],[490244,490252],[490253,490261],[490262,490270],[490271,490279],[490280,490288],[490289,490297],[490298,490306],[490307,490315],[490316,490324],[490325,490333],[490334,490342],[490343,490351],[490352,490360],[490361,490369],[490370,490378],[490379,490387],[490388,490396],[490397,490405],[490406,490414],[490415,490423],[490433,490441],[475063,475080],[490442,490450],[475081,475098],[490451,490459],[475099,475116],[490460,490468],[475117,475134],[490469,490477],[475135,475152],[490478,490486],[475153,475170],[490487,490495],[475171,475188],[490496,490504],[475189,475206],[475207,475224],[490505,490513],[490514,490522],[475225,475242],[490523,490531],[475243,475260],[490532,490540]];
export const BP2_SPENT_SEEDS=Object.freeze([381001,...BP2_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const BP2_OP_CAP=20_000_000_000, BP2_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function ghExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-bipar2-dev.mjs','docs/GEN1_BIPAR_PLAN_V1.md','tests/gen1-bipar2-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function ghSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-bipar2-dev.mjs','scripts/memory-reset-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_BIPAR_PLAN_V1.md'])visit(resolve(root,name));
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
export function ghBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,BP2_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of ghExtraTokens())excluded.add(t);
  for(const s of BP2_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of BP2_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=BP2_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=BP2_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:BP2_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-BIPAR2 V1 dev bank (deterministic fresh 475261-475278, 18 seeds, 2 main histories). Spend: 2 trains + 4 skill + 6 colony runs (12 total). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function placeBiparFounders(run,trainedSnap,initSnap){
  // Mixed-sex founder placement for the biparental colony (id-sorted
  // order): mothers are sex 0 = odd founder ids (engine: founder index
  // i gets id i+1, sex i%2) and receive the trained weights; fathers
  // (even ids) receive init weights. Store cleared, all frozen,
  // energies uniform + book delta. Digest-checked per side.
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
  for(const fly of run.world.flies){delta+=BP2_PLACE_ENERGY-fly.energy;fly.energy=BP2_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function placeHeirSkilled(run,aSnap){
  // Place A-trained minds: A-weights in (transplant op), store cleared,
  // frozen, energies to uniform. Same books re-baseline as placeNaiveL.
  const cp=copyWeights(aSnap,run.learners);
  const chk=checkTransplantIntegrity(aSnap,run.learners);
  assert.ok(chk.ok,'trained placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(aSnap),digestWeights(snapshotWeights(run.learners)),'trained placement digest mismatch');
  for(const id of Object.keys(run.learners)){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=BP2_PLACE_ENERGY-fly.energy;fly.energy=BP2_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function placeNaiveL(run,initSnap){
  // Place identical naive minds: init weights back (V1 transplant op),
  // store cleared, frozen, energies to newborn-level. Re-baselines the
  // world energy books by the placement delta (disclosed intervention �
  // keeps the conservation check functional post-placement; endpoints use
  // run.startingEnergy, untouched). initSnap = tick-0 (zero learned bits).
  const cp=copyWeights(initSnap,run.learners);
  const chk=checkTransplantIntegrity(initSnap,run.learners);
  assert.ok(chk.ok,'placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(initSnap),digestWeights(snapshotWeights(run.learners)),'placement digest mismatch');
  for(const id of Object.keys(run.learners)){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=BP2_PLACE_ENERGY-fly.energy;fly.energy=BP2_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function survivalFraction(run){
  // Fraction of founders alive. Pure. No censoring (all placed together,
  // observed full K unless the world ends early � it won't, K fixed).
  const alive=run.world.flies.length;
  assert.ok(alive<=run.founderIds.length);
  return alive/run.founderIds.length;
}
export function meteredAdvance(run,ticks){
  // Advance tick-by-tick accumulating per-agent toxin damage + food intake
  // (engine receipts, read-only) + binned mean energies. Same world-steps
  // as bulk advance; metering only. Returns per-agent {toxin,food} sums,
  // energy curve (bin means), and ticks actually run.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  const toxin={},food={},cost={};for(const id of ids){toxin[id]=0;food[id]=0;cost[id]=0;}
  const registered=new Set(ids);
  const energyCurve=[], series=[];
  let ran=0, tickIntakeAcc=0;
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
    for(const fly of run.world.flies)food[fly.id]=(food[fly.id]??0)+(fly.lastFood??0);
    if(ran%BP2_BIN_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      energyCurve.push(es.length?es.reduce((x,y)=>x+y,0)/es.length:0);
    }
    if(ran%BP2_SERIES_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      series.push({tick:ran,intake:+tickIntakeAcc.toFixed(3),
        energyMean:es.length?+(es.reduce((x,y)=>x+y,0)/es.length).toFixed(2):0,alive:es.length});
      tickIntakeAcc=0;
    }
  }
  return {toxin,food,energyCurve,ran};
}
export function scaleFood(run,factor){
  // Plain field multiply of every patch (amount/capacity/regrowth).
  // Positions/centers/cues/valences untouched. Re-baselines the world
  // energy books by the food delta (same disclosed pattern as placeNaiveL
  // — keeps the conservation check functional post-scaling). Fixture-tested.
  const e0=run.world.energy();
  for(const p of run.world.food){p.amount*=factor;p.capacity*=factor;p.regrowth*=factor;}
  run.world.initialEnergy+=(run.world.energy()-e0);
  return run.world.food.length;
}
export function inferCause(lastEnergy,lastAge,lifespan){
  // Pre-registered rule: age takes precedence only at the cap; near-zero
  // energy with room on age is starvation. Pure. Fixture-tested.
  const ls=Number.isFinite(lifespan)?lifespan:Infinity;
  if(lastAge>=ls)return lastEnergy<=1?'both':'age';
  return 'energy';
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
    if(ran%BP2_BIN_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      energyCurve.push(es.length?es.reduce((x,y)=>x+y,0)/es.length:0);
    }
    if(ran%BP2_SERIES_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      series.push({tick:ran,intake:+tickIntakeAcc.toFixed(3),
        energyMean:es.length?+(es.reduce((x,y)=>x+y,0)/es.length).toFixed(2):0,alive:es.length});
      tickIntakeAcc=0;
    }
  }
  for(const id of ids)if(agents[id].died===null)agents[id].lastEnergy=+lastSeen[id].energy.toFixed(2);
  return {toxin,food,cost,energyCurve,series,ran,agents:Object.values(agents)};
}
export function runGen1Bipar2({bankPath,output,resume=false}){
  const sources=ghSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=ghBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-heir-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...BP2_ARMS],histories:p.histories.map(h=>h.seed),
      depleteTicks:BP2_DEPLETE_TICKS,measureTicks:BP2_MEASURE_TICKS,placeEnergy:BP2_PLACE_ENERGY,margin:BP2_MARGIN,
      caps:{executions:300,aggregateScalarOperations:BP2_OP_CAP,wallSeconds:BP2_WALL_CAP_SECONDS},
      scope:'GEN1-BIPAR2 V1 single attempt. A512+B512 train, skill pair (256, gate), 3 colonies/history (1792, A1 mating, frozen newborns): bi (mixed founders trained-mothers/naive-fathers, biparental crossover) vs copy (maternal exact) vs naivekid (no transmission). Gates: A/B-digest else INVALID; skill else INCOMPLETE-NOSKILL; pooled births<6/arm else INCOMPLETE-LOWBIRTHS; pooled copy surv<0.05 else FLOOR. Scored per-pair both pairs: bi-naive surv gap>+0.10 AND intake gap>+0.002 else NOGO. Copy descriptive. No gauntlet, no return, no new food/sensors.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops,founders=BT_FOUNDERS)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*founders;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=BP2_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    const {wall}=timed(`run-${h.seed}`,()=>{
      // Task A train: standard codebook (constructor default), learn ON.
      let trow=rows.find(r=>r.history.seed===h.seed&&r.arm==='trainAB');
      if(trow&&trow.endpoint){console.log(JSON.stringify({stage:'skip',arm:'trainAB',seed:h.seed,reason:'complete on disk'}));}
      else{
        if(resume)redone.push(`${h.seed}:trainAB`);
        const run=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        const initSnap=snapshotWeights(run.learners);
        const initDigest=digestWeights(initSnap);
        run.advance(BP2_TRAIN_TICKS);
        const aSnap=snapshotWeights(run.learners);
        const aDigest=digestWeights(aSnap);
        run.advance(BP2_TRAIN_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`trainAB/${h.seed}`);
        const bSnap=snapshotWeights(run.learners);
        const bDigest=digestWeights(bSnap);
        const surv=survivalFraction(run);
        trow={history:{seed:h.seed},arm:'trainAB',stage:'train',survival:+surv.toFixed(4),
          meteredTicks:1024,
          initDigest,aDigest,bDigest,aWeights:aSnap,bWeights:bSnap,
          deathCauses:{...(run.world.totals.deathCauses??{energy:0,age:0})},endpoint};
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for trainAB/'+h.seed);
        note(1,0,1024,endpoint.scalarOperations);
        rows.push(trow);
        writeOver(join(outputAbs,'rows',`${h.seed}-trainAB.json`),trow);
        checkpointLedger();
        console.log(JSON.stringify({stage:'train',arm:'trainAB',seed:h.seed,learnedA:aDigest!==initDigest,learnedB:bDigest!==aDigest,ranTicks:1024}));
      }
      const aSnap=trow.aWeights, bSnap=trow.bWeights;
      for(const spec of [{arm:'skillT',snap:'b',ticks:BP2_SKILL_TICKS,repro:false,vt:'none',tn:null},{arm:'skillN',snap:null,ticks:BP2_SKILL_TICKS,repro:false,vt:'none',tn:null},{arm:'bi',snap:'b',ticks:BP2_PROBE_TICKS,repro:true,vt:'biparental',tn:null,mixed:true,mate:{matingActionRequired:false,matingEnergyBar:10,matingRangeMultiplier:3}},{arm:'copy',snap:'b',ticks:BP2_PROBE_TICKS,repro:true,vt:'maternal',tn:null,mate:{matingActionRequired:false,matingEnergyBar:10,matingRangeMultiplier:3}},{arm:'naivekid',snap:'b',ticks:BP2_PROBE_TICKS,repro:true,vt:'none',tn:null,mate:{matingActionRequired:false,matingEnergyBar:10,matingRangeMultiplier:3}}]){
        const arm=spec.arm;
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){
          console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${h.seed}:${arm}`);
        const run=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:spec.repro,verticalTransmission:spec.vt,transmissionNoise:spec.tn,...(spec.mate??{})});
        const initSnap=snapshotWeights(run.learners);
        const snap=spec.snap==='b'?bSnap:null;
        const placed=spec.mixed?placeBiparFounders(run,bSnap,initSnap):(snap?placeHeirSkilled(run,snap):placeNaiveL(run,initSnap));
        const metered=meteredAdvanceCauses(run,spec.ticks,spec.repro);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${h.seed}`);
        const surv=survivalFraction(run);
        const finalDigest=digestWeights(snapshotWeights(run.learners));
        row={history:{seed:h.seed},arm,stage:spec.repro?'colony':'probe',frozen:placed.frozen??true,transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta,survival:+surv.toFixed(4),
          meteredTicks:metered.ran,toxin:metered.toxin,food:metered.food,cost:metered.cost,energyCurve:metered.energyCurve.map(v=>+v.toFixed(2)),series:metered.series,agents:metered.agents,
          founders:[...run.founderIds],vt:spec.vt,
          trainDigest:trow.aDigest,finalDigest,
          deathCauses:{...(run.world.totals.deathCauses??{energy:0,age:0})},endpoint};
        assert.equal(run.world.flies.length+run.world.totals.deaths,run.founderIds.length+run.world.totals.births,'Founder accounting broken for '+arm+'/'+h.seed);
        note(0,1,spec.ticks,endpoint.scalarOperations);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${h.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:spec.repro?'colony':'probe',arm,seed:h.seed,survival:+surv.toFixed(3),ranTicks:metered.ran}));
      }
    });
    runtimes[`run-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(ghSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=BP2_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,BP2_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,BP2_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1Bipar2Rows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function meanToxin(row){
  // Mean cumulative toxin damage per placed agent. Pure. Non-negative by
  // construction (damage receipts) � nothing to cancel.
  if(!row||typeof row.toxin!=='object')return null;
  const vs=Object.values(row.toxin);
  if(!vs.length)return null;
  return vs.reduce((x,y)=>x+y,0)/vs.length;
}
export function loserFeastRatio(series){
  // Matched-window front-loading: mean intake bins 0-7 (ticks 0-256)
  // over mean bins 16-23 (ticks 512-768). Zero-floor: both <0.01 -> 1
  // (flat-zero, no feast). Pure. Fixture-tested.
  const early=series.slice(0,8), mid=series.slice(16,24);
  if(!early.length||!mid.length)return null;
  const me=early.reduce((x,b)=>x+b.intake,0)/early.length;
  const mm=mid.reduce((x,b)=>x+b.intake,0)/mid.length;
  if(me<0.01&&mm<0.01)return 1;
  if(mm<=0)return me>0?Infinity:1;
  return me/mm;
}
export function loserCrashMetrics(series,agents){
  // Full-course crash: deaths count + late-energy vs peak-bin ratio.
  // Pure. Fixture-tested.
  const deaths=agents.filter(a=>a.died!==null).length;
  const means=series.map(b=>b.energyMean);
  const peak=means.length?Math.max(...means):0;
  const late=series.slice(-4);
  const lateMean=late.length?late.reduce((x,b)=>x+b.energyMean,0)/late.length:0;
  return {deaths,peak:+peak.toFixed(2),lateMean:+lateMean.toFixed(2),collapseRatio:peak>0?+(lateMean/peak).toFixed(3):null};
}
export function heirSplitLosers(row){
  // Pre-registered loser split on ONE row (fresh arm). Survivor median
  // per-tick intake (same run) is the reach reference. NEVER: dead with
  // per-lived-tick intake < 0.1 x survivor median (never found food).
  // UNDER: not NEVER and lifetime intake < lifetime costs (found but
  // insufficient). OVER: not NEVER and lifetime intake >= lifetime
  // costs (cap-waste + late crash, or timing — real category). Pure.
  if(!row||!Array.isArray(row.agents))return null;
  const lived=id=>{const a=row.agents.find(x=>x.id===id);return a&&a.died!=null?a.died:row.meteredTicks;};
  const rate=id=>((row.food||{})[id]??0)/Math.max(1,lived(id));
  const survRates=row.agents.filter(a=>a.died===null).map(a=>rate(a.id)).sort((a,b)=>a-b);
  const med=survRates.length?survRates[Math.floor(survRates.length/2)]:0;
  const out={never:0,under:0,over:0,losers:0,survivorMedian:+med.toFixed(4)};
  for(const a of row.agents){
    if(a.died===null)continue;
    out.losers++;
    const intake=(row.food||{})[a.id]??0, costs=(row.cost||{})[a.id]??0;
    const r=intake/Math.max(1,a.died);
    if(r<BP2_NEVER_FRAC*med)out.never++;
    else if(intake<costs)out.under++;
    else out.over++;
  }
  return out;
}
export function heirRate(row){
  // Net intake per agent-tick. Pure. Fixture-tested.
  if(!row||!row.food||!row.meteredTicks)return null;
  const ids=Object.keys(row.food);
  if(!ids.length)return null;
  const n=Array.isArray(row.agents)&&row.agents.length?row.agents.length:ids.length;
  let f=0;for(const id of ids)f+=row.food[id]??0;
  return f/n/row.meteredTicks;
}
export function heirToxin(row){
  // Toxin per agent-tick (inversion texture). Pure.
  if(!row||!row.toxin||!row.meteredTicks)return null;
  const ids=Object.keys(row.toxin);
  if(!ids.length)return null;
  const n=Array.isArray(row.agents)&&row.agents.length?row.agents.length:ids.length;
  let t=0;for(const id of ids)t+=row.toxin[id]??0;
  return t/n/row.meteredTicks;
}
export function heirPooledDeaths(row){
  // Total deaths in one probe row. Pure.
  if(!row||!Array.isArray(row.agents))return 0;
  return row.agents.filter(a=>a.died!==null).length;
}
export function heirNaiveDeathFrac(row){
  // Naive-side death fraction: mixed rows use the side map (naive IDs
  // only); pure-naive rows use all agents. Pure.
  if(!row||!Array.isArray(row.agents)||!row.agents.length)return null;
  const pool=row.side?row.agents.filter(a=>row.side[a.id]==='naive'):row.agents;
  if(!pool.length)return null;
  return pool.filter(a=>a.died!==null).length/pool.length;
}
export function heirSkilledDeathFrac(row){
  // Skilled-side death fraction (mixed: side map; pure-skilled: all).
  if(!row||!Array.isArray(row.agents)||!row.agents.length)return null;
  const pool=row.side?row.agents.filter(a=>row.side[a.id]==='skilled'):row.agents;
  if(!pool.length)return null;
  return pool.filter(a=>a.died!==null).length/pool.length;
}
export function heirSubRate(row,side,which){
  // Per-agent-tick intake (which='food') for one side (or all if no map).
  if(!row||!row.food||!row.meteredTicks)return null;
  const ids=row.side?Object.keys(row.side).filter(id=>row.side[id]===side).map(Number):Object.keys(row.food).map(Number);
  if(!ids.length)return null;
  let f=0;for(const id of ids)f+=(row.food[id]??0);
  return f/ids.length/row.meteredTicks;
}
export function offspringIds(row){
  // Non-founder agent ids (any generation). Pure.
  if(!row||!Array.isArray(row.agents))return null;
  const f=new Set(row.founders||[]);
  return row.agents.filter(a=>!f.has(a.id));
}
export function offspringSurvival(row){
  // Fraction of offspring alive at end. Pure.
  const off=offspringIds(row);
  if(!off||!off.length)return null;
  return off.filter(a=>a.died===null).length/off.length;
}
export function offspringRate(row){
  // Mean per-lived-tick net intake over offspring. Pure.
  const off=offspringIds(row);
  if(!off||!off.length)return null;
  let f=0,t=0;for(const a of off){f+=(row.food||{})[a.id]??0;const lived=a.died!=null?a.died:(row.meteredTicks||1);t+=Math.max(1,lived);}
  return f/Math.max(1,t);
}
export function scoreGen1Bipar2Rows(rows){
  // A-content gate FIRST (every trainAB aDigest != init AND bDigest !=
  // aDigest) else INVALID. Then SKILL gate: pooled skillT rate must
  // exceed pooled skillN else INCOMPLETE-NOSKILL (void). Then BIRTHS
  // gate: pooled offspring per colony arm (all three) must reach 6
  // else INCOMPLETE-LOWBIRTHS (void). Then FLOOR check: pooled copy
  // survival < 0.05 -> FLOOR (report, no retune). Then GO iff FOR EACH
  // pair the biparental gap (bi − naivekid) clears survival > +0.10
  // AND intake > +0.002 (recombination preserves a usable edge). Else
  // NOGO. Copy gaps descriptive (ceiling reference).
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===12&&BP2_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&Number.isFinite(r.survival)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&((a==='trainAB')?(typeof r.aDigest==='string'&&typeof r.bDigest==='string'):(r.food&&Array.isArray(r.agents)));}));
  const get=(a,s)=>byArmSeed[a+':'+s];
  const pooledR=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r?heirRate(r):NaN;});return vs.every(Number.isFinite)?vs.reduce((x,y)=>x+y,0)/vs.length:NaN;};
  const pooledOS=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r?offspringSurvival(r):NaN;});return vs.every(Number.isFinite)?vs.reduce((x,y)=>x+y,0)/vs.length:NaN;};
  const pooledOR=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r?offspringRate(r):NaN;});return vs.every(Number.isFinite)?vs.reduce((x,y)=>x+y,0)/vs.length:NaN;};
  const pooledON=a=>seeds.map(s=>{const r=get(a,s);const off=r?offspringIds(r):null;return off?off.length:NaN;}).reduce((x,y)=>x+y,0);
  const pairGap=(fn,a,b)=>seeds.map(s=>{const ra=get(a,s),rb=get(b,s);const va=ra?fn(ra):NaN,vb=rb?fn(rb):NaN;return (Number.isFinite(va)&&Number.isFinite(vb))?va-vb:NaN;});
  const rST=pooledR('skillT'), rSN=pooledR('skillN');
  const oB=pooledOS('bi'), oC=pooledOS('copy'), oN=pooledOS('naivekid');
  const iB=pooledOR('bi'), iC=pooledOR('copy'), iN=pooledOR('naivekid');
  const nB=pooledON('bi'), nC=pooledON('copy'), nN=pooledON('naivekid');
  const sg=pairGap(offspringSurvival,'bi','naivekid'), ig=pairGap(offspringRate,'bi','naivekid');
  const gate=!g1||![rST,rSN,oB,oC,oN,iB,iC,iN].every(Number.isFinite)||![nB,nC,nN].every(Number.isFinite)||!sg.every(Number.isFinite)||!ig.every(Number.isFinite)?{go:false,verdict:'INVALID',reason:'integrity failed (mains/colony-tables)'}
    :!seeds.every(s=>{const r=get('trainAB',s);return r&&r.aDigest&&r.initDigest&&r.aDigest!==r.initDigest&&r.bDigest!==r.aDigest;})?{go:false,verdict:'GEN1-BIPAR2-INVALID-NOLEARN',reason:'AB did not learn (digest unmoved — no content to test)'}
    :!(rST>rSN)?{go:false,verdict:'GEN1-BIPAR2-INCOMPLETE-NOSKILL',reason:'no usable skill on this bank: skillT '+rST.toFixed(4)+'/tick vs skillN '+rSN.toFixed(4)+'/tick (void)'}
    :(nB<BP2_MIN_OFFSPRING||nC<BP2_MIN_OFFSPRING||nN<BP2_MIN_OFFSPRING)?{go:false,verdict:'GEN1-BIPAR2-INCOMPLETE-LOWBIRTHS',reason:'too few offspring to compare (bi '+nB+' copy '+nC+' naivekid '+nN+' < '+BP2_MIN_OFFSPRING+'/arm — void)'}
    :!(oC>=0.05)?{go:false,verdict:'GEN1-BIPAR2-FLOOR-V1',reason:'floor: copy survival '+oC.toFixed(3)+' < 0.05 — report the floor, do not retune food, no claim'}
    :(sg.every(v=>v>0.10)&&ig.every(v=>v>0.002))?{go:true,verdict:'GEN1-BIPAR2-GO-V1',reason:'recombination preserves a usable edge, both pairs: surv gaps '+sg.map(v=>v.toFixed(3)).join('/')+' (bi '+oB.toFixed(3)+' vs naive '+oN.toFixed(3)+'), intake gaps '+ig.map(v=>v.toFixed(4)).join('/')+'/tick; copy surv '+oC.toFixed(3)+' descriptive; n='+nB+'/'+nC+'/'+nN+''}
    :{go:false,verdict:'GEN1-BIPAR2-NOGO-V1',reason:'recombination does not preserve the edge: surv gaps '+sg.map(v=>v.toFixed(3)).join('/')+' (bi '+oB.toFixed(3)+' vs naive '+oN.toFixed(3)+'), intake gaps '+ig.map(v=>v.toFixed(4)).join('/')+'/tick; copy surv '+oC.toFixed(3)+' descriptive'};
  const f3=v=>Number.isFinite(v)?+v.toFixed(3):null;
  const f4=v=>Number.isFinite(v)?+v.toFixed(4):null;
  const ps={};for(const sd of seeds){const T=get('trainAB',sd);
    ps[sd]={trainLearnedA:T?T.aDigest!==T.initDigest:null,trainLearnedB:T?T.bDigest!==T.aDigest:null};
    for(const a of ['skillT','skillN','bi','copy','naivekid']){const R=get(a,sd);
      ps[sd][a+'Rate']=R?f4(heirRate(R)):null;ps[sd][a+'Offspring']=R?(offspringIds(R)||[]).length:null;
      ps[sd][a+'OffspringSurv']=R?f3(offspringSurvival(R)):null;ps[sd][a+'OffspringRate']=R?f4(offspringRate(R)):null;
      ps[sd][a+'Survival']=R&&Number.isFinite(R.survival)?f3(R.survival):null;
      ps[sd][a+'Split']=heirSplitLosers(R);ps[sd][a+'Causes']=causeSplit(R);ps[sd][a+'Exact']=R?.deathCauses??null;}}
  return {perSeed:ps,rate:{skillT:f4(rST),skillN:f4(rSN)},offspringSurvival:{bi:f3(oB),copy:f3(oC),naivekid:f3(oN)},offspringIntake:{bi:f4(iB),copy:f4(iC),naivekid:f4(iN)},biGap:{survPooled:f3(oB-oN),intakePooled:f4(iB-iN),survPairs:sg.map(v=>+v.toFixed(3)),intakePairs:ig.map(v=>+v.toFixed(4))},offspringN:{bi:nB,copy:nC,naivekid:nN},g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
export function causeSplit(r){
  // Count per-agent causes from the row agents table. Pure.
  if(!r||!Array.isArray(r.agents))return null;
  const out={energy:0,age:0,both:0,alive:0};
  for(const a of r.agents){if(a.died===null)out.alive++;else if(a.cause==='age')out.age++;else if(a.cause==='both')out.both++;else out.energy++;}
  return out;
}
