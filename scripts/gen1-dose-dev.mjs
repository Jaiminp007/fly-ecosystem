// GEN1-DOSE Phase-A dev instrument (FROZEN under docs/GEN1_DOSE_PLAN_V1.md).
// Identical naive minds in depleted vs fresh worlds: parental run learns
// 1024 ticks (depletes); snapshot init at 0; at 1024 copy init back over
// trained weights (V1 transplant op), clear store (memory-reset helper),
// freeze all, set every fly energy to 48 (newborn-level, uniform);
// advance K=1792; survival fraction. Fresh arm: same history, same
// placement at tick 0, same K. Minds identical by construction — only the
// world differs. Reproduction OFF (no births). 2 histories x 2 arms =
// 8 mains. Fresh arms get toxin-free codebook (all +1, same geometry); dose arms transfer frac-meals;
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

export const GDO_EXPERIMENT='gen1-dose-dev';
export const GDO_ARMS=Object.freeze(['asocial','half','threeq','deep']);
export const GDO_FRACS=Object.freeze({asocial:0,half:0.5,threeq:0.75,deep:0});
export const GDO_GIVE_K=3;
export const GDO_SURV_TOL=0.05;
export const GDO_DEPLETE_TICKS=1024, GDO_MEASURE_TICKS=1792;
export const GDO_PLACE_ENERGY=48;
export const GDO_MARGIN=1.1;
export const GDO_EXPECT_MAINS=8, GDO_EXPECT_PROBES=0;
export const GDO_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474487+j));
export const GDO_BIN_TICKS=64, GDO_SERIES_TICKS=32;
export const GDO_NEVER_FRAC=0.1, GDO_SUPERMAJORITY=2/3, GDO_MIN_LOSERS=4;
export const GDO_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490154+j));
const GDO_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[474235,474252],[474253,474270],[474271,474288],[474289,474306],[474325,474342],[474343,474360],[474361,474378],[474379,474396],[474397,474414],[474415,474432],[474433,474450],[474451,474468],[474469,474486],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045],[490046,490054],[490055,490063],[490064,490072],[490073,490081],[490082,490090],[490091,490099],[490100,490108],[490118,490126],[490127,490135],[490136,490144],[490145,490153],[490154,490162]];
export const GDO_SPENT_SEEDS=Object.freeze([381001,...GDO_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const GDO_OP_CAP=20_000_000_000, GDO_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gdoExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gen1-dose-dev.mjs','docs/GEN1_DOSE_PLAN_V1.md','tests/gen1-dose-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gdoSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gen1-dose-dev.mjs','scripts/memory-reset-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/GEN1_DOSE_PLAN_V1.md'])visit(resolve(root,name));
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
export function gdoBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,GDO_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gdoExtraTokens())excluded.add(t);
  for(const s of GDO_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of GDO_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=GDO_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=GDO_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:GDO_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GEN1-DOSE V1 dev bank (deterministic fresh 474487-474504, 18 seeds, 2 main histories). Spend: 8 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
  for(const fly of run.world.flies){delta+=GDO_PLACE_ENERGY-fly.energy;fly.energy=GDO_PLACE_ENERGY;}
  run.world.initialEnergy+=delta;
  return {transferred:cp.transferred,placedEnergyDelta:delta,frozen:true};
}
export function survivalFraction(run){
  // Fraction of founders alive. Pure. No censoring (all placed together,
  // observed full K unless the world ends early — it won't, K fixed).
  const alive=run.world.flies.length;
  assert.ok(alive<=run.founderIds.length);
  return alive/run.founderIds.length;
}
export function inferCause(lastEnergy,lastAge,lifespan){
  // Pre-registered rule: age takes precedence only at the cap; near-zero
  // energy with room on age is starvation. Pure. Fixture-tested.
  const ls=Number.isFinite(lifespan)?lifespan:Infinity;
  if(lastAge>=ls)return lastEnergy<=1?'both':'age';
  return 'energy';
}
export function doseTransfer(run,frac,k){
  // ONE stated food-transfer rule (Amendment-free, plan-native): after a
  // tick, every alive agent with intake (lastFood) > 0 gives frac of that
  // meal to the lowest-energy among its k nearest alive neighbors (ties:
  // nearest) â€” iff that recipient is below the donor post-meal energy
  // (down-gradient; neediest donor keeps). Free, zero-sum (donor -x,
  // recipient +x; world total unchanged). Returns {count, moved}.
  // Frozen behavior untouched (post-step energy surgery only).
  // Returns per-transfer details for metering (donor/recipient/amount).
  let count=0, moved=0; const details=[];
  const alive=run.world.flies;
  for(const donor of alive){
    const meal=donor.lastFood??0;
    if(!(meal>0))continue;
    let cands=[];
    for(const other of alive){
      if(other.id===donor.id)continue;
      const d=Math.hypot(other.x-donor.x,other.y-donor.y);
      cands.push({fly:other,d});
    }
    cands.sort((a,b)=>a.d-b.d||a.fly.id-b.fly.id);
    const near=cands.slice(0,k);
    let rec=null;
    for(const c of near)if(rec==null||c.fly.energy<rec.energy||(c.fly.energy===rec.energy&&c.fly.id<rec.id))rec=c.fly;
    if(rec==null||!(rec.energy<donor.energy))continue;
    const x=meal*frac;
    donor.energy-=x;rec.energy+=x;count++;moved+=x;
    details.push({donor:donor.id,recipient:rec.id,amount:x});
  }
  return {count,moved,details};
}
export function meteredAdvanceCauses(run,ticks,give=null){
  // meteredAdvance + per-agent cause tables + optional GIVE food-transfer
  // rule. Same world-steps as bulk advance; metering only. give=null
  // (off) or {frac,k}: post-step doseTransfer (zero-sum). Frozen behavior
  // untouched (energy surgery only). Returns metered fields + agents
  // table + transfer ledger {count, moved} + per-agent given/received.
  // Lifespans read once at placement (frozen naive genomes); each tick
  // snapshot last-seen {energy,age} per alive agent; on disappearance
  // (died during the tick) infer cause via inferCause.
  const ids=Object.keys(run.learners).map(Number).sort((a,b)=>a-b);
  const toxin={},food={},cost={},given={},received={};for(const id of ids){toxin[id]=0;food[id]=0;cost[id]=0;given[id]=0;received[id]=0;}
  const lifespan={};for(const fly of run.world.flies)lifespan[fly.id]=fly.genome?.traits?.lifespan;
  const lastSeen={};for(const fly of run.world.flies)lastSeen[fly.id]={energy:fly.energy,age:fly.age};
  const agents={};for(const id of ids)agents[id]={id,born:0,died:null,cause:null,lastEnergy:null};
  const energyCurve=[], series=[];
  let ran=0, tickIntakeAcc=0, giveCount=0, giveMoved=0;
  for(let k=0;k<ticks;k++){
    if(!run.step())break;
    ran++;
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
    if(give){
      const g=doseTransfer(run,give.frac,give.k);
      giveCount+=g.count;giveMoved+=g.moved;
      for(const d of g.details){given[d.donor]+=d.amount;received[d.recipient]+=d.amount;}
    }
    for(const id of ids)if(agents[id].died===null&&!alive.has(id)){
      agents[id].died=ran;agents[id].lastEnergy=+lastSeen[id].energy.toFixed(2);
      agents[id].cause=inferCause(lastSeen[id].energy,lastSeen[id].age,lifespan[id]);
    }
    if(ran%GDO_BIN_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      energyCurve.push(es.length?es.reduce((x,y)=>x+y,0)/es.length:0);
    }
    if(ran%GDO_SERIES_TICKS===0||ran===ticks){
      const es=run.world.flies.map(f=>f.energy);
      series.push({tick:ran,intake:+tickIntakeAcc.toFixed(3),
        energyMean:es.length?+(es.reduce((x,y)=>x+y,0)/es.length).toFixed(2):0,alive:es.length});
      tickIntakeAcc=0;
    }
  }
  for(const id of ids)if(agents[id].died===null)agents[id].lastEnergy=+lastSeen[id].energy.toFixed(2);
  return {toxin,food,cost,given,received,energyCurve,series,ran,agents:Object.values(agents),transfer:give?{count:giveCount,moved:+giveMoved.toFixed(3)}:null};
}
export function runGen1Dose({bankPath,output,resume=false}){
  const sources=gdoSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=gdoBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gen1-dose-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...GDO_ARMS],histories:p.histories.map(h=>h.seed),
      depleteTicks:GDO_DEPLETE_TICKS,measureTicks:GDO_MEASURE_TICKS,placeEnergy:GDO_PLACE_ENERGY,margin:GDO_MARGIN,
      caps:{executions:300,aggregateScalarOperations:GDO_OP_CAP,wallSeconds:GDO_WALL_CAP_SECONDS},
      scope:'GEN1-DOSE V1 single attempt. Asocial(0)/half(0.5)/threeq(0.75) frac-meals (lowest-energy of 3 nearest, down-gradient, free, zero-sum) + deep reference. Engagement (half+threeq moved>0) + freeze check then GO iff threeq UNDER < half UNDER AND threeq survival >= half - 0.05; else NOGO (flat=floor, rises/reverses=donor collapse). No new food.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops,founders=BT_FOUNDERS)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*ticks+probes*256)*founders;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=GDO_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const h of p.histories){
    const {wall}=timed(`run-${h.seed}`,()=>{
      for(const arm of GDO_ARMS){
        let row=rows.find(r=>r.history.seed===h.seed&&r.arm===arm);
        if(row&&row.endpoint){
          console.log(JSON.stringify({stage:'skip',arm,seed:h.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${h.seed}:${arm}`);
        const run=new TasteExperiment({history:h,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        const initSnap=snapshotWeights(run.learners);
        const initDigest=digestWeights(initSnap);
        if(arm==='deep')run.advance(GDO_DEPLETE_TICKS);
        else{const clean=cleanCodebook(h);run.resource=enterCuePhase(run.world,CONTINUAL_PHASES[0],h.resourceSeeds[0],clean);run.codebook=clean;}
        const placed=placeNaive(run,initSnap);
        const metered=meteredAdvanceCauses(run,GDO_MEASURE_TICKS,GDO_FRACS[arm]>0?{frac:GDO_FRACS[arm],k:GDO_GIVE_K}:null);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${h.seed}`);
        const surv=survivalFraction(run);
        const finalDigest=digestWeights(snapshotWeights(run.learners));
        row={history:{seed:h.seed},arm,stage:'main',frozen:placed.frozen,transferred:placed.transferred,placedEnergyDelta:placed.placedEnergyDelta,survival:+surv.toFixed(4),alert:metered.alert,
          meteredTicks:metered.ran,toxin:metered.toxin,food:metered.food,cost:metered.cost,given:metered.given,received:metered.received,transfer:metered.transfer,energyCurve:metered.energyCurve.map(v=>+v.toFixed(2)),series:metered.series,agents:metered.agents,
          depleteTicks:arm==='deep'?GDO_DEPLETE_TICKS:0,measureTicks:GDO_MEASURE_TICKS,initDigest,finalDigest,
          deathCauses:{...(run.world.totals.deathCauses??{energy:0,age:0})},endpoint};
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+h.seed);
        note(1,0,(arm==='deep'?GDO_DEPLETE_TICKS:0)+GDO_MEASURE_TICKS,endpoint.scalarOperations);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${h.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:h.seed,survival:+surv.toFixed(3),ranTicks:metered.ran}));
      }
    });
    runtimes[`run-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(gdoSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=GDO_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,GDO_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,GDO_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreGen1DoseRows(rows);
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
export function doseSplitLosers(row){
  // Pre-registered loser split on ONE row (fresh arm). Survivor median
  // per-tick intake (same run) is the reach reference. NEVER: dead with
  // per-lived-tick intake < 0.1 x survivor median (never found food).
  // UNDER: not NEVER and lifetime intake < lifetime costs (found but
  // insufficient). OVER: not NEVER and lifetime intake >= lifetime
  // costs (cap-waste + late crash, or timing â€” real category). Pure.
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
    if(r<GDO_NEVER_FRAC*med)out.never++;
    else if(intake<costs)out.under++;
    else out.over++;
  }
  return out;
}
export function doseBalanceMargin(row){
  // Lifetime per-agent margin: mean over agents of (48 + intake - costs
  // - endEnergy). Survivors: endEnergy = live energy (closes ~0 when
  // metering exact). Dead: endEnergy = 0 (died with <=0). Positive =
  // surplus lived; negative = deficit. Pure. Fixture-tested.
  if(!row||!Array.isArray(row.agents)||!row.agents.length)return null;
  const ms=row.agents.map(a=>{
    const intake=(row.food||{})[a.id]??0, costs=(row.cost||{})[a.id]??0;
    const end=a.died===null?(Number.isFinite(a.lastEnergy)?a.lastEnergy:0):0;
    return 48+intake-costs-end;
  });
  return ms.reduce((x,y)=>x+y,0)/ms.length;
}
export function underCount(row){
  // Pooled residual: UNDER losers in one row. Pure.
  if(!row)return 0;
  const sp=doseSplitLosers(row);
  return sp?sp.under:0;
}
export function scoreGen1DoseRows(rows){
  // Freeze check FIRST (all arms frozen) else INVALID. Then engagement:
  // half AND threeq pooled moved must exceed 0 else INVALID-NOTRANSFER.
  // Then GO iff (a) threeq pooled UNDER < half pooled UNDER (strictly â€”
  // residual falls) AND (b) threeq survival >= half survival - 0.05 (no
  // substantial reversal). Else NOGO (flat = floor at half; rises /
  // reverses = donor collapse, interior optimum). Asocial anchors the
  // curve descriptively; deep is viability/reference. No void except
  // engagement/fee-integrity.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=rows.length===8&&GDO_ARMS.every(a=>seeds.every(s=>{const r=byArmSeed[a+':'+s];return r&&r.toxin&&r.food&&r.cost&&r.given&&r.received&&Array.isArray(r.agents)&&Number.isFinite(r.survival)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&typeof r.initDigest==='string'&&typeof r.finalDigest==='string';}));
  const get=(a,s)=>byArmSeed[a+':'+s];
  const pooledS=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r&&Number.isFinite(r.survival)?r.survival:NaN;});return vs.reduce((x,y)=>x+y,0)/vs.length;};
  const pooledU=a=>seeds.map(s=>underCount(get(a,s))).reduce((x,y)=>x+y,0);
  const pooledM=a=>{const vs=seeds.map(s=>{const r=get(a,s);return r&&r.transfer?r.transfer.moved:NaN;});return vs.every(Number.isFinite)?vs.reduce((x,y)=>x+y,0):NaN;};
  const sA=pooledS('asocial'), sH=pooledS('half'), sT=pooledS('threeq'), sD=pooledS('deep');
  const uA=pooledU('asocial'), uH=pooledU('half'), uT=pooledU('threeq');
  const mH=pooledM('half'), mT=pooledM('threeq');
  const allFixed=seeds.every(s=>GDO_ARMS.every(a=>get(a,s).finalDigest===get(a,s).initDigest));
  const gate=!g1||!Number.isFinite(mH)||!Number.isFinite(mT)?{go:false,verdict:'INVALID',reason:'integrity failed (mains/transfer-tables)'}
    :!allFixed?{go:false,verdict:'INVALID',reason:'freeze broken: a digest moved (control contaminated)'}
    :!(mH>0&&mT>0)?{go:false,verdict:'GEN1-DOSE-INVALID-NOTRANSFER',reason:'rule inert: moved half '+mH+' threeq '+mT+' (no meals met needier neighbors)'}
    :(uT<uH&&sT>=sH-GDO_SURV_TOL)?{go:true,verdict:'GEN1-DOSE-GO-V1',reason:'residual falls with dose: UNDER asocial '+uA+' half '+uH+' threeq '+uT+' (strict); survival threeq '+sT.toFixed(3)+' vs half '+sH.toFixed(3)+' (no reversal; deep '+sD.toFixed(3)+' â€” thin n=2)'}
    :{go:false,verdict:'GEN1-DOSE-NOGO-V1',reason:'residual does not fall: UNDER asocial '+uA+' half '+uH+' threeq '+uT+'; survival threeq '+sT.toFixed(3)+' vs half '+sH.toFixed(3)+' (flat=floor at half; rises/reverses=donor collapse)'};
  const f2=v=>Number.isFinite(v)?+v.toFixed(2):null;
  const f3=v=>Number.isFinite(v)?+v.toFixed(3):null;
  const ps={};for(const sd of seeds){const A=get('asocial',sd),H=get('half',sd),T=get('threeq',sd),D=get('deep',sd);
    ps[sd]={asocialSurvival:A&&Number.isFinite(A.survival)?f3(A.survival):null,halfSurvival:H&&Number.isFinite(H.survival)?f3(H.survival):null,threeqSurvival:T&&Number.isFinite(T.survival)?f3(T.survival):null,deepSurvival:D&&Number.isFinite(D.survival)?f3(D.survival):null,
      asocialUnder:underCount(A),halfUnder:underCount(H),threeqUnder:underCount(T),
      halfTransfer:H?.transfer??null,threeqTransfer:T?.transfer??null,allFixed:A?A.finalDigest===A.initDigest:null,
      asocialSplit:doseSplitLosers(A),halfSplit:doseSplitLosers(H),threeqSplit:doseSplitLosers(T),deepSplit:doseSplitLosers(D),
      asocialMargin:f2(doseBalanceMargin(A)),halfMargin:f2(doseBalanceMargin(H)),threeqMargin:f2(doseBalanceMargin(T)),deepMargin:f2(doseBalanceMargin(D)),
      asocialCauses:causeSplit(A),halfCauses:causeSplit(H),threeqCauses:causeSplit(T),deepCauses:causeSplit(D),
      asocialExact:A?.deathCauses??null,halfExact:H?.deathCauses??null,threeqExact:T?.deathCauses??null,deepExact:D?.deathCauses??null};}
  return {perSeed:ps,survival:{asocial:f3(sA),half:f3(sH),threeq:f3(sT),deep:f3(sD)},under:{asocial:uA,half:uH,threeq:uT},moved:{half:f2(mH),threeq:f2(mT)},g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
export function causeSplit(r){
  // Count per-agent causes from the row agents table. Pure.
  if(!r||!Array.isArray(r.agents))return null;
  const out={energy:0,age:0,both:0,alive:0};
  for(const a of r.agents){if(a.died===null)out.alive++;else if(a.cause==='age')out.age++;else if(a.cause==='both')out.both++;else out.energy++;}
  return out;
}
