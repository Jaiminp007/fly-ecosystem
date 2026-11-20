// MATE-LEAVE V2 magnitude-ladder instrument (FROZEN under docs/MATE_LEAVE_PLAN_V2.md).
// k_L ladder on hub: hubLeave1 (weaken) / hubLeave2 (cancel, ML1 replication) / hubLeave4 (reverse) vs hub control (k_L=0)
// + spread anchor (spread+k_L=0, descriptive), ALL enriched 5.0 + maternal + decoupled, mateBias 0 all arms,
// 6 histories x 5 arms = 30 mains (BT_TICKS=1792), ZERO probes. ML1 GO (7v4, one-seed-concentrated) + 5 despotic banks
// prove despotic crowding: hub eats 25-35% less, ends 12-18 poorer (IFD rejected); queuing/monopoly/sync exonerated.
// ML2 tests replication + scaling: k_L=2 on fresh bank AND weak-monotone hub<=L1<=L2<=L4 with L4 > hub.
// GO-V2 iff hubLeave2 replicates gen-2 >= 2 AND weak-monotone hub<=L1<=L2<=L4 with L4 > hub (spacing scales with cancellation).
// Else NOGO-V2 (luck/saturation/reversal; magnitude thesis dead — deficit is structural/patch-geometric; policy leaves the table). Spread anchor DESCRIPTIVE.
// NO births gate (pre-registered). INCOMPLETE-NOBIRTHS iff hubLeave2 gen-1 == 0 (void).
// Line closes (LEAVE line; mating program continues on conversion/interference frontiers). No RSI claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {summarizeLineageFounders,collectFounderIds} from './mate-inherit-v1c.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const ML2_EXPERIMENT='mate-leave-v2';
export const ML2_HISTORIES=6;
export const ML2_ARMS=Object.freeze(['hubLeave1','hubLeave2','hubLeave4','hub','spread']);
export const ML2_ARM_TOPO=Object.freeze({hubLeave1:'hub',hubLeave2:'hub',hubLeave4:'hub',hub:'hub',spread:'spread'});
export const ML2_ARM_SENSE=Object.freeze({hubLeave1:1,hubLeave2:1,hubLeave4:1,hub:1,spread:1});
export const ML2_ARM_LEAVE=Object.freeze({hubLeave1:1,hubLeave2:2,hubLeave4:4,hub:0,spread:0});
export const ML2_ARM_LGATE=Object.freeze({hubLeave1:50,hubLeave2:50,hubLeave4:50,hub:null,spread:null});
export const ML2_NOISE=Object.freeze({hubLeave2:null,hub:null,spread:null});
export const ML2_NUTRIENT=5;
export const ML2_EXPECT_MAINS=30, ML2_EXPECT_PROBES=0;
export const ML2_OP_CAP=30_000_000_000, ML2_WALL_CAP_SECONDS=6000;
export const ML2_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>440001+j));
const ML2_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054]];
export const ML2_SPENT_SEEDS=Object.freeze([381001,...ML2_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mateLeaveV2ExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/mate-leave-v2.mjs','docs/MATE_LEAVE_PLAN_V2.md','tests/mate-leave-v2.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mateLeaveV2Sources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/mate-leave-v2.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/MATE_ATTRACT_PLAN_V1.md'])visit(resolve(root,name));
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
export function mateLeaveV2Bank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,ML2_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mateLeaveV2ExtraTokens())excluded.add(t);
  for(const s of ML2_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of ML2_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=ML2_FIXTURE_SEEDS.length/ML2_HISTORIES===9?Array.from({length:ML2_HISTORIES},(_,h)=>{
    const s=ML2_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,ML2_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:ML2_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MATE-LEAVE V2 dev bank (deterministic fresh-02 440001-440054, 9/history, 6 histories). Spend: 30 mains (5 arms x 6 main-seeds); other 36 slots reserved-excluded, never spendable elsewhere. First use is the single ML2 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Curve collector: per-tick observe energy (raw means+n; no pre-binning).
export function collectCurve(){
  const bins=new Map();
  const emit=e=>{
    if(e.type!=='observe'||!e.own||!Number.isInteger(e.own.tick)||!Number.isFinite(e.own.energy))return;
    const t=e.own.tick;
    let s=bins.get(t);if(!s){s={sum:0,n:0};bins.set(t,s);}
    s.sum+=e.own.energy;s.n++;
  };
  const means={};for(const [b,s] of bins)means[b]=s.sum/s.n;
  return {emit,bins,means};
}
// Generation summary (exported for fixtures): max generation observed +
// births per generation + gen-2+ count, from world.lineage. Founders
// (generation 0, no parents) are excluded from birth counts. Pure.
export function summarizeGenerations(lineage){
  const byGeneration={};let max=0;
  for(const e of lineage){
    if(!e||!Number.isInteger(e.generation))continue;
    max=Math.max(max,e.generation);
    if(e.parents&&e.parents.length>0)byGeneration[e.generation]=(byGeneration[e.generation]||0)+1;
  }
  let gen2=0;
  for(const [g,n] of Object.entries(byGeneration))if(Number(g)>=2)gen2+=n;
  const gen1=byGeneration[1]||0;
  return {maxGeneration:max,byGeneration,gen1,gen2};
}
// Mean gen-1 lifespan (exported for fixtures): distinguishes infant-mortality
// deleteriousness from failed mating. died==null counts as censored at
// endTick (survivors). Non-gen-1, parentless, or malformed entries skipped.
export function meanGen1Lifespan(lineage,endTick){
  let s=0,n=0,censored=0;
  for(const e of lineage){
    if(!e||e.generation!==1||!Array.isArray(e.parents)||e.parents.length===0)continue;
    if(!Number.isInteger(e.born))continue;
    const end=e.died==null?endTick:e.died;
    if(!Number.isInteger(end)||end<e.born)continue;
    s+=end-e.born;n++;if(e.died==null)censored++;
  }
  return {mean:n>0?s/n:null,n,censored};
}
// Time-to-first-mating (exported for fixtures; DESCRIPTIVE ONLY, non-gating):
// min gen-1 born tick; null when no gen-1 exists (censored — no mating observed).
export function firstMatingTick(lineage){
  let m=null;
  for(const e of lineage){
    if(!e||e.generation!==1||!Array.isArray(e.parents)||e.parents.length===0)continue;
    if(!Number.isInteger(e.born))continue;
    if(m===null||e.born<m)m=e.born;
  }
  return m;
}
// Frozen V1b row schema (V1 process lesson: freeze the keys; fixtures assert conformance).
export const ML2_ROW_SCHEMA=Object.freeze(['history','arm','mode','topology','sense','leave','lgate','matingDecoupled','matingEnergyBar','nutrientOverride','transmissionNoise','curves','phaseRows','endpoint','births','generations','gen1Lifespan','founderOffspring','lineageFounders','firstMatingTick','centersCount']);
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMateLeaveV2({bankPath,output,resume=false}){
  const sources=mateLeaveV2Sources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mateLeaveV2Bank(bankPathAbs);
  assert.equal(p.histories.length,ML2_HISTORIES);
  // Fixture AFTER bank build (standing order since V1b-turn-gated... V1 pre-built its file; lesson stands).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...ML2_FIXTURE_SEEDS]};
  if(existsSync(fixturePath))assert.deepEqual(read(fixturePath),fixture,'Fixture seeds file already exists with different content; will not overwrite');
  else write(fixturePath,fixture);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'mate-leave-v2-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...ML2_ARMS],topologyPerArm:{hubLeave1:'hub',hubLeave2:'hub',hubLeave4:'hub',hub:'hub',spread:'spread'},sensePerArm:{hubLeave1:1,hubLeave2:1,hubLeave4:1,hub:1,spread:1},leavePerArm:{hubLeave1:1,hubLeave2:2,hubLeave4:4,hub:0,spread:0},leaveGatePerArm:{hubLeave1:50,hubLeave2:50,hubLeave4:50,hub:null,spread:null},leaveRule:{lastFoodThr:0,energyRef:'bar'},mateBiasPerArm:{hubLeave1:0,hubLeave2:0,hubLeave4:0,hub:0,spread:0},nutrientOverride:5,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',reproduction:true,
      caps:{executions:300,aggregateScalarOperations:ML2_OP_CAP,wallSeconds:ML2_WALL_CAP_SECONDS},
      scope:'MATE-LEAVE V2 magnitude ladder k_L in {1,2,4}: hubLeave1/hubLeave2/hubLeave4 vs hub control (k_L=0) + spread anchor (descriptive), all enriched + maternal + decoupled, mateBias 0 all arms. GO-V2 iff hubLeave2 replicates gen-2 >= 2 AND weak-monotone hub<=L1<=L2<=L4 with L4 > hub (spacing scales). NO births gate (pre-registered). INCOMPLETE-NOBIRTHS iff hubLeave2 gen-1 == 0; else NOGO-V2. Line closes (LEAVE line). No population/learning/RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=ML2_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of ML2_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,mode:ML2_ARM_TOPO[arm],topology:ML2_ARM_TOPO[arm],sense:ML2_ARM_SENSE[arm],leave:ML2_ARM_LEAVE[arm],lgate:ML2_ARM_LGATE[arm],matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:ML2_NOISE[arm],curves:{},phaseRows:null,endpoint:null,births:null,generations:null,gen1Lifespan:null,founderOffspring:null,lineageFounders:null,firstMatingTick:null,centersCount:null};
        assert.equal(row.mode,ML2_ARM_TOPO[arm],'Row/arm topology mismatch');
        assert.equal(row.topology,ML2_ARM_TOPO[arm],'Row/arm topology-field mismatch');
        assert.equal(row.sense,ML2_ARM_SENSE[arm],'Row/arm sense mismatch');
        assert.equal(row.leave,ML2_ARM_LEAVE[arm],'Row/arm leave-bias mismatch');
        assert.equal(row.lgate,ML2_ARM_LGATE[arm],'Row/arm leave-gate mismatch');
        assert.equal(row.matingDecoupled,true,'Row/main flag mismatch');
        assert.equal(row.matingEnergyBar,50,'Row/main energy-bar mismatch');
        assert.equal(row.nutrientOverride,5,'Row/main nutrient-override mismatch');
        assert.equal(row.transmissionNoise,ML2_NOISE[arm],'Row/main noise mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,transmissionNoise:ML2_NOISE[arm],resourceTopology:ML2_ARM_TOPO[arm],mateSenseMultiplier:ML2_ARM_SENSE[arm],mateAttractBias:0,mateAttractEnergyGate:null,mateLeaveBias:ML2_ARM_LEAVE[arm],mateLeaveGate:ML2_ARM_LGATE[arm]});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const births=run.world.totals.births;
        assert.ok(Number.isInteger(births)&&births>=0,`${arm}/${history.seed}: invalid births total`);
        const generations=summarizeGenerations(run.world.lineage);
        const gen1Lifespan=meanGen1Lifespan(run.world.lineage,BT_TICKS);
        const lineageFounders=summarizeLineageFounders(run.world.lineage);
        const matingTick=firstMatingTick(run.world.lineage);
        const centersCount=run.world.resourceCenters.length;
        assert.equal(centersCount,{spread:3,hub:1}[ML2_ARM_TOPO[arm]],'Geography mismatch: '+arm+' shows '+centersCount+' centers');
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.births=births;row.generations=generations;row.gen1Lifespan=gen1Lifespan;row.lineageFounders=lineageFounders;row.firstMatingTick=matingTick;row.centersCount=centersCount;row.founderOffspring={...(run.founderOffspring||{})};
        assert.deepEqual(Object.keys(row).sort(),[...ML2_ROW_SCHEMA].sort(),'Row schema drift vs frozen ML2_ROW_SCHEMA');
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed);
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
      }
    });
    runtimes[arm]=wall;checkpointLedger();
  }
  assert.deepEqual(mateLeaveV2Sources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=ML2_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,ML2_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,ML2_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreMateLeaveV2Rows(rows);
  const founderSpread={};
  for(const arm of ML2_ARMS)founderSpread[arm]={gen2:collectFounderIds(rows,arm,'gen2'),gen3:collectFounderIds(rows,arm,'gen3')};
  const founderOffspring={};
  for(const arm of ML2_ARMS){const agg={};
    for(const r of rows){if(r.arm!==arm||!r.founderOffspring)continue;
      for(const [id,n] of Object.entries(r.founderOffspring))agg[id]=(agg[id]||0)+n;}
    founderOffspring[arm]=agg;}
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,founderSpread,founderOffspring,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,founderSpread,founderOffspring};
}
export function scoreMateLeaveV2Rows(rows){
  // ML2: magnitude ladder k_L in {1,2,4} (weaken/cancel/reverse: tanh(1)/0/tanh(-2)). GO-V2 iff hubLeave2 replicates gen-2 >= 2 AND weak-monotone hub<=L1<=L2<=L4 with L4 > hub (spacing scales with cancellation). Spread anchor descriptive.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of ML2_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Number.isInteger(r.births)||r.births<0)return null;
    const g=r.generations;
    if(!g||!Number.isInteger(g.gen1)||g.gen1<0||!Number.isInteger(g.gen2)||g.gen2<0)return null;
    return {seed,births:r.births,gen1:g.gen1,gen2:g.gen2,nutrientOverride:r.nutrientOverride,verticalTransmission:r.mode,topology:r.topology,firstMatingTick:(r.firstMatingTick===null||Number.isInteger(r.firstMatingTick))?r.firstMatingTick:null};
  });
  const g1=rows.length===ML2_EXPECT_MAINS&&ML2_ARMS.every(a=>rows.filter(r=>r.arm===a).length===6)&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  // CORRECTION 2026-10-31: row schema has no verticalTransmission field (runner hardcodes
  // 'maternal' for all arms; see attempt.json + sources closure). Maternal-both-arms is
  // established by that frozen literal, not per-row. ML1 addition: row schema likewise has
  // no mateBias field (runner hardcodes mateAttractBias:0 all arms — leave isolated).
  // All other clauses unchanged.
  const g2=g1&&rows.every(r=>r.matingDecoupled===true&&(r.mode==='spread'||r.mode==='hub')&&r.mode===r.topology&&r.topology===ML2_ARM_TOPO[r.arm]&&r.sense===ML2_ARM_SENSE[r.arm]&&r.leave===ML2_ARM_LEAVE[r.arm]&&r.lgate===ML2_ARM_LGATE[r.arm]&&r.centersCount==={spread:3,hub:1}[r.topology]&&r.matingEnergyBar===50&&
    r.nutrientOverride===5&&r.transmissionNoise===ML2_NOISE[r.arm]&&Number.isInteger(r.births)&&r.births>=0&&
    r.generations&&Number.isInteger(r.generations.gen1)&&r.generations.gen1>=0&&
    Number.isInteger(r.generations.gen2)&&r.generations.gen2>=0);
  const tot=(arm,key)=>perArm[arm].every(x=>x!==null)?perArm[arm].reduce((a,x)=>a+x[key],0):null;
  const aGen1=tot('hubLeave2','gen1'),aGen2=tot('hubLeave2','gen2'),cGen1=tot('hub','gen1'),cGen2=tot('hub','gen2'),hGen1=tot('spread','gen1'),hGen2=tot('spread','gen2'),l1Gen2=tot('hubLeave1','gen2'),l4Gen2=tot('hubLeave4','gen2');
  // NO births manipulation gate (precedent, pre-registered: births are bank-volatile;
  // engagement = fixture-level steering proof + G2 bias/geography audit, not birth totals).
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/birth/generation/geography audit failed'}
    :(aGen1===null||aGen2===null||cGen1===null||cGen2===null||hGen1===null||hGen2===null||l1Gen2===null||l4Gen2===null)?{go:false,verdict:'INVALID',reason:'generation totals uncomputable — malformed rows'}
    :aGen1===0?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:'hubLeave2 gen-1 == 0 — replication arm void, nothing to compound (not NOGO)'}
    :(aGen2!==null&&aGen2>=2&&cGen2!==null&&l1Gen2!==null&&l4Gen2!==null&&cGen2<=l1Gen2&&l1Gen2<=aGen2&&aGen2<=l4Gen2&&l4Gen2>cGen2)?{go:true,verdict:'MATE-LEAVE-GO-V2',reason:'leave dose: hubLeave2 gen-2 = '+aGen2+' >= 2 replicates and weak-monotone '+cGen2+'<='+l1Gen2+'<='+aGen2+'<='+l4Gen2+' with L4 > hub — spacing scales with cancellation'}
    :{go:false,verdict:'MATE-LEAVE-NOGO-V2',reason:'no leave dose: hubLeave2 gen-2 = '+aGen2+' vs L1 '+l1Gen2+' vs L4 '+l4Gen2+' vs hub '+cGen2+' — no monotone scaling (luck, saturation, or reversal)'};
  // DESCRIPTIVE ONLY (non-gating): per-arm first-mating ticks; R58 variance-dominance read.
  const fmt=arm=>perArm[arm].every(x=>x!==null)?perArm[arm].map(x=>x.firstMatingTick):null;
  const med=t=>{const v=t.filter(x=>x!==null).sort((a,b)=>a-b);return v.length?v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2:null;};
  const firstMating={hubLeave2:fmt('hubLeave2'),hub:fmt('hub'),spread:fmt('spread')};
  return {perArm,hubLeave2Gen2:aGen2,hubGen2:cGen2,spreadGen2:hGen2,hubLeave2Gen1:aGen1,hubGen1:cGen1,spreadGen1:hGen1,firstMating,g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
