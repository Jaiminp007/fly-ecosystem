// MATE-COMPOUND Phase-A dev instrument (FROZEN under docs/MATE_COMPOUND_PLAN_V1.md).
// Selection x transmission interaction: 2 arms (maternal-candidate learns
// every generation / maternal-unlearned frozen every generation) x 2 histories
// = 4 mains (BT_TICKS=1792), ZERO probes. Exact-copy maternal transmission
// (V1-proven path); births-occurring conditions bar 50 + nutrient 5.0.
// GO iff candidate-line births > unlearned-line (thin n=2 — licenses
// replication ONLY); all-zero -> INCOMPLETE-NOBIRTHS (void); else NOGO.
// No population/learning/RSI/retention claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {summarizeGenerations,meanGen1Lifespan} from './mate-inherit-v1b.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const MS_EXPERIMENT='mate-compound-dev';
export const MS_HISTORIES=2;
export const MS_ARMS=Object.freeze(['candidate','unlearned']);
export const MS_NUTRIENT=5;
export const MS_EXPECT_MAINS=4, MS_EXPECT_PROBES=0;
export const MS_OP_CAP=20_000_000_000, MS_WALL_CAP_SECONDS=3600;
export const MS_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>473100+j));
const MS_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099]];
export const MS_SPENT_SEEDS=Object.freeze([381001,...MS_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function mateSelectionExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/mate-compound-dev.mjs','docs/MATE_COMPOUND_PLAN_V1.md','tests/mate-selection-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function mateSelectionSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/mate-compound-dev.mjs','scripts/mate-inherit-v1b.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/MATE_COMPOUND_PLAN_V1.md'])visit(resolve(root,name));
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
export function mateSelectionBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,MS_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of mateSelectionExtraTokens())excluded.add(t);
  for(const s of MS_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of MS_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=MS_FIXTURE_SEEDS.length/MS_HISTORIES===9?Array.from({length:MS_HISTORIES},(_,h)=>{
    const s=MS_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,MS_HISTORIES*9,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:MS_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'MATE-COMPOUND V1 dev bank (deterministic fresh 473100-473117, 18 seeds, 2 histories). Spend: 4 mains (2 arms x 2 histories). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
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
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMateSelection({bankPath,output,resume=false}){
  const sources=mateSelectionSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=mateSelectionBank(bankPathAbs);
  assert.equal(p.histories.length,MS_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...MS_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'mate-selection-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...MS_ARMS],transmissionPerArm:'maternal',nutrientOverride:5,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',reproduction:true,
      caps:{executions:300,aggregateScalarOperations:MS_OP_CAP,wallSeconds:MS_WALL_CAP_SECONDS},
      scope:'MATE-COMPOUND V1 selection x transmission interaction; maternal-candidate vs maternal-unlearned founders. GO iff candidate-line births > unlearned-line; all-zero -> INCOMPLETE-NOBIRTHS; else NOGO. No population/learning/RSI/retention claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=MS_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of MS_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Object.keys(row.curves??{}).length>0){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,mode:'maternal',matingEnergyBar:50,nutrientOverride:5,transmission:'maternal',curves:{},phaseRows:null,endpoint:null,births:null,generations:null,gen1Lifespan:null};
        assert.equal(row.mode,'maternal','Row/arm mode mismatch');
        assert.equal(row.matingEnergyBar,50,'Row/main energy-bar mismatch');
        assert.equal(row.nutrientOverride,5,'Row/main nutrient-override mismatch');
        assert.equal(row.transmission,'maternal','Row/main transmission mismatch');
        const collector=collectCurve();
        const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'maternal',nutrientOverride:5});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        const births=run.world.totals.births;
        assert.ok(Number.isInteger(births)&&births>=0,`${arm}/${history.seed}: invalid births total`);
        const generations=summarizeGenerations(run.world.lineage);
        const gen1Lifespan=meanGen1Lifespan(run.world.lineage,BT_TICKS);
        const means={},counts={};
        for(const [b,s] of collector.bins){means[b]=s.sum/s.n;counts[b]=s.n;}
        row.curves={means,counts};row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.births=births;row.generations=generations;row.gen1Lifespan=gen1Lifespan;
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed);
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder,births}));
      }
    });
    runtimes[arm]=wall;checkpointLedger();
  }
  assert.deepEqual(mateSelectionSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=MS_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,MS_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,MS_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreMateSelectionRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreMateSelectionRows(rows){
  // V1-compound: does transmitted learning compound selection?
  // GO iff candidate-line births > unlearned-line births.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of MS_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Number.isInteger(r.births)||r.births<0)return null;
    const g=r.generations;
    if(!g||!Number.isInteger(g.gen1)||g.gen1<0||!Number.isInteger(g.gen2)||g.gen2<0)return null;
    return {seed,births:r.births,gen1:g.gen1,gen2:g.gen2,nutrientOverride:r.nutrientOverride,transmission:r.transmission};
  });
  const g1=rows.length===MS_EXPECT_MAINS&&MS_ARMS.every(a=>rows.filter(r=>r.arm===a).length===MS_HISTORIES)&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  const g2=g1&&rows.every(r=>r.mode==='maternal'&&r.matingEnergyBar===50&&r.nutrientOverride===5&&r.transmission==='maternal'&&
    Number.isInteger(r.births)&&r.births>=0&&
    r.generations&&Number.isInteger(r.generations.gen1)&&r.generations.gen1>=0&&
    Number.isInteger(r.generations.gen2)&&r.generations.gen2>=0);
  const tot=(arm,key)=>perArm[arm].every(x=>x!==null)?perArm[arm].reduce((a,x)=>a+x[key],0):null;
  const cB=tot('candidate','births'),uB=tot('unlearned','births');
  const cG2=tot('candidate','gen2'),uG2=tot('unlearned','gen2');
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/birth/generation audit failed'}
    :(cB===null||uB===null)?{go:false,verdict:'INVALID',reason:'birth totals uncomputable — malformed rows'}
    :(cB===0&&uB===0)?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:'both arms zero births — nothing to compare, void (not NOGO)'}
    :(cB>uB)?{go:true,verdict:'MATE-COMPOUND-GO-V1',reason:'candidate-line births = '+cB+' > unlearned '+uB+' under maternal transmission (gen-2 '+cG2+' vs '+uG2+') — selection persists under transmission (thin n=2, licenses replication only)'}
    :{go:false,verdict:'MATE-COMPOUND-NOGO-V1',reason:'candidate-line births = '+cB+' vs unlearned '+uB+' (gen-2 '+cG2+' vs '+uG2+') — no selection-under-transmission signal at this scale'};
  return {perArm,candidateBirths:cB,unlearnedBirths:uB,candidateGen2:cG2,unlearnedGen2:uG2,g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
