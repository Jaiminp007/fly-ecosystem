// RSI-LESION Phase-A dev instrument (FROZEN under docs/RSI_LESION_PLAN_V1.md).
// Self-proposed DIM-LESION + independent transfer eval: 2 pairs x
// (3 train arms [selfmod/fixed/unlearned] + 3 transfer probes) = 12 mains
// (BT_TICKS=1792), ZERO probes, no reproduction. Train loop proposes
// lesion halves {0,1} per founder at checkpoints (V1a sandbox:
// fit/test eval, adopts best iff it beats incumbent x 0.99 (else keep;
// skip if store<16; one-way (first adoption sticks, no restoration).
// NO rate dials/freezes/resets anywhere. Transfer: snapshot train-final
// weights -> fresh run on the pair-transfer history at default config
// (the change is weights-only by design, V1a precedent) with transplant
// integrity + digest match, full advance, endpoint scored. GO iff
// mean(selfmod_te) > mean(fixed_te) AND > mean(unlearned_te); zero adopts
// -> INCOMPLETE-NOADOPT (void; must not repeat V1); else NOGO. Thin n=2 —
// licenses replication ONLY.
// No successive-revision/RSI/retention/population claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {S_CHECKPOINTS,S_ADOPT_FRAC,S_SKIP_MIN_STORE,S_FIT_CAP,S_TEST_N} from './rsi-self-dev.mjs';
import {tasteUpdate,tastePrediction} from '../learning/taste-energy.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from './turn-gated-dev-v1m.mjs';
import {trainRowComplete} from './rsi-transfer-v1b.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const RL_EXPERIMENT='rsi-lesion-dev';
export const RL_PAIRS=2;
export const RL_TRAIN_ARMS=Object.freeze(['selfmod','fixed','unlearned']);
export const RL_DEFAULT_RATE=1.0;
export const RL_EXPECT_MAINS=12, RL_EXPECT_PROBES=0;
export const RL_OP_CAP=20_000_000_000, RL_WALL_CAP_SECONDS=3600;
export const RL_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>474109+j));
const RL_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[490001,490009],[490010,490018],[490019,490027]];
export const RL_SPENT_SEEDS=Object.freeze([381001,...RL_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function rlExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-lesion-dev.mjs','docs/RSI_LESION_PLAN_V1.md','tests/rsi-lesion-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rlSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-lesion-dev.mjs','scripts/rsi-self-dev.mjs','scripts/turn-gated-dev-v1m.mjs','scripts/rsi-transfer-v1b.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','docs/RSI_LESION_PLAN_V1.md'])visit(resolve(root,name));
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
export function rlBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,RL_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of rlExtraTokens())excluded.add(t);
  for(const s of RL_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of RL_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=RL_FIXTURE_SEEDS.length/9===4?Array.from({length:4},(_,h)=>{
    const s=RL_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:Math.floor(h/2),role:h%2===0?'train':'transfer'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,36,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:RL_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI-LESION V1 dev bank (deterministic fresh 474109-474144, 36 seeds, 2 train/transfer pairs). Spend: 12 mains (6 train + 6 probes). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
export const LESION_HALVES=Object.freeze([0,1]);
export function ablateTasteHalf(state,half){
  // Permanent selective ablation of one taste half (D=16 orthogonal:
  // half 0 = dims[0:D/2], half 1 = dims[D/2:D]). Selectivity + denoise
  // rationale distinguishes this from full-taste reset; learning
  // continues on survivor dims (not a freeze). One-way.
  assert.ok(half===0||half===1);
  const D=state.config.tasteDimensions;
  assert.ok(D>=2);
  const lo=half===0?0:Math.floor(D/2);
  for(let i=lo;i<(half===0?Math.floor(D/2):D);i++)state.weights.taste[i]=0;
  return half;
}
export function proposeLesion(state,tick){
  // Sandbox-evaluated dim-ablation proposal (V1a-analogue core for the
  // lesion family): incumbent (full, replay fit) vs {ablate half 0,
  // ablate half 1} (zero half, replay fit); adopt iff best beats
  // incumbent x 0.99. Same sandbox as V1a (fit last-32, test newest-8,
  // taste-only replay) — the ONLY novelty is the proposal family
  // (structural denoise, not step size / records / full reset). One-way:
  // caller must skip lesioned agents (no restoration — reset boundary).
  // Bills (1+2)*(fitN+testN)*(D+1) live (V1a-consistent scaling: one unit
  // per config evaluated). Returns rec; does NOT apply live (driver
  // applies on adopt). Pure except the fee billing, which is the point
  // (symmetric billing). Fixture-tested.
  assert.ok(state&&typeof state==='object');
  const D=state.config.tasteDimensions;
  const store=[...state.older,...state.recent];
  if(store.length<S_SKIP_MIN_STORE){
    return {tick,lesion:null,fitN:0,testN:0,errInc:null,errCand:null,decision:'skip'};
  }
  const test=store.slice(-S_TEST_N);
  const fit=store.slice(0,-S_TEST_N).slice(-S_FIT_CAP);
  const fitN=fit.length,testN=test.length;
  assert.ok(fitN>0&&testN===S_TEST_N);
  const errOf=(cl,w)=>{let s=0;for(const rec of test)s+=Math.abs(rec.target-tastePrediction(cl,rec.phi,w));return s/testN;};
  const evalAt=(half)=>{const cl=structuredClone(state);if(half!==null)ablateTasteHalf(cl,half);
    for(const rec of fit)tasteUpdate(cl,rec,'live',()=>{});
    const e=errOf(cl,cl.weights.taste);assert.ok(Number.isFinite(e));return e;};
  const errInc=evalAt(null);
  assert.ok(Number.isFinite(errInc));
  let best=null,bestErr=errInc*S_ADOPT_FRAC;
  for(const half of LESION_HALVES){const e=evalAt(half);if(e<bestErr){bestErr=e;best=half;}}
  const fee=(1+LESION_HALVES.length)*(fitN+testN)*(D+1);
  state.work.scalarOperations+=fee;
  const decision=best===null?'keep':'adopt';
  return {tick,lesion:best,fitN,testN,errInc,errCand:best===null?null:bestErr,decision};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runRsiLesion({bankPath,output,resume=false}){
  const sources=rlSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rlBank(bankPathAbs);
  assert.equal(p.histories.length,4);
  const pairs=[0,1].map(pi=>({train:p.histories.find(h=>h.pair===pi&&h.role==='train'),transfer:p.histories.find(h=>h.pair===pi&&h.role==='transfer')}));
  assert.ok(pairs.every(q=>q.train&&q.transfer));
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...RL_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-lesion-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...RL_TRAIN_ARMS],pairs:pairs.map(q=>({train:q.train.seed,transfer:q.transfer.seed})),
      loop:{proposal:'lesion half {0,1} via sandbox fit/test (V1a record-split/fees), adopt iff best<incumbent*0.99, one-way',checkpoints:[...S_CHECKPOINTS],adoptFrac:S_ADOPT_FRAC},
      caps:{executions:300,aggregateScalarOperations:RL_OP_CAP,wallSeconds:RL_WALL_CAP_SECONDS},
      scope:'RSI-LESION V1 single attempt. Self-proposed dim-lesion + independent same-codebook transfer eval. GO iff mean(selfmod_te)>mean(fixed_te) AND >mean(unlearned_te); zero adopts -> INCOMPLETE-NOADOPT; else NOGO. No successive-revision/RSI/retention/population claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=RL_OP_CAP,'Dev aggregate op cap breached');};
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
    row=row??{history:{seed:history.seed},arm,stage:'train',proposals:[],endpoint:null,phaseRows:null,weights:null};
    const learnerOptions={...BT_LEARNER_OPTIONS,selfMod:arm==='selfmod'};
    const expArm=arm==='unlearned'?'unlearned':'candidate';
    const run=new TasteExperiment({history,arm:expArm,learnerOptions,cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    const proposals=[];
    const lesioned=new Set();
    for(let t=0;t<BT_TICKS&&!run.finished;t++){
      if(S_CHECKPOINTS.includes(run.world.tick)){
        for(const fly of run.world.flies){
          const st=run.learners[fly.id];
          if(st.config.selfMod===true){
            if(lesioned.has(fly.id)){proposals.push({agentId:fly.id,tick:run.world.tick,lesion:null,fitN:0,testN:0,errInc:null,errCand:null,decision:'skip',reason:'lesioned'});continue;}
            const rec={agentId:fly.id,...proposeLesion(st,run.world.tick)};
            if(rec.decision==='adopt'){ablateTasteHalf(st,rec.lesion);lesioned.add(fly.id);}
            proposals.push(rec);
          }
        }
      }
      if(!run.step())break;
    }
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}:train`);
    row.proposals=proposals;
    row.phaseRows=run.phaseRows;row.endpoint=endpoint;row.weights=snapshotWeights(run.learners);
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed);
    note(1,0,BT_TICKS,endpoint.scalarOperations);
    if(!rows.includes(row))rows.push(row);
    writeOver(join(outputAbs,'rows',`${history.seed}-${arm}-train.json`),row);
    checkpointLedger();
    const nAdopt=proposals.filter(q=>q.decision==='adopt').length;
    console.log(JSON.stringify({stage:'world',phase:'train',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder,proposals:proposals.length,adopts:nAdopt}));
    return rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='train');
  };
  const probeOne=(trainRow,transferHistory)=>{
    const key=`${transferHistory.seed}-${trainRow.arm}-transfer`;
    let row=rows.find(r=>r.history.seed===transferHistory.seed&&r.arm===trainRow.arm&&r.stage==='transfer');
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',arm:trainRow.arm,seed:transferHistory.seed,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`${key}`);
    // No config carry in this line: the change is weights-only by design
    // (lesion proposal shaped train weights), so every probe runs at the
    // default config. The evaluated change is exactly the transplanted
    // (possibly lesioned) weights (V1a precedent).
    const probeRate=RL_DEFAULT_RATE;
    const run=new TasteExperiment({history:transferHistory,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
    const cp=copyWeights(trainRow.weights,run.learners);
    const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
    assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
    const sourceDigest=digestWeights(trainRow.weights),appliedDigest=digestWeights(snapshotWeights(run.learners));
    assert.equal(sourceDigest,appliedDigest,'transplant digest mismatch');
    run.advance(BT_TICKS);
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${trainRow.arm}/${transferHistory.seed}:transfer`);
    row={history:{seed:transferHistory.seed},arm:trainRow.arm,stage:'transfer',probeRate,
      transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,sourceDigest,appliedDigest},
      endpoint};
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for probe '+key);
    note(1,0,BT_TICKS,endpoint.scalarOperations);
    rows.push(row);
    writeOver(join(outputAbs,'rows',`${key}.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',phase:'transfer',arm:trainRow.arm,seed:transferHistory.seed,energy:endpoint.budgetAdjustedEnergyPerFounder,probeRate}));
    return rows.find(r=>r.history.seed===transferHistory.seed&&r.arm===trainRow.arm&&r.stage==='transfer');
  };
  for(const arm of RL_TRAIN_ARMS){
    const {wall}=timed('train-'+arm,()=>{
      for(const q of pairs)trainOne(arm,q.train);
    });
    runtimes['train-'+arm]=wall;checkpointLedger();
  }
  for(const arm of RL_TRAIN_ARMS){
    const {wall}=timed('transfer-'+arm,()=>{
      for(const q of pairs){
        const tr=rows.find(r=>r.history.seed===q.train.seed&&r.arm===arm&&r.stage==='train');
        assert.ok(tr&&tr.endpoint&&tr.weights,`train row missing for probe ${arm}/${q.train.seed}`);
        probeOne(tr,q.transfer);
      }
    });
    runtimes['transfer-'+arm]=wall;checkpointLedger();
  }
  assert.deepEqual(rlSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=RL_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,RL_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,RL_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreRsiLesionRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreRsiLesionRows(rows){
  // Independent transfer eval of self-proposed dim-lesions. Pooled
  // over pairs; per-pair table descriptive. GO iff mean(selfmod_te) >
  // mean(fixed_te) AND > mean(unlearned_te); no lesion adopts anywhere ->
  // INCOMPLETE-NOADOPT (void — without an adopted change the contrast is
  // vacuous).
  const te={};
  for(const arm of RL_TRAIN_ARMS)te[arm]=[];
  for(const r of rows){
    if(r.stage!=='transfer'||!r.endpoint)continue;
    const v=r.endpoint.budgetAdjustedEnergyPerFounder;
    if(!Number.isFinite(v))return {g1:false,g2:false,go:false,verdict:'INVALID',reason:'non-finite transfer endpoint'};
    te[r.arm].push({seed:r.history.seed,value:v,probeRate:r.probeRate});
  }
  const trains=rows.filter(r=>r.stage==='train');
  const adopts=trains.filter(r=>r.arm==='selfmod').flatMap(r=>r.proposals??[]).filter(q=>q.decision==='adopt').length;
  const compCounts={};for(const q of trains.filter(r=>r.arm==='selfmod').flatMap(r=>r.proposals??[]))if(q.decision==='adopt')compCounts['half:'+q.lesion]=(compCounts['half:'+q.lesion]||0)+1;
  const g1=rows.filter(r=>r.stage==='train').length===6&&rows.filter(r=>r.stage==='transfer').length===6&&
    RL_TRAIN_ARMS.every(a=>trains.filter(r=>r.arm===a).length===2&&te[a].length===2)&&
    trains.every(r=>trainRowComplete(r)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
  const g2=g1&&rows.filter(r=>r.stage==='transfer').every(r=>r.transfer&&r.transfer.sourceDigest===r.transfer.appliedDigest&&r.probeRate===RL_DEFAULT_RATE);
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const m={};for(const a of RL_TRAIN_ARMS)m[a]=te[a].length?mean(te[a].map(x=>x.value)):null;
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/phaseRows/endpoints)'}
    :!g2?{go:false,verdict:'INVALID',reason:'config/integrity audit failed (digests/probeRate)'}
    :adopts===0?{go:false,verdict:'INCOMPLETE-NOADOPT',reason:'loop never adopted a lesion — transfer test vacuous (void, not NOGO; V1 rate contrast must not repeat)'}
    :(m.selfmod>m.fixed&&m.selfmod>m.unlearned)?{go:true,verdict:'RSI-LESION-GO-V1',reason:`self-proposed dim-lesion transfers: selfmod_te ${m.selfmod.toFixed(3)} > fixed ${m.fixed.toFixed(3)} and > unlearned ${m.unlearned.toFixed(3)} (${JSON.stringify(compCounts)} adopts; thin n=2, licenses replication only)`}
    :{go:false,verdict:'RSI-LESION-NOGO-V1',reason:`selfmod_te ${m.selfmod===null?'null':m.selfmod.toFixed(3)} vs fixed ${m.fixed===null?'null':m.fixed.toFixed(3)} vs unlearned ${m.unlearned===null?'null':m.unlearned.toFixed(3)} (${JSON.stringify(compCounts)} adopts) — no transfer lift from self-proposed lesion at this scale`};
  return {perArm:te,means:Object.fromEntries(RL_TRAIN_ARMS.map(a=>[a,m[a]===null?null:+m[a].toFixed(4)])),adopts,lesionAdopts:adopts,compCounts,g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
