// GEN1-COHAB dev instrument (FROZEN under docs/GEN1_LEFTOVER_PLAN_V1.md). No-copy:
// Train A->B founders; colonies birth copy/naive offspring (learning on);
// extract offspring weights; B-train groups (learn on, engine B-entry);
// frozen A-probe groups (original cues). Scored: probe intake copy vs
// naive. GO iff copy-naive>+0.002/tick and copy>0. B-entry mirrors engine
// step lines 209-212 (same fn, same seeds); group size via reference.
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

export const GLF_EXPERIMENT='gen1-leftover-dev';
export const GLF_ARMS=Object.freeze(['trainA','skillT','skillN','leftover','dummyfresh','probeLeft','probeFresh']);
export const GLF_MIN_OFFSPRING=6;
export const GLF_TRAIN_TICKS=512, GLF_PROBE_TICKS=1792, GLF_SKILL_TICKS=256;
export const GLF_DEPLETE_TICKS=1024, GLF_MEASURE_TICKS=1792;
export const GLF_PLACE_ENERGY=48;
export const GLF_MARGIN=1.1;
export const GLF_EXPECT_MAINS=2, GLF_EXPECT_PROBES=12;
export const GLF_B_TICKS=512, GLF_APROBE_TICKS=256, GLF_EDGE=0.002;
export const GLF_SHAPE_TICKS=256;
export const GLF_LEARN_TICKS=256;
export const GLF_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474793+j));
export const GLF_BIN_TICKS=64, GLF_SERIES_TICKS=32;
export const GLF_NEVER_FRAC=0.1, GLF_SUPERMAJORITY=2/3, GLF_MIN_LOSERS=4;
export const GLF_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490307+j));
const GLF_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[474235,474252],[474253,474270],[474271,474288],[474289,474306],[474325,474342],[474343,474360],[474361,474378],[474379,474396],[474397,474414],[474415,474432],[474433,474450],[474451,474468],[474469,474486],[474487,474504],[474505,474522],[474523,474540],[474541,474558],[474559,474576],[474577,474594],[474595,474612],[474613,474630],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045],[490046,490054],[490055,490063],[490064,490072],[490073,490081],[490082,490090],[490091,490099],[490100,490108],[490118,490126],[490127,490135],[490136,490144],[490145,490153],[490154,490162],[490163,490171],[490172,490180],[490181,490189],[490190,490198],[490199,490207],[490208,490216],[490217,490225],[490226,490234],[490235,490243],[490244,490252],[490253,490261],[490262,490270],[490271,490279],[490280,490288],[490289,490297],[490298,490306],[490307,490315],[474631,474648],[474649,474666],[474667,474684],[474685,474702],[474703,474720],[474721,474738],[474739,474756],[474757,474774],[474775,474792]];
export const GLF_SPENT_SEEDS=Object.freeze([381001,...GLF_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const GLF_OP_CAP=20_000_000_000, GLF_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gcrExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-leftover-dev.mjs','docs/GEN1_LEFTOVER_PLAN_V1.md','tests/gen1-leftover-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gcrSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-leftover-dev.mjs','scripts/memory-reset-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_LEFTOVER_PLAN_V1.md'])visit(resolve(root,name));
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
export function glfBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,GLF_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gcrExtraTokens())excluded.add(t);
  for(const s of GLF_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of GLF_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=GLF_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=GLF_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:GLF_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-LEFTOVER V1 dev bank (deterministic fresh 474793-474810, 18 seeds, 2 main histories). Spend: 2 trains + 4 skill + 4 shape/learn + 4 probes runs (14 total). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function placeLeftoverMixed(run,skilledSnap,nSkilled=12){
  // Mixed ecology: first nSkilled ids (sorted) get skilled weights +
  // frozen (teachers/dummies); the rest keep init weights + learning ON
  // (learners). skilledSnap null = dummy arm (frozen init agents that
  // forage poorly). Energies uniform + book delta. Returns learner ids.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  assert.ok(ids.length>=2*nSkilled*.5&&nSkilled>=1&&nSkilled<ids.length,'cohab split infeasible');
  const skilledIds=ids.slice(0,nSkilled), learnerIds=ids.slice(nSkilled);
  let transferred=0;
  if(skilledSnap){
    const src={};skilledIds.forEach(id=>{src[id]=skilledSnap[id]??skilledSnap[Object.keys(skilledSnap)[0]];});
    for(const id of skilledIds){
      const dst=run.learners[id], w=src[id];
      assert.ok(dst&&w&&typeof w==='object','missing agent snapshot '+id);
      for(const k of Object.keys(w)){
        assert.ok(Array.isArray(dst.weights?.[k])&&dst.weights[k].length===w[k].length,'weights shape mismatch '+id+'/'+k);
        dst.weights[k]=[...w[k]];
      }
      transferred++;
    }
    for(const id of skilledIds)assert.equal(JSON.stringify(run.learners[id].weights),JSON.stringify(src[id]),'cohab skilled value mismatch '+id);
  }
  for(const id of skilledIds){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=GLF_PLACE_ENERGY-fly.energy;fly.energy=GLF_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred,placedEnergyDelta:delta,skilledIds,learnerIds};
}
export function placeResetLearn(run,initSnap){
  // Reset-all-to-init + learning ON: minds back to tick-0 weights
  // (world kept as shaped), stores cleared, eligibility zeroed,
  // acquisition re-enabled, energies to uniform + book delta. The
  // shaped field persists; only minds reset (PLACED-style op, but
  // learning resumes instead of freezing).
  const ids=Object.keys(run.learners);
  for(const id of ids){
    const dst=run.learners[id], w=initSnap[id];
    assert.ok(dst&&w&&typeof w==='object','missing agent snapshot '+id);
    for(const k of Object.keys(w)){
      assert.ok(Array.isArray(dst.weights?.[k])&&dst.weights[k].length===w[k].length,'weights shape mismatch '+id+'/'+k);
      dst.weights[k]=[...w[k]];
    }
  }
  assert.equal(digestWeights(Object.fromEntries(ids.map(id=>[id,initSnap[id]]))),digestWeights(snapshotWeights(run.learners)),'reset placement digest mismatch');
  for(const id of Object.keys(run.learners)){clearStore(run.learners[id]);run.learners[id].eligibility.actor.fill(0);run.learners[id].eligibility.critic.fill(0);run.learners[id].acquisition=true;run.learners[id].motorPending=null;}
  let delta=0;
  for(const fly of run.world.flies){delta+=GLF_PLACE_ENERGY-fly.energy;fly.energy=GLF_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:ids.length,placedEnergyDelta:delta};
}
export function placeLeftoverSkilled(run,aSnap){
  // Place A-trained minds: A-weights in (transplant op), store cleared,
  // frozen, energies to uniform. Same books re-baseline as placeNaiveL2.
  const cp=copyWeights(aSnap,run.learners);
  const chk=checkTransplantIntegrity(aSnap,run.learners);
  assert.ok(chk.ok,'trained placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(aSnap),digestWeights(snapshotWeights(run.learners)),'trained placement digest mismatch');
  for(const id of Object.keys(run.learners)){clearStore(run.learners[id]);freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=GLF_PLACE_ENERGY-fly.energy;fly.energy=GLF_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function placeNaiveL2(run,initSnap){
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
  for(const fly of run.world.flies){delta+=GLF_PLACE_ENERGY-fly.energy;fly.energy=GLF_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function placeLeftoverGroup(run,weightsArray,freeze){
  // Place per-agent weights (id-sorted order): each group member keeps
  // its OWN extracted weights (not a uniform transplant). Store cleared,
  // energies to uniform + book delta. freeze=true: frozen (A-probe);
  // false: acquisition left on (B-train). Digest-checked both ways.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  assert.equal(ids.length,weightsArray.length,'group size mismatch');
  const src={};ids.forEach((id,k)=>{src[id]=weightsArray[k];});
  const cp=copyWeights(src,run.learners);
  const chk=checkTransplantIntegrity(src,run.learners);
  assert.ok(chk.ok,'group placement transplant failed: '+chk.violations.join(';'));
  assert.equal(digestWeights(src),digestWeights(snapshotWeights(run.learners)),'group placement digest mismatch');
  for(const id of ids){clearStore(run.learners[id]);if(freeze)freezeTasteEnergyBody(run.learners[id]);}
  let delta=0;
  for(const fly of run.world.flies){delta+=GLF_PLACE_ENERGY-fly.energy;fly.energy=GLF_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta};
}
export function enterPhaseB9(run,history){
  // Start a fresh run in phase B using the engine's own entry (mirrors
  // TasteExperiment.step lines 209-212: same fn, same phase, same
  // resourceSeeds[1]; nutrientOverride null path assigns nothing).
  run.phaseIndex=1;run.phaseEnd=512;
  run.resource=enterCuePhase(run.world,CONTINUAL_PHASES[1],history.resourceSeeds[1],run.codebook);
  return {phase:'B',seed:history.resourceSeeds[1]};
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
    if(ran%GLF_BIN_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      energyCurve.push(es.length?es.reduce((x,y)=>x+y,0)/es.length:0);
    }
    if(ran%GLF_SERIES_TICKS===0||ran===ticks){
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
  // energy books by the food delta (same disclosed pattern as placeNaiveL2
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
    if(ran%GLF_BIN_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      energyCurve.push(es.length?es.reduce((x,y)=>x+y,0)/es.length:0);
    }
    if(ran%GLF_SERIES_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      series.push({tick:ran,intake:+tickIntakeAcc.toFixed(3),
        energyMean:es.length?+(es.reduce((x,y)=>x+y,0)/es.length).toFixed(2):0,alive:es.length});
      tickIntakeAcc=0;
    }
  }
  for(const id of ids)if(agents[id].died===null)agents[id].lastEnergy=+lastSeen[id].energy.toFixed(2);
  return {toxin,food,cost,energyCurve,series,ran,agents:Object.values(agents)};
}
export function runGen1Leftover({bankPath,output,resume=false}){
  const sources=gcrSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=glfBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-leftover-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...GLF_ARMS],histories:p.histories.map(h=>h.seed),
      depleteTicks:GLF_DEPLETE_TICKS,measureTicks:GLF_MEASURE_TICKS,placeEnergy:GLF_PLACE_ENERGY,margin:GLF_MARGIN,
      caps:{executions:300,aggregateScalarOperations:GLF_OP_CAP,wallSeconds:GLF_WALL_CAP_SECONDS},
      scope:'GEN1-LEFTOVER V1 single attempt. A512 train, skill pair (256, gate), leftover vs dummyfresh fields (shape 256 with skilled-frozen or frozen-init dummies, reset-all-to-init + energy 48 + learning ON, learn 256, all inside phase A — engine re-lays fields at phase boundaries; repro OFF), extract survivors, frozen A-probes 256 (original cues). Gates: A-digest else INVALID; skill else INCOMPLETE-NOSKILL. Scored: probe cue-intake (not deaths). GO iff leftover-dummy>+0.002/tick and leftover>0 else NOGO. World survival descriptive. No new sensor/food, no weight copy, skilled absent during learning.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops,founders=BT_FOUNDERS)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*founders;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=GLF_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    const {wall}=timed(`run-${h.seed}`,()=>{
      // Task A train only (cohab has no B phase): standard codebook, learn ON, 512 ticks.
      let trow=rows.find(r=>r.history.seed===h.seed&&r.arm==='trainA');
      if(trow&&trow.endpoint){console.log(JSON.stringify({stage:'skip',arm:'trainA',seed:h.seed,reason:'complete on disk'}));}
      else{
        if(resume)redone.push(`${h.seed}:trainA`);
        const run=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        const initSnap=snapshotWeights(run.learners);
        const initDigest=digestWeights(initSnap);
        run.advance(GLF_TRAIN_TICKS);
        const aSnap=snapshotWeights(run.learners);
        const aDigest=digestWeights(aSnap);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`trainA/${h.seed}`);
        const surv=survivalFraction(run);
        trow={history:{seed:h.seed},arm:'trainA',stage:'train',survival:+surv.toFixed(4),
          meteredTicks:512,
          initDigest,aDigest,bDigest:aDigest,aWeights:aSnap,bWeights:aSnap,
          deathCauses:{...(run.world.totals.deathCauses??{energy:0,age:0})},endpoint};
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for trainA/'+h.seed);
        note(1,0,512,endpoint.scalarOperations);
        rows.push(trow);
        writeOver(join(outputAbs,'rows',`${h.seed}-trainA.json`),trow);
        checkpointLedger();
        console.log(JSON.stringify({stage:'train',arm:'trainA',seed:h.seed,learnedA:aDigest!==initDigest,ranTicks:512}));
      }
      const aSnap=trow.aWeights;
      const mkRun=(extra={},ref=null)=>new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,...(ref?{reference:ref}:{}),...extra});
      const pushRow=(arm,stage,run,metered,extra={})=>{
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${h.seed}`);
        const surv=survivalFraction(run);
        const finalDigest=digestWeights(snapshotWeights(run.learners));
        const row={history:{seed:h.seed},arm,stage,frozen:extra.frozen??true,transferred:extra.transferred,placedEnergyDelta:extra.placedEnergyDelta,learnerIds:extra.learnerIds??null,survival:+surv.toFixed(4),
          meteredTicks:metered?metered.ran:extra.ticks,toxin:metered?metered.toxin:undefined,food:metered?metered.food:extra.food,cost:metered?metered.cost:undefined,energyCurve:metered?metered.energyCurve.map(v=>+v.toFixed(2)):[],series:metered?metered.series:[],agents:metered?metered.agents:extra.agents,
          founders:[...run.founderIds],vt:extra.vt??'none',
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
          const placed=snap?placeLeftoverSkilled(run,snap):placeNaiveL2(run,snapshotWeights(run.learners));
          const metered=meteredAdvanceCauses(run,GLF_SKILL_TICKS,false);
          note(0,1,GLF_SKILL_TICKS,run.endpoint().scalarOperations);
          row=pushRow(arm,'probe',run,metered,{transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta});
        }
      }
      // Leftover vs dummyfresh worlds (repro OFF throughout). Shape 512
      // ticks with shapers present (skilled frozen, or frozen-init
      // dummies + learning-init bystanders), then reset-ALL-to-init +
      // energy 48 + acquisition ON (world kept as shaped), then learn
      // 1792 ticks. Survivors' weights extracted live; frozen probes
      // read them on original cues.
      const worlds={}, worldRuns={};
      for(const spec of [{arm:'leftover',skilled:true},{arm:'dummyfresh',skilled:false}]){
        const arm=spec.arm;
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));}
        else{
          if(resume)redone.push(`${h.seed}:${arm}`);
          const run=mkRun();
          const initSnap=snapshotWeights(run.learners);
          const shaped=spec.skilled?placeLeftoverSkilled(run,aSnap):placeLeftoverMixed(run,null,12);
          const shapeMet=meteredAdvanceCauses(run,GLF_SHAPE_TICKS,false);
          const reset=placeResetLearn(run,initSnap);
          const metered=meteredAdvanceCauses(run,GLF_LEARN_TICKS,false);
          const wmap=snapshotWeights(run.learners);
          const alive=Object.keys(run.learners).map(Number).filter(id=>run.world.flies.some(f=>f.id===id)).sort((a,b)=>a-b);
          worldRuns[arm]={weights:alive.map(id=>wmap[id]),learnerIds:alive};
          note(0,1,GLF_SHAPE_TICKS+GLF_LEARN_TICKS,run.endpoint().scalarOperations);
          row=pushRow(arm,'world',run,metered,{transferred:(shaped.transferred??0)+reset.transferred,placedEnergyDelta:(shaped.placedEnergyDelta??0)+reset.placedEnergyDelta,learnerIds:alive,frozen:false});
        }
        worlds[arm]=row;
      }
      for(const spec of [{arm:'probeLeft',col:'leftover'},{arm:'probeFresh',col:'dummyfresh'}]){
        const arm=spec.arm;
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));}
        else{
          if(resume)redone.push(`${h.seed}:${arm}`);
          assert.ok(worldRuns[spec.col],'probe needs fresh world run for '+h.seed+' (resume mid-chain re-runs it)');
          const grp=worldRuns[spec.col].weights;
          assert.ok(grp.length>=2,'probe group <2 for '+h.seed+'/'+arm);
          const ref={...VALUE_REFERENCE,founders:grp.length};
          const run=mkRun({},ref);
          const placed=placeLeftoverGroup(run,grp,true);
          const metered=meteredAdvanceCauses(run,GLF_APROBE_TICKS,false);
          note(0,1,GLF_APROBE_TICKS,run.endpoint().scalarOperations);
          row=pushRow(arm,'aprobe',run,metered,{transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta,frozen:true});
        }
      }
    });
    runtimes[`run-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(gcrSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=GLF_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,GLF_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,GLF_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1LeftoverRows(rows);
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
export function leftoverSplitLosers(row){
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
    if(r<GLF_NEVER_FRAC*med)out.never++;
    else if(intake<costs)out.under++;
    else out.over++;
  }
  return out;
}
export function leftoverRate(row){
  // Net intake per agent-tick. Pure. Fixture-tested.
  if(!row||!row.food||!row.meteredTicks)return null;
  const ids=Object.keys(row.food);
  if(!ids.length)return null;
  const n=Array.isArray(row.agents)&&row.agents.length?row.agents.length:ids.length;
  let f=0;for(const id of ids)f+=row.food[id]??0;
  return f/n/row.meteredTicks;
}
export function leftoverToxin(row){
  // Toxin per agent-tick (inversion texture). Pure.
  if(!row||!row.toxin||!row.meteredTicks)return null;
  const ids=Object.keys(row.toxin);
  if(!ids.length)return null;
  const n=Array.isArray(row.agents)&&row.agents.length?row.agents.length:ids.length;
  let t=0;for(const id of ids)t+=row.toxin[id]??0;
  return t/n/row.meteredTicks;
}
export function leftoverOffspringIds(row){
  // Non-founder agent ids (any generation). Pure.
  if(!row||!Array.isArray(row.agents))return null;
  const f=new Set(row.founders||[]);
  return row.agents.filter(a=>!f.has(a.id));
}
export function leftoverOffspringSurvival(row){
  // Fraction of offspring alive at end. Pure.
  const off=leftoverOffspringIds(row);
  if(!off||!off.length)return null;
  return off.filter(a=>a.died===null).length/off.length;
}
export function leftoverOffspringRate(row){
  // Mean per-lived-tick net intake over offspring. Pure.
  const off=leftoverOffspringIds(row);
  if(!off||!off.length)return null;
  let f=0,t=0;for(const a of off){f+=(row.food||{})[a.id]??0;const lived=a.died!=null?a.died:(row.meteredTicks||1);t+=Math.max(1,lived);}
  return f/Math.max(1,t);
}
export function probeIntake9(row){
  // Per-agent-tick food intake over a probe row (all agents scored;
  // B-trains and A-probes hold exactly the placed group, no births).
  if(!row||!row.food||!row.meteredTicks)return null;
  const ids=Object.keys(row.food).map(Number);
  if(!ids.length)return null;
  let f=0;for(const id of ids)f+=(row.food[id]??0);
  return f/ids.length/row.meteredTicks;
}
export function scoreGen1LeftoverRows(rows){
  // A-content gate FIRST (every trainA aDigest != init) else INVALID.
  // Then SKILL gate: pooled skillT rate must exceed pooled skillN
  // else INCOMPLETE-NOSKILL (void — no skill to share the interval
  // with). Then GO iff leftover-naive probe intake MINUS dummyfresh-naive >
  // AND leftover > 0 (the shaped field teaches). Else NOGO (shaped
  // field does not teach — or depletion dominates). World survival descriptive
  // only (deaths NOT scored). No births (repro OFF).
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===14&&GLF_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&Number.isFinite(r.survival)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&((a==='trainA')?(typeof r.aDigest==='string'):(r.food&&Array.isArray(r.agents)));}));
  const get=(a,s)=>byArmSeed[a+':'+s];
  const pooledR=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r?leftoverRate(r):NaN;});return vs.every(Number.isFinite)?vs.reduce((x,y)=>x+y,0)/vs.length:NaN;};
  const pooledPI=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r?probeIntake9(r):NaN;});return vs.every(Number.isFinite)?vs.reduce((x,y)=>x+y,0)/vs.length:NaN;};
  const rST=pooledR('skillT'), rSN=pooledR('skillN');
  const pS=pooledPI('probeLeft'), pA=pooledPI('probeFresh');
  const edge=pS-pA;
  const gate=!g1||![rST,rSN,pS,pA].every(Number.isFinite)?{go:false,verdict:'INVALID',reason:'integrity failed (mains/pipeline-tables)'}
    :!seeds.every(s=>{const r=get('trainA',s);return r&&r.aDigest&&r.initDigest&&r.aDigest!==r.initDigest;})?{go:false,verdict:'GEN1-LEFTOVER-INVALID-NOLEARN',reason:'A did not learn (digest unmoved — no teachers to share with)'}
    :!(rST>rSN)?{go:false,verdict:'GEN1-LEFTOVER-INCOMPLETE-NOSKILL',reason:'no usable skill on this bank: skillT '+rST.toFixed(4)+'/tick vs skillN '+rSN.toFixed(4)+'/tick (void)'}
    :(edge>GLF_EDGE&&pS>0)?{go:true,verdict:'GEN1-LEFTOVER-GO-V1',reason:'leftover field teaches: leftover-naive probe '+pS.toFixed(4)+' vs dummyfresh-naive '+pA.toFixed(4)+'/tick (edge +'+edge.toFixed(4)+' > '+GLF_EDGE+')'}
    :{go:false,verdict:'GEN1-LEFTOVER-NOGO-V1',reason:'shaped field does not teach: leftover-naive '+pS.toFixed(4)+' vs dummyfresh-naive '+pA.toFixed(4)+'/tick (edge +'+edge.toFixed(4)+')'};
  const f3=v=>Number.isFinite(v)?+v.toFixed(3):null;
  const f4=v=>Number.isFinite(v)?+v.toFixed(4):null;
  const ps={};for(const sd of seeds){const T=get('trainA',sd);
    ps[sd]={trainLearnedA:T?T.aDigest!==T.initDigest:null};
    for(const a of GLF_ARMS){if(a==='trainA')continue;const R=get(a,sd);
      ps[sd][a+'Rate']=R?f4(leftoverRate(R)):null;
      ps[sd][a+'Learners']=R?(R.learnerIds||[]).length:null;
      ps[sd][a+'ProbeIntake']=R?f4(probeIntake9(R)):null;
      ps[sd][a+'Survival']=R&&Number.isFinite(R.survival)?f3(R.survival):null;
      ps[sd][a+'Split']=leftoverSplitLosers(R);ps[sd][a+'Causes']=causeSplit(R);ps[sd][a+'Exact']=R?.deathCauses??null;}}
  return {perSeed:ps,rate:{skillT:f4(rST),skillN:f4(rSN)},probeIntake:{leftover:f4(pS),dummyfresh:f4(pA),edge:f4(edge)},g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
export function causeSplit(r){
  // Count per-agent causes from the row agents table. Pure.
  if(!r||!Array.isArray(r.agents))return null;
  const out={energy:0,age:0,both:0,alive:0};
  for(const a of r.agents){if(a.died===null)out.alive++;else if(a.cause==='age')out.age++;else if(a.cause==='both')out.both++;else out.energy++;}
  return out;
}
