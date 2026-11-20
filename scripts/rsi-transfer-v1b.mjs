// RSI-TRANSFER Phase-B dev instrument (FROZEN under docs/RSI_TRANSFER_PLAN_V1B.md).
// Bounded self-proposed controller change + independent transfer eval:
// 2 pairs x (3 train arms [selfmod/fixed/unlearned] + 3 transfer probes) =
// 12 mains (BT_TICKS=1792), ZERO probes, no reproduction. Train loop is
// V1a-verbatim (selfPropose rate direction per founder, checkpoints,
// sandbox adopt iff candErr<incErr*0.99, fees; imported, not rewritten).
// Transfer: snapshot train-final weights -> fresh run on the pair-transfer
// history at the ADOPTED rate (selfmod: median founder final rate;
// fixed/unlearned: default 1.0) with transplant integrity + digest match,
// full advance, endpoint scored. GO iff mean(selfmod_te) > mean(fixed_te)
// AND > mean(unlearned_te); no adopts anywhere -> INCOMPLETE-NOFIRE (void);
// else NOGO. Thin n=2 — licenses replication ONLY. No successive-revision/
// RSI/retention/population claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {selfPropose,S_CHECKPOINTS,S_RATE_MIN,S_RATE_MAX,S_ADOPT_FRAC,S_SKIP_MIN_STORE,S_FIT_CAP,S_TEST_N} from './rsi-self-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from './turn-gated-dev-v1m.mjs';
import {summarizeGenerations} from './mate-inherit-v1b.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const RT_EXPERIMENT='rsi-transfer-dev';
export const RT_PAIRS=2;
export const RT_TRAIN_ARMS=Object.freeze(['selfmod','fixed','unlearned']);
export const RT_DEFAULT_RATE=1.0;
export const RT_EXPECT_MAINS=12, RT_EXPECT_PROBES=0;
export const RT_OP_CAP=20_000_000_000, RT_WALL_CAP_SECONDS=3600;
export const RT_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>473118+j));
const RT_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099]];
export const RT_SPENT_SEEDS=Object.freeze([381001,...RT_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function rsiTransferExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-transfer-v1b.mjs','docs/RSI_TRANSFER_PLAN_V1B.md','tests/rsi-transfer-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rsiTransferSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-transfer-v1b.mjs','scripts/rsi-self-dev.mjs','scripts/turn-gated-dev-v1m.mjs','scripts/mate-inherit-v1b.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/RSI_TRANSFER_PLAN_V1B.md'])visit(resolve(root,name));
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
export function rsiTransferBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,RT_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of rsiTransferExtraTokens())excluded.add(t);
  for(const s of RT_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of RT_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=RT_FIXTURE_SEEDS.length/9===4?Array.from({length:4},(_,h)=>{
    const s=RT_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:Math.floor(h/2),role:h%2===0?'train':'transfer'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,36,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:RT_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI-TRANSFER V1b dev bank (deterministic fresh 473118-473153, 36 seeds, 2 train/transfer pairs). Spend: 12 mains (6 train + 6 mating probes). First use is the single V1b run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
export function finalRateOf(proposals,defaultRate){
  // Per-agent final adopted rate (last adopt propRate else first incRate),
  // median across agents + spread. Pure; fixture-tested.
  const byA=new Map();
  for(const q of proposals){if(!byA.has(q.agentId))byA.set(q.agentId,[]);byA.get(q.agentId).push(q);}
  const finals=[];
  for(const recs of byA.values()){
    const ordered=[...recs].sort((a,b)=>a.tick-b.tick);
    let r=null;
    for(const q of ordered)if(q.decision==='adopt')r=q.propRate;
    if(r===null)r=ordered.length?ordered[0].incRate:defaultRate;
    if(!Number.isFinite(r))r=defaultRate;
    finals.push(r);
  }
  finals.sort((a,b)=>a-b);
  if(!finals.length)return {median:defaultRate,spread:0,n:0};
  const mid=Math.floor(finals.length/2);
  const median=finals.length%2?finals[mid]:(finals[mid-1]+finals[mid])/2;
  return {median,spread:finals[finals.length-1]-finals[0],n:finals.length};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runRsiTransfer({bankPath,output,resume=false}){
  const sources=rsiTransferSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rsiTransferBank(bankPathAbs);
  assert.equal(p.histories.length,4);
  const pairs=[0,1].map(pi=>({train:p.histories.find(h=>h.pair===pi&&h.role==='train'),transfer:p.histories.find(h=>h.pair===pi&&h.role==='transfer')}));
  assert.ok(pairs.every(q=>q.train&&q.transfer));
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...RT_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-transfer-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...RT_TRAIN_ARMS],pairs:pairs.map(q=>({train:q.train.seed,transfer:q.transfer.seed})),
      loop:{proposal:'V1a-verbatim selfPropose (imported)',checkpoints:[...S_CHECKPOINTS],adoptFrac:S_ADOPT_FRAC},
      caps:{executions:300,aggregateScalarOperations:RT_OP_CAP,wallSeconds:RT_WALL_CAP_SECONDS},
      scope:'RSI-TRANSFER V1b single attempt. Loop-proposed rate change (V1-verbatim train) + births-transfer eval on held-out mating histories. GO iff selfmod births > fixed AND > unlearned; no adopts -> INCOMPLETE-NOFIRE; all-zero births -> INCOMPLETE-NOBIRTHS; else NOGO. No successive-revision/RSI/retention/population claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=RT_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const trainOne=(arm,history)=>{
    let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='train');
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`${history.seed}:${arm}:train`);
    row=row??{history:{seed:history.seed},arm,stage:'train',proposals:[],finalRate:null,finalRateSpread:null,endpoint:null,phaseRows:null,weights:null};
    const learnerOptions={...BT_LEARNER_OPTIONS,selfMod:arm==='selfmod'};
    const expArm=arm==='unlearned'?'unlearned':'candidate';
    const run=new TasteExperiment({history,arm:expArm,learnerOptions,cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    if(arm==='selfmod')for(const id of run.founderIds)run.learners[id].selfMod={prevTestErr:null,proposals:[]};
    const proposals=[];
    for(let t=0;t<BT_TICKS&&!run.finished;t++){
      if(S_CHECKPOINTS.includes(run.world.tick)){
        for(const fly of run.world.flies){
          const st=run.learners[fly.id];
          if(st.config.selfMod===true)proposals.push({agentId:fly.id,...selfPropose(st,run.world.tick)});
        }
      }
      if(!run.step())break;
    }
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}:train`);
    const fr=arm==='selfmod'?finalRateOf(proposals,RT_DEFAULT_RATE):{median:RT_DEFAULT_RATE,spread:0,n:0};
    row.proposals=proposals;row.finalRate=fr.median;row.finalRateSpread=fr.spread;row.finalRateN=fr.n;
    row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.weights=snapshotWeights(run.learners);
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed);
    note(1,0,BT_TICKS,endpoint.scalarOperations);
    if(!rows.includes(row))rows.push(row);
    writeOver(join(outputAbs,'rows',`${history.seed}-${arm}-train.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',phase:'train',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder,proposals:proposals.length,finalRate:fr.median}));
    return rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='train');
  };
  const probeOne=(trainRow,transferHistory)=>{
    const key=`${transferHistory.seed}-${trainRow.arm}-transfer`;
    let row=rows.find(r=>r.history.seed===transferHistory.seed&&r.arm===trainRow.arm&&r.stage==='transfer');
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',arm:trainRow.arm,seed:transferHistory.seed,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`${key}`);
    const probeRate=trainRow.arm==='selfmod'?trainRow.finalRate:RT_DEFAULT_RATE;
    assert.ok(Number.isFinite(probeRate)&&probeRate>=S_RATE_MIN&&probeRate<=S_RATE_MAX,`probe rate out of loop bounds: ${probeRate}`);
    const run=new TasteExperiment({history:transferHistory,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null,reproduction:true,matingActionRequired:false,matingEnergyBar:50,verticalTransmission:'none',nutrientOverride:5});
    // Apply the adopted rate exactly as selfPropose does live
    // (rsi-self-dev.mjs: state.config.tasteRate=propRate). The constructor
    // caps tasteRate at 1.0 for fresh instantiation, but live adoption
    // bypasses it — the probe mirrors the live application path verbatim
    // so the evaluated change IS the adopted change (clamping would test
    // a different change). Loop bounds [0.05,2.0] still enforced above.
    for(const id of run.founderIds)run.learners[id].config.tasteRate=probeRate;
    for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
    const cp=copyWeights(trainRow.weights,run.learners);
    const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
    assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
    const sourceDigest=digestWeights(trainRow.weights),appliedDigest=digestWeights(snapshotWeights(run.learners));
    assert.equal(sourceDigest,appliedDigest,'transplant digest mismatch');
    run.advance(BT_TICKS);
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${trainRow.arm}/${transferHistory.seed}:transfer`);
    const births=run.world.totals.births;
    assert.ok(Number.isInteger(births)&&births>=0,`transfer probe invalid births for ${key}`);
    const generations=summarizeGenerations(run.world.lineage);
    row={history:{seed:transferHistory.seed},arm:trainRow.arm,stage:'transfer',probeRate,
      transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,sourceDigest,appliedDigest},
      endpoint,births,generations};
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for probe '+key);
    note(1,0,BT_TICKS,endpoint.scalarOperations);
    rows.push(row);
    writeOver(join(outputAbs,'rows',`${key}.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',phase:'transfer',arm:trainRow.arm,seed:transferHistory.seed,energy:endpoint.budgetAdjustedEnergyPerFounder,births,probeRate}));
    return rows.find(r=>r.history.seed===transferHistory.seed&&r.arm===trainRow.arm&&r.stage==='transfer');
  };
  for(const arm of RT_TRAIN_ARMS){
    const {wall}=timed('train-'+arm,()=>{
      for(const q of pairs)trainOne(arm,q.train);
    });
    runtimes['train-'+arm]=wall;checkpointLedger();
  }
  for(const arm of RT_TRAIN_ARMS){
    const {wall}=timed('transfer-'+arm,()=>{
      for(const q of pairs){
        const tr=rows.find(r=>r.history.seed===q.train.seed&&r.arm===arm&&r.stage==='train');
        assert.ok(tr&&tr.endpoint&&tr.weights,`train row missing for probe ${arm}/${q.train.seed}`);
        probeOne(tr,q.transfer);
      }
    });
    runtimes['transfer-'+arm]=wall;checkpointLedger();
  }
  assert.deepEqual(rsiTransferSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=RT_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,RT_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,RT_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreRsiTransferRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function trainRowComplete(r){
  // A train row is complete with 4 phase rows, OR a clean extinction
  // (colony dead, all founders accounted, no crash): an extinct run never
  // pushes return-A. Crashes cannot reach scoring (timed() throws, so no
  // dev-results exists). Pure; fixture-tested.
  if(!r||r.stage!=='train'||!r.endpoint)return false;
  if(Array.isArray(r.phaseRows)&&r.phaseRows.length===4)return true;
  const e=r.endpoint;
  return Number.isFinite(e.budgetAdjustedEnergyPerFounder)&&e.survivors===0&&
    e.totals&&Number.isInteger(e.totals.deaths)&&e.totals.deaths>=BT_FOUNDERS;
}
export function scoreRsiTransferRows(rows){
  // Independent BIRTHS-transfer eval of self-proposed changes. Pooled over
  // pairs; per-pair table descriptive. GO iff selfmod births > fixed AND >
  // unlearned; no adopts -> INCOMPLETE-NOFIRE; all-zero births ->
  // INCOMPLETE-NOBIRTHS. Energy descriptive only.
  const te={};
  for(const arm of RT_TRAIN_ARMS)te[arm]=[];
  for(const r of rows){
    if(r.stage!=='transfer'||!r.endpoint)continue;
    const v=r.endpoint.budgetAdjustedEnergyPerFounder;
    if(!Number.isFinite(v))return {g1:false,g2:false,go:false,verdict:'INVALID',reason:'non-finite transfer endpoint'};
    if(!Number.isInteger(r.births)||r.births<0)return {g1:false,g2:false,go:false,verdict:'INVALID',reason:'malformed transfer births'};
    const g=r.generations;
    if(!g||!Number.isInteger(g.gen1)||g.gen1<0||!Number.isInteger(g.gen2)||g.gen2<0)return {g1:false,g2:false,go:false,verdict:'INVALID',reason:'malformed transfer generations'};
    te[r.arm].push({seed:r.history.seed,births:r.births,gen1:g.gen1,gen2:g.gen2,energy:v,probeRate:r.probeRate});
  }
  const trains=rows.filter(r=>r.stage==='train');
  const adopts=trains.filter(r=>r.arm==='selfmod').flatMap(r=>r.proposals??[]).filter(q=>q.decision==='adopt').length;
  const g1=rows.filter(r=>r.stage==='train').length===6&&rows.filter(r=>r.stage==='transfer').length===6&&
    RT_TRAIN_ARMS.every(a=>trains.filter(r=>r.arm===a).length===2&&te[a].length===2)&&
    trains.every(r=>trainRowComplete(r)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
  const g2=g1&&rows.filter(r=>r.stage==='transfer').every(r=>r.transfer&&r.transfer.sourceDigest===r.transfer.appliedDigest&&Number.isFinite(r.probeRate))&&
    rows.filter(r=>r.stage==='train'&&r.arm==='selfmod').every(r=>Number.isFinite(r.finalRate));
  const tot=a=>te[a].reduce((x,y)=>x+y.births,0);
  const m={};for(const a of RT_TRAIN_ARMS)m[a]=te[a].length?tot(a):null;
  const e={};for(const a of RT_TRAIN_ARMS)e[a]=te[a].length?+(te[a].reduce((x,y)=>x+y.energy,0)/te[a].length).toFixed(3):null;
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/phaseRows/endpoints)'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/integrity audit failed (digests/probeRate/finalRate)'}
    :adopts===0?{go:false,verdict:'INCOMPLETE-NOFIRE',reason:'loop never adopted — transfer test vacuous (void, not NOGO)'}
    :(m.selfmod===0&&m.fixed===0&&m.unlearned===0)?{go:false,verdict:'INCOMPLETE-NOBIRTHS',reason:'all transfer probes zero births — nothing to compare (void, not NOGO)'}
    :(m.selfmod>m.fixed&&m.selfmod>m.unlearned)?{go:true,verdict:'RSI-TRANSFER-GO-V1B',reason:`self-proposed change transfers reproductively: selfmod births ${m.selfmod} > fixed ${m.fixed} and > unlearned ${m.unlearned} (thin n=2, licenses replication only)`}
    :{go:false,verdict:'RSI-TRANSFER-NOGO-V1B',reason:`selfmod births ${m.selfmod} vs fixed ${m.fixed} vs unlearned ${m.unlearned} — no reproductive transfer lift from self-proposed change at this scale`};
  return {perArm:te,births:Object.fromEntries(RT_TRAIN_ARMS.map(a=>[a,m[a]])),energy:Object.fromEntries(RT_TRAIN_ARMS.map(a=>[a,e[a]])),adopts,g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
