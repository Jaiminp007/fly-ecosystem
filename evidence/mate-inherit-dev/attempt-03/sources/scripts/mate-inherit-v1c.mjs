// MATE-INHERIT Phase-C dev instrument (FROZEN under docs/MATE_INHERIT_PLAN_V1C.md).
// Exact V1b replication + lineage resolution: 2 arms (exact copy vs
// +N(0,0.05) per-copy mutation, BOTH enriched nutrient 5.0) x 6 histories
// = 12 mains (BT_TICKS=1792), ZERO probes. V1 showed exact-copy transmits
// but changes nothing (16/16 identical, 0 gen-2); V1f proved gen-2 exists
// under enrichment; V1b weak-GO (mutant 3 > exact 2). V1c asks whether the
// edge replicates on a fresh bank, plus lineage-founder resolution (who
// descends from whom, descriptive). GO iff mutant gen-2 >= 2 AND mutant >
// exact (FROZEN-identical bar — replication fidelity, not tuning).
// INCOMPLETE-NOMUTANTS iff mutant gen-1 == 0 (void, not NOGO). Else NOGO.
// No V1d licensed by this plan (line closes either way). No RSI claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const MI3_EXPERIMENT='mate-inherit-dev';
export const MI3_HISTORIES=6;
export const MI3_ARMS=Object.freeze(['exact','mutant']);
export const MI3_NOISE=Object.freeze({exact:null,mutant:0.05});
export const MI3_NUTRIENT=5;
export const MI3_EXPECT_MAINS=12, MI3_EXPECT_PROBES=0;
export const MI3_OP_CAP=20_000_000_000, MI3_WALL_CAP_SECONDS=3600;
export const MI3_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>417001+j));
const MI3_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[416001,416054]];
export const MI3_SPENT_SEEDS=Object.freeze([381001,...MI3_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mateInheritV1cExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/mate-inherit-v1c.mjs','docs/MATE_INHERIT_PLAN_V1C.md','tests/mate-inherit-v1c.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mateInheritV1cSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/mate-inherit-v1c.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/MATE_INHERIT_PLAN_V1C.md'])visit(resolve(root,name));
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
export function mateInheritV1cBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,MI3_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mateInheritV1cExtraTokens())excluded.add(t);
  for(const s of MI3_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of MI3_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=MI3_FIXTURE_SEEDS.length/MI3_HISTORIES===9?Array.from({length:MI3_HISTORIES},(_,h)=>{
    const s=MI3_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,MI3_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:MI3_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MATE-INHERIT V1c dev bank (deterministic fresh 417001-417054, 9/history, 6 histories). Spend: 12 mains (2 arms x 6 main-seeds); other 42 slots reserved-excluded, never spendable elsewhere. First use is the single V1c run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
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
// Maternal-line founders (exported for fixtures): founder id per gen-2+
// birth, following parents[0] (mother-first per engine makeFly) to
// generation 0. Orphan chains (missing parent entry) are dropped; cycles
// break via visited set (dropped, never infinite). Pure. Descriptive only
// (spread-vs-concentration reading); the GO gate uses counts, not this.
export function summarizeLineageFounders(lineage){
  const byId={};
  for(const e of lineage)if(e&&Number.isInteger(e.id))byId[e.id]=e;
  const founderOf=(id)=>{
    const seen=new Set();let cur=byId[id],guard=0;
    while(cur&&Number.isInteger(cur.generation)&&cur.generation>0){
      if(guard++>10000||seen.has(cur.id))return null;
      seen.add(cur.id);
      if(!Array.isArray(cur.parents)||!cur.parents.length)return null;
      cur=byId[cur.parents[0]];
    }
    if(!cur||cur.generation!==0)return null;
    return cur.id;
  };
  const out={gen2:[],gen3:[]};
  for(const e of lineage){
    if(!e||!Number.isInteger(e.generation)||e.generation<2)continue;
    if(!Array.isArray(e.parents)||!e.parents.length)continue;
    const f=founderOf(e.id);
    if(f===null)continue;
    if(e.generation===2)out.gen2.push(f);else out.gen3.push(f);
  }
  return out;
}
// Flat per-arm founder-id lists (exported for fixtures): one entry per
// gen-2+ birth (duplicates kept — concentration is the signal). Pure.
export function collectFounderIds(rows,arm,gen){
  const out=[];
  for(const r of rows){
    if(!r||r.arm!==arm||!r.lineageFounders||!Array.isArray(r.lineageFounders[gen]))continue;
    for(const id of r.lineageFounders[gen])out.push(id);
  }
  return out;
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
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMateInheritV1c({bankPath,output,resume=false}){
  const sources=mateInheritV1cSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mateInheritV1cBank(bankPathAbs);
  assert.equal(p.histories.length,MI3_HISTORIES);
  // Fixture AFTER bank build (standing order since V1b-turn-gated... V1 pre-built its file; lesson stands).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...MI3_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'mate-inherit-v1c-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...MI3_ARMS],transmissionNoisePerArm:{...MI3_NOISE},nutrientOverride:5,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',reproduction:true,
      caps:{executions:300,aggregateScalarOperations:MI3_OP_CAP,wallSeconds:MI3_WALL_CAP_SECONDS},
      scope:'MATE-INHERIT V1c exact V1b replication + lineage-founder resolution; exact vs N(0,0.05) mutant, both enriched (nutrient override 5). GO iff mutant gen-2 >= 2 AND mutant > exact (FROZEN-identical bar); INCOMPLETE-NOMUTANTS iff mutant gen-1 == 0; else NOGO (closes line as unconfirmed). Descriptive spread-vs-concentration reading; no V1d. No population/learning/RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=MI3_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of MI3_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,mode:'maternal',matingDecoupled:true,matingEnergyBar:50,nutrientOverride:5,transmissionNoise:MI3_NOISE[arm],curves:{},phaseRows:null,endpoint:null,births:null,generations:null,gen1Lifespan:null,lineageFounders:null};
        assert.equal(row.mode,'maternal','Row/arm mode mismatch');
        assert.equal(row.matingDecoupled,true,'Row/main flag mismatch');
        assert.equal(row.matingEnergyBar,50,'Row/main energy-bar mismatch');
        assert.equal(row.nutrientOverride,5,'Row/main nutrient-override mismatch');
        assert.equal(row.transmissionNoise,MI3_NOISE[arm],'Row/main noise mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5,transmissionNoise:MI3_NOISE[arm]});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const births=run.world.totals.births;
        assert.ok(Number.isInteger(births)&&births>=0,`${arm}/${history.seed}: invalid births total`);
        const generations=summarizeGenerations(run.world.lineage);
        const gen1Lifespan=meanGen1Lifespan(run.world.lineage,BT_TICKS);
        const lineageFounders=summarizeLineageFounders(run.world.lineage);
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.births=births;row.generations=generations;row.gen1Lifespan=gen1Lifespan;row.lineageFounders=lineageFounders;
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
  assert.deepEqual(mateInheritV1cSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=MI3_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,MI3_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,MI3_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreMateInheritV1cRows(rows);
  const founderSpread={};
  for(const arm of MI3_ARMS)founderSpread[arm]={gen2:collectFounderIds(rows,arm,'gen2'),gen3:collectFounderIds(rows,arm,'gen3')};
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,founderSpread,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,founderSpread};
}
export function scoreMateInheritV1cRows(rows){
  // V1c: does the weak V1b edge replicate on a fresh bank? GO iff mutant gen-2 >= 2 AND mutant > exact (FROZEN-identical bar).
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of MI3_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Number.isInteger(r.births)||r.births<0)return null;
    const g=r.generations;
    if(!g||!Number.isInteger(g.gen1)||g.gen1<0||!Number.isInteger(g.gen2)||g.gen2<0)return null;
    return {seed,births:r.births,gen1:g.gen1,gen2:g.gen2,nutrientOverride:r.nutrientOverride,transmissionNoise:r.transmissionNoise};
  });
  const g1=rows.length===MI3_EXPECT_MAINS&&MI3_ARMS.every(a=>rows.filter(r=>r.arm===a).length===6)&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  const g2=g1&&rows.every(r=>r.matingDecoupled===true&&r.mode==='maternal'&&r.matingEnergyBar===50&&
    r.nutrientOverride===5&&r.transmissionNoise===MI3_NOISE[r.arm]&&Number.isInteger(r.births)&&r.births>=0&&
    r.generations&&Number.isInteger(r.generations.gen1)&&r.generations.gen1>=0&&
    Number.isInteger(r.generations.gen2)&&r.generations.gen2>=0&&
    r.lineageFounders&&Array.isArray(r.lineageFounders.gen2)&&Array.isArray(r.lineageFounders.gen3));
  const tot=(arm,key)=>perArm[arm].every(x=>x!==null)?perArm[arm].reduce((a,x)=>a+x[key],0):null;
  const cGen1=tot('exact','gen1'),cGen2=tot('exact','gen2'),mGen1=tot('mutant','gen1'),mGen2=tot('mutant','gen2');
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/birth/generation/noise audit failed'}
    :(cGen1===null||cGen2===null||mGen1===null||mGen2===null)?{go:false,verdict:'INVALID',reason:'generation totals uncomputable — malformed rows'}
    :mGen1===0?{go:false,verdict:'INCOMPLETE-NOMUTANTS',reason:'mutant gen-1 == 0 — nothing to compound, void (not NOGO)'}
    :(mGen2!==null&&mGen2>=2&&mGen2>cGen2)?{go:true,verdict:'MATE-INHERIT-GO-V1C',reason:'mutant gen-2 = '+mGen2+' >= 2 and > exact '+cGen2+' — edge replicates on fresh bank'}
    :{go:false,verdict:'MATE-INHERIT-NOGO-V1C',reason:'mutant gen-2 = '+mGen2+' vs exact '+cGen2+' — edge does not replicate; line closes as unconfirmed'};
  return {perArm,exactGen1:cGen1,exactGen2:cGen2,mutantGen1:mGen1,mutantGen2:mGen2,g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
