// RSI-SELF Phase-C dev instrument (FROZEN under docs/RSI_SELF_PLAN_V1C.md).
// Clean ablation of the V1b failure: the sandbox fit replicates the agent's
// real update mix (live update + full replay sweep per fit-record) instead of
// live-only. 3 arms (selfmod/random/fixed) x 4 histories = 12 mains
// (BT_TICKS=1792), ZERO probes. Checkpoints, menu, direction, threshold,
// random protocol: identical to V1b. V1b (scripts/rsi-self-v1b.mjs, bank
// fresh-02) and V1a (scripts/rsi-self-dev.mjs, bank fresh-01) are untouched.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {tasteUpdate,tastePrediction,draw,replay} from '../learning/taste-energy.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const S3_EXPERIMENT='rsi-self-v1c';
export const S3_HISTORIES=4;
export const S3_ARMS=Object.freeze(['selfmod','random','fixed']);
export const S3_EXPECT_MAINS=12, S3_EXPECT_PROBES=0;
export const S3_OP_CAP=20_000_000_000, S3_WALL_CAP_SECONDS=3600;
export const S3_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>398001+j));
const S3_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036]];
export const S3_SPENT_SEEDS=Object.freeze([381001,...S3_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const S3_CHECKPOINTS=Object.freeze([256,512,768,1024,1280,1536]);
export const S3_ITEMS=Object.freeze(['rate','gain','margin']);
export const S3_RATE_MIN=0.05, S3_RATE_MAX=2.0, S3_GAIN_MAX=2.0, S3_ADOPT_FRAC=0.99;
export const S3_SKIP_MIN_STORE=16, S3_FIT_CAP=32, S3_TEST_N=8;
export const S3_LEVEL_TOL=0.15, S3_MIN_ADOPT_CP=2, S3_MIN_KEEP_CP=2, S3_MAX_SKIP_CP=4;
export const S3_MIN_PERSIST=8, S3_MIN_PERSIST_ITEMS=2, S3_SEL_BAND=0.1;
const NOOP=()=>{};
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest(b).hex;
function v1cExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-self-v1c.mjs','docs/RSI_SELF_PLAN_V1C.md']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rsiSelfV1cSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-self-v1c.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/RSI_SELF_PLAN_V1.md','docs/RSI_SELF_PLAN_V1A.md','docs/RSI_SELF_PLAN_V1B.md','docs/RSI_SELF_PLAN_V1C.md'])visit(resolve(root,name));
  return found;
}
function priorEvidenceSeeds(){
  const into=new Set();
  const seedWalk=(v,k)=>{if(Array.isArray(v))for(const x of v)seedWalk(x,k);
    else if(v&&typeof v==='object')for(const[kk,vv]of Object.entries(v))seedWalk(vv,/seed/i.test(kk)?kk:k);
    else if(/seed/i.test(k)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)into.add(v);};
  const walkFs=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);
    if(e.isDirectory())walkFs(p);else if(e.name.endsWith('.json')){try{seedWalk(JSON.parse(readFileSync(p,'utf8')),'');}catch{}}}};
  walkFs(join(root,'evidence'));return into;
}
export function rsiSelfV1cBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,S3_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of v1cExtraTokens())excluded.add(t);
  for(const s of S3_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of S3_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=Array.from({length:S3_HISTORIES},(_,h)=>{
    const s=S3_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  });
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,S3_HISTORIES*9,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:S3_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI-SELF V1c dev bank (deterministic fresh 398001-398036, 9/history, 4 histories). Spend: 12 mains (3 arms x 4 main-seeds); other 24 slots reserved-excluded, never spendable elsewhere. First use is the single V1c run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Faithful-mix fit (exported for fixtures): per fit-record, one live update
// plus one full replay sweep — the agent's real update mix (observe path).
// Runs entirely on the clone; the live agent is never touched.
export function fitCloneV1c(clone,recs){
  for(const rec of recs){tasteUpdate(clone,rec,'live',NOOP);replay(clone,NOOP);}
}
// Pure value mapping (exported for fixtures + scorer): intensify/attenuate
// per menu item from incumbent snapshot {rate,gain,width,boost}.
export function applyItemValues(item,intensify,inc){
  assert.ok(['rate','gain','margin'].includes(item));
  if(item==='rate'){const v=intensify?inc.rate*2:inc.rate*0.5;
    return {rate:Math.min(S3_RATE_MAX,Math.max(S3_RATE_MIN,v)),gain:inc.gain,width:inc.width,boost:inc.boost};}
  if(item==='gain'){const v=intensify?Math.min(S3_GAIN_MAX,inc.gain*2):inc.gain*0.5;
    return {rate:inc.rate,gain:Math.max(0,v),width:inc.width,boost:inc.boost};}
  return intensify
    ?{rate:inc.rate,gain:inc.gain,width:0.1,boost:1.0}
    :{rate:inc.rate,gain:inc.gain,width:0,boost:0};
}
function applyToConfig(config,vals){config.tasteRate=vals.rate;config.surpriseGain=vals.gain;config.marginWidth=vals.width;config.marginBoost=vals.boost;}
// Pure choice mapping: round-robin item by checkpoint index; uniform
// trajectory direction (worse->intensify); first checkpoint attenuates.
export function proposeV1c(testErr,prevTestErr,cpIndex){
  assert.ok(Number.isFinite(testErr)&&testErr>=0&&Number.isInteger(cpIndex)&&cpIndex>=0);
  const item=S3_ITEMS[cpIndex%S3_ITEMS.length];
  const intensify=prevTestErr!==null&&Number.isFinite(prevTestErr)&&testErr>prevTestErr;
  return {item,intensify};
}
export function selfProposeV1c(state,tick,cpIndex){
  assert.ok(state.config.selfMod===true,'selfProposeV1c invoked on non-selfmod agent');
  const D=state.config.tasteDimensions;
  assert.ok(Number.isInteger(D)&&D>0);
  assert.ok(state.weights&&Array.isArray(state.weights.taste));
  const incVals={rate:state.config.tasteRate,gain:state.config.surpriseGain??0,
    width:state.config.marginWidth??0,boost:state.config.marginBoost??0};
  const sm=state.selfMod??={prevTestErr:null,proposals:[]};
  state.selfMod=sm;
  const store=[...state.older,...state.recent];
  const {item,intensify}=proposeV1c(0,sm.prevTestErr,cpIndex);
  if(store.length<S3_SKIP_MIN_STORE){
    const rec={tick,item,intensify,incVals,propVals:null,fitN:0,testN:0,errInc:null,errCand:null,decision:'skip'};
    sm.proposals.push(rec);return rec;
  }
  const test=store.slice(-S3_TEST_N);
  const fit=store.slice(0,-S3_TEST_N).slice(-S3_FIT_CAP);
  const fitN=fit.length,testN=fit.length?test.length:0;
  assert.ok(fitN>0&&testN===S3_TEST_N);
  const w0=state.weights.taste.slice();
  const cloneI=structuredClone(state),cloneC=structuredClone(state);
  assert.equal(cloneI.config.replayStrata,1,'faithful-mix fee assumes single-stratum replay');
  const passes=Math.max(1,cloneI.config.replayPasses??1);
  const errOf=(cl,w)=>{let s=0;for(const rec of test)s+=Math.abs(rec.target-tastePrediction(cl,rec.phi,w));return s/testN;};
  const testErr=errOf(cloneI,w0);
  const choice=proposeV1c(testErr,sm.prevTestErr,cpIndex);
  sm.prevTestErr=testErr;
  fitCloneV1c(cloneI,fit);
  const errInc=errOf(cloneI,cloneI.weights.taste);
  const propVals=applyItemValues(choice.item,choice.intensify,incVals);
  applyToConfig(cloneC.config,propVals);
  fitCloneV1c(cloneC,fit);
  const errCand=errOf(cloneC,cloneC.weights.taste);
  assert.ok(Number.isFinite(testErr)&&Number.isFinite(errInc)&&Number.isFinite(errCand));
  const decision=errCand<errInc*S3_ADOPT_FRAC?'adopt':'keep';
  if(decision==='adopt')applyToConfig(state.config,propVals);
  const fee=2*(fitN*(1+passes)+testN)*(D+1);
  state.work.scalarOperations+=fee;
  const rec={tick,item:choice.item,intensify:choice.intensify,incVals,propVals,fitN,testN,errInc,errCand,decision};
  sm.proposals.push(rec);return rec;
}
// Random-selection control: same round-robin item, coin flip from the
// agent's own billed live rng, applied blindly (no eval, no fee).
export function randomApplyV1c(state,tick,cpIndex){
  const item=S3_ITEMS[cpIndex%S3_ITEMS.length];
  const flip=draw(state,'feedRngState')<0.5;
  const incVals={rate:state.config.tasteRate,gain:state.config.surpriseGain??0,
    width:state.config.marginWidth??0,boost:state.config.marginBoost??0};
  const propVals=applyItemValues(item,flip,incVals);
  applyToConfig(state.config,propVals);
  return {tick,item,intensify:flip,flip,incVals,propVals,fitN:0,testN:0,errInc:null,errCand:null,decision:'applied'};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
}
export function runRsiSelfV1c({bankPath,output,resume=false}){
  const sources=rsiSelfV1cSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rsiSelfV1cBank(bankPathAbs);
  assert.equal(p.histories.length,S3_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-03.json');
  const fixture={seeds:[...S3_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-self-v1c-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},sharedDelta:{surpriseGain:0.5,surpriseWindow:16},
      arms:[...S3_ARMS],checkpoints:[...S3_CHECKPOINTS],menu:[...S3_ITEMS],
      loop:{choice:'round-robin item by checkpoint index; trajectory direction (worse->intensify, first attenuates)',
        eval:'faithful-mix sandboxed fit (live update + full replay sweep per fit-record) + test on clones, adopt iff candErr<incErr*0.99 else keep, skip if store<16',
        billing:'flat fee 2*(fitN+testN)*(tasteDimensions+1) per selfmod evaluation; random pays only its rng draw',
        random:'same item, coin flip from live feedRngState, applied blindly, logged with flip'},
      caps:{executions:300,aggregateScalarOperations:S3_OP_CAP,wallSeconds:S3_WALL_CAP_SECONDS},
      scope:'RSI-SELF V1c single attempt. No tuning; conjunctive G1-G5 verdict + G6 label decide; no RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=S3_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of S3_ARMS){
    const {wall}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&row.endpoint){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,proposals:[],endpoint:null,phaseRows:null};
        const learnerOptions={...BT_LEARNER_OPTIONS,surpriseGain:0.5,surpriseWindow:16,selfMod:arm==='selfmod'};
        const run=new TasteExperiment({history,arm:'candidate',learnerOptions,cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        if(arm==='selfmod')for(const id of run.founderIds)run.learners[id].selfMod={prevTestErr:null,proposals:[]};
        const proposals=[];
        for(let t=0;t<BT_TICKS&&!run.finished;t++){
          const cpi=S3_CHECKPOINTS.indexOf(run.world.tick);
          if(cpi>=0){
            for(const fly of run.world.flies){
              const st=run.learners[fly.id];
              if(arm==='selfmod'&&st.config.selfMod===true)proposals.push({agentId:fly.id,...selfProposeV1c(st,run.world.tick,cpi)});
              else if(arm==='random')proposals.push({agentId:fly.id,...randomApplyV1c(st,run.world.tick,cpi)});
            }
          }
          if(!run.step())break;
        }
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        row.proposals=proposals;row.phaseRows=run.phaseRows;row.endpoint=endpoint;
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder,proposals:proposals.length}));
      }
    });
    runtimes[arm]=wall;checkpointLedger();
  }
  assert.deepEqual(rsiSelfV1cSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=S3_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,S3_EXPECT_MAINS,'Ledger mains count wrong');
  assert.equal(ledger.probes,S3_EXPECT_PROBES,'Ledger probes count wrong');
  const verdict=scoreRsiSelfV1c(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreRsiSelfV1c(rows){
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const lv=r=>r.endpoint.budgetAdjustedEnergyPerFounder;
  const selfRows=rows.filter(r=>r.arm==='selfmod'),randRows=rows.filter(r=>r.arm==='random'),fixRows=rows.filter(r=>r.arm==='fixed');
  const g1rows=rows.length===S3_EXPECT_MAINS&&selfRows.length===4&&randRows.length===4&&fixRows.length===4&&
    rows.every(r=>r.endpoint&&Number.isFinite(lv(r)));
  const fields=['tick','item','intensify','incVals','propVals','fitN','testN','errInc','errCand','decision'];
  const slots=[];
  for(const r of selfRows)for(let cpi=0;cpi<S3_CHECKPOINTS.length;cpi++){
    const cp=S3_CHECKPOINTS[cpi];
    const at=(r.proposals??[]).filter(q=>q.tick===cp);
    slots.push({seed:r.history.seed,tick:cp,cpi,n:at.length,
      adopts:at.filter(q=>q.decision==='adopt').length,
      keeps:at.filter(q=>q.decision==='keep').length,
      skips:at.filter(q=>q.decision==='skip').length,recs:at});
  }
  const g1cp=slots.length===24&&slots.every(c=>c.n>0&&c.recs.every(q=>fields.every(f=>f in q)));
  const g1=g1rows&&g1cp;
  const expectVals=(q)=>{
    if(q.decision==='skip')return q.propVals===null&&q.testN===0&&q.errInc===null&&q.errCand===null;
    if(!(q.fitN>0&&q.testN===S3_TEST_N&&Number.isFinite(q.errInc)&&Number.isFinite(q.errCand)))return false;
    if(q.item==='rate'&&(q.propVals.rate<S3_RATE_MIN||q.propVals.rate>S3_RATE_MAX))return false;
    if(q.item==='gain'&&(q.propVals.gain<0||q.propVals.gain>S3_GAIN_MAX))return false;
    if(q.item==='margin'&&!((q.propVals.width===0.1&&q.propVals.boost===1.0)||(q.propVals.width===0&&q.propVals.boost===0)))return false;
    const want=applyItemValues(q.item,q.intensify,q.incVals);
    return JSON.stringify(want)===JSON.stringify(q.propVals);
  };
  const selfRecs=slots.flatMap(c=>c.recs.map(q=>({...q,cpi:c.cpi})));
  const g2self=selfRecs.length>0&&selfRecs.every(q=>
    S3_ITEMS[q.cpi%S3_ITEMS.length]===q.item&&expectVals(q)&&
    (q.decision==='skip'||q.decision===(q.errCand<q.errInc*S3_ADOPT_FRAC?'adopt':'keep')));
  const randRecs=randRows.flatMap(r=>r.proposals??[]);
  const g2rand=randRecs.length>0&&randRecs.every(q=>
    q.decision==='applied'&&typeof q.flip==='boolean'&&q.errInc===null&&q.errCand===null&&
    q.fitN===0&&q.testN===0&&q.intensify===q.flip&&
    S3_ITEMS[S3_CHECKPOINTS.indexOf(q.tick)%S3_ITEMS.length]===q.item&&
    JSON.stringify(applyItemValues(q.item,q.flip,q.incVals))===JSON.stringify(q.propVals));
  const g2=g2self&&g2rand;
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const gap=mean(selfRows.map(lv))-mean(fixRows.map(lv));
  const g3=Number.isFinite(gap)&&gap>=-S3_LEVEL_TOL;
  const adoptCp=slots.filter(c=>c.adopts>0).length,keepCp=slots.filter(c=>c.keeps>0).length;
  const skipCp=slots.filter(c=>c.n>0&&c.adopts===0&&c.keeps===0).length;
  const g4=adoptCp>=S3_MIN_ADOPT_CP&&keepCp>=S3_MIN_KEEP_CP&&skipCp<=S3_MAX_SKIP_CP;
  const itemKeys={rate:['rate'],gain:['gain'],margin:['width','boost']};
  let persistent=0;const persistItems=new Set();
  for(const r of selfRows){
    const byA=new Map();
    for(const q of (r.proposals??[])){if(!byA.has(q.agentId))byA.set(q.agentId,[]);byA.get(q.agentId).push(q);}
    for(const recs of byA.values()){
      const ordered=[...recs].sort((a,b)=>a.tick-b.tick);
      if(!ordered.length)continue;
      const cur={...ordered[0].incVals};
      const live=[];
      for(const q of ordered){
        if(q.decision!=='adopt')continue;
        for(const k of itemKeys[q.item])cur[k]=q.propVals[k];
        live.push({item:q.item,vals:q.propVals});
      }
      for(const a of live)
        if(itemKeys[a.item].every(k=>cur[k]===a.vals[k])){persistent++;persistItems.add(a.item);}
    }
  }
  const g5=persistent>=S3_MIN_PERSIST&&persistItems.size>=S3_MIN_PERSIST_ITEMS;
  const dSelf=mean(selfRows.map(lv))-mean(randRows.map(lv));
  const g6label=!Number.isFinite(dSelf)?'NO-RANDOM-BASELINE':dSelf>S3_SEL_BAND?'selection signal':dSelf<-S3_SEL_BAND?'selection harmful':'no selection signal';
  const go=g1&&g2&&g3&&g4&&g5;
  return {g1,g2,g3,g4,g5,go,gap,adoptCp,keepCp,skipCp,persistent,persistItems:[...persistItems],selGap:dSelf,g6label,
    verdict:go?`PHASE-B-GO [${g6label}]`:(!g1?'INVALID':(!g2?'INVALID':(!g4?'INCOMPLETE':'PHASE-B-NOGO'))),
    detail:slots.map(({seed,tick,n,adopts,keeps,skips})=>({seed,tick,n,adopts,keeps,skips}))};
}
