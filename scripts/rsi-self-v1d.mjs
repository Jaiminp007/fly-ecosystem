// RSI-SELF Phase-D dev instrument (FROZEN under docs/RSI_SELF_PLAN_V1D.md).
// Replication (8 histories) + copied-search control. 4 arms
// (selfmod/random/fixed/copied) x 8 histories = 32 mains (BT_TICKS=1792),
// ZERO probes. Menu, checkpoints, faithful-mix eval, fee, shared base:
// identical to V1c. Copied arm per-agent-mirrors selfmod's adopted configs
// lagged one checkpoint (cp_0: no-op). V1c/b/a files and banks untouched.
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

export const S4_EXPERIMENT='rsi-self-v1d';
export const S4_HISTORIES=8;
export const S4_ARMS=Object.freeze(['selfmod','random','fixed','copied']);
export const S4_EXPECT_MAINS=32, S4_EXPECT_PROBES=0;
export const S4_OP_CAP=20_000_000_000, S4_WALL_CAP_SECONDS=3600;
export const S4_FIXTURE_SEEDS=Object.freeze(Array.from({length:72},(_,j)=>400001+j));
const S4_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036]];
export const S4_SPENT_SEEDS=Object.freeze([381001,...S4_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const S4_CHECKPOINTS=Object.freeze([256,512,768,1024,1280,1536]);
export const S4_ITEMS=Object.freeze(['rate','gain','margin']);
export const S4_RATE_MIN=0.05, S4_RATE_MAX=2.0, S4_GAIN_MAX=2.0, S4_ADOPT_FRAC=0.99;
export const S4_SKIP_MIN_STORE=16, S4_FIT_CAP=32, S4_TEST_N=8;
export const S4_LEVEL_TOL=0.15, S4_MIN_ADOPT_CP=2, S4_MIN_KEEP_CP=2, S4_MAX_SKIP_CP=8;
export const S4_MIN_PERSIST=16, S4_MIN_PERSIST_ITEMS=2, S4_SEL_BAND=0.1;
const NOOP=()=>{};
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest(b).hex;
function v1dExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-self-v1d.mjs','docs/RSI_SELF_PLAN_V1D.md']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rsiSelfV1dSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-self-v1d.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/RSI_SELF_PLAN_V1.md','docs/RSI_SELF_PLAN_V1A.md','docs/RSI_SELF_PLAN_V1B.md','docs/RSI_SELF_PLAN_V1D.md'])visit(resolve(root,name));
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
export function rsiSelfV1dBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,S4_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of v1dExtraTokens())excluded.add(t);
  for(const s of S4_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of S4_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=Array.from({length:S4_HISTORIES},(_,h)=>{
    const s=S4_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  });
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,S4_HISTORIES*9,'Dev bank draws must be 72 unique seeds');
  const p={schema:1,experiment:S4_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI-SELF V1d dev bank (deterministic fresh 400001-400072, 9/history, 4 histories). Spend: 12 mains (3 arms x 4 main-seeds); other 24 slots reserved-excluded, never spendable elsewhere. First use is the single V1d run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Faithful-mix fit (exported for fixtures): per fit-record, one live update
// plus one full replay sweep — the agent's real update mix (observe path).
// Runs entirely on the clone; the live agent is never touched.
export function fitCloneV1d(clone,recs){
  for(const rec of recs){tasteUpdate(clone,rec,'live',NOOP);replay(clone,NOOP);}
}
// Pure value mapping (exported for fixtures + scorer): intensify/attenuate
// per menu item from incumbent snapshot {rate,gain,width,boost}.
export function applyItemValues(item,intensify,inc){
  assert.ok(['rate','gain','margin'].includes(item));
  if(item==='rate'){const v=intensify?inc.rate*2:inc.rate*0.5;
    return {rate:Math.min(S4_RATE_MAX,Math.max(S4_RATE_MIN,v)),gain:inc.gain,width:inc.width,boost:inc.boost};}
  if(item==='gain'){const v=intensify?Math.min(S4_GAIN_MAX,inc.gain*2):inc.gain*0.5;
    return {rate:inc.rate,gain:Math.max(0,v),width:inc.width,boost:inc.boost};}
  return intensify
    ?{rate:inc.rate,gain:inc.gain,width:0.1,boost:1.0}
    :{rate:inc.rate,gain:inc.gain,width:0,boost:0};
}
function applyToConfig(config,vals){config.tasteRate=vals.rate;config.surpriseGain=vals.gain;config.marginWidth=vals.width;config.marginBoost=vals.boost;}
// Pure choice mapping: round-robin item by checkpoint index; uniform
// trajectory direction (worse->intensify); first checkpoint attenuates.
export function proposeV1d(testErr,prevTestErr,cpIndex){
  assert.ok(Number.isFinite(testErr)&&testErr>=0&&Number.isInteger(cpIndex)&&cpIndex>=0);
  const item=S4_ITEMS[cpIndex%S4_ITEMS.length];
  const intensify=prevTestErr!==null&&Number.isFinite(prevTestErr)&&testErr>prevTestErr;
  return {item,intensify};
}
export function selfProposeV1d(state,tick,cpIndex){
  assert.ok(state.config.selfMod===true,'selfProposeV1d invoked on non-selfmod agent');
  const D=state.config.tasteDimensions;
  assert.ok(Number.isInteger(D)&&D>0);
  assert.ok(state.weights&&Array.isArray(state.weights.taste));
  const incVals={rate:state.config.tasteRate,gain:state.config.surpriseGain??0,
    width:state.config.marginWidth??0,boost:state.config.marginBoost??0};
  const sm=state.selfMod??={prevTestErr:null,proposals:[]};
  state.selfMod=sm;
  const store=[...state.older,...state.recent];
  const {item,intensify}=proposeV1d(0,sm.prevTestErr,cpIndex);
  if(store.length<S4_SKIP_MIN_STORE){
    const rec={tick,item,intensify,incVals,propVals:null,fitN:0,testN:0,errInc:null,errCand:null,decision:'skip'};
    sm.proposals.push(rec);return rec;
  }
  const test=store.slice(-S4_TEST_N);
  const fit=store.slice(0,-S4_TEST_N).slice(-S4_FIT_CAP);
  const fitN=fit.length,testN=fit.length?test.length:0;
  assert.ok(fitN>0&&testN===S4_TEST_N);
  const w0=state.weights.taste.slice();
  const cloneI=structuredClone(state),cloneC=structuredClone(state);
  assert.equal(cloneI.config.replayStrata,1,'faithful-mix fee assumes single-stratum replay');
  const passes=Math.max(1,cloneI.config.replayPasses??1);
  const errOf=(cl,w)=>{let s=0;for(const rec of test)s+=Math.abs(rec.target-tastePrediction(cl,rec.phi,w));return s/testN;};
  const testErr=errOf(cloneI,w0);
  const choice=proposeV1d(testErr,sm.prevTestErr,cpIndex);
  sm.prevTestErr=testErr;
  fitCloneV1d(cloneI,fit);
  const errInc=errOf(cloneI,cloneI.weights.taste);
  const propVals=applyItemValues(choice.item,choice.intensify,incVals);
  applyToConfig(cloneC.config,propVals);
  fitCloneV1d(cloneC,fit);
  const errCand=errOf(cloneC,cloneC.weights.taste);
  assert.ok(Number.isFinite(testErr)&&Number.isFinite(errInc)&&Number.isFinite(errCand));
  const decision=errCand<errInc*S4_ADOPT_FRAC?'adopt':'keep';
  if(decision==='adopt')applyToConfig(state.config,propVals);
  const fee=2*(fitN*(1+passes)+testN)*(D+1);
  state.work.scalarOperations+=fee;
  const rec={tick,item:choice.item,intensify:choice.intensify,incVals,propVals,fitN,testN,errInc,errCand,decision};
  sm.proposals.push(rec);return rec;
}
// Random-selection control: same round-robin item, coin flip from the
// agent's own billed live rng, applied blindly (no eval, no fee).
// Copied-search control: per-agent mirror of selfmod's adopted configs,
// lagged one checkpoint. cp_0 and dead/absent mirrors are no-ops (logged).
// No evaluation, no fee; the runner invokes it, the agent only carries config.
export function copiedApplyV1d(state,agentId,tick,cpi,mir){
  const item=S4_ITEMS[cpi%S4_ITEMS.length];
  const incVals={rate:state.config.tasteRate,gain:state.config.surpriseGain??0,
    width:state.config.marginWidth??0,boost:state.config.marginBoost??0};
  if(cpi===0)return {tick,item,intensify:null,flip:null,noop:true,sourceCp:null,
    incVals,propVals:{...incVals},fitN:0,testN:0,errInc:null,errCand:null,decision:'copied'};
  const sourceCp=S4_CHECKPOINTS[cpi-1];
  const mv=mir.get(agentId+':'+sourceCp);
  if(mv===undefined)return {tick,item,intensify:null,flip:null,noop:true,sourceCp,
    incVals,propVals:{...incVals},fitN:0,testN:0,errInc:null,errCand:null,decision:'copied'};
  applyToConfig(state.config,mv);
  return {tick,item,intensify:null,flip:null,noop:false,sourceCp,
    incVals,propVals:{...mv},fitN:0,testN:0,errInc:null,errCand:null,decision:'copied'};
}
export function randomApplyV1d(state,tick,cpIndex){
  const item=S4_ITEMS[cpIndex%S4_ITEMS.length];
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
export function runRsiSelfV1d({bankPath,output,resume=false}){
  const sources=rsiSelfV1dSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rsiSelfV1dBank(bankPathAbs);
  assert.equal(p.histories.length,S4_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-04.json');
  const fixture={seeds:[...S4_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-self-v1d-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},sharedDelta:{surpriseGain:0.5,surpriseWindow:16},
      arms:[...S4_ARMS],checkpoints:[...S4_CHECKPOINTS],menu:[...S4_ITEMS],
      loop:{choice:'round-robin item by checkpoint index; trajectory direction (worse->intensify, first attenuates)',
        eval:'faithful-mix sandboxed fit (live update + full replay sweep per fit-record) + test on clones, adopt iff candErr<incErr*0.99 else keep, skip if store<16',
        billing:'flat fee 2*(fitN*(1+passes)+testN)*(tasteDimensions+1) per selfmod evaluation; random pays only its rng draw; copied pays nothing',
        random:'same item, coin flip from live feedRngState, applied blindly, logged with flip',
        copied:'per-agent mirror of same-history selfmod adopted values lagged one checkpoint (cp_0 no-op), applied blindly, logged with sourceCp+noop'},
      caps:{executions:300,aggregateScalarOperations:S4_OP_CAP,wallSeconds:S4_WALL_CAP_SECONDS},
      scope:'RSI-SELF V1d single attempt. No tuning; conjunctive G1-G5+G6a verdict + G6b table decide; no RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=S4_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of S4_ARMS){
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
        let mir=null;
        if(arm==='copied'){
          const selfRow=rows.find(r=>r.arm==='selfmod'&&r.history.seed===history.seed);
          assert.ok(selfRow&&selfRow.endpoint,'copied arm needs completed selfmod row for '+history.seed);
          mir=new Map();
          for(const q of (selfRow.proposals??[]))if(q.decision==='adopt')mir.set(q.agentId+':'+q.tick,{...q.propVals});
        }
        for(let t=0;t<BT_TICKS&&!run.finished;t++){
          const cpi=S4_CHECKPOINTS.indexOf(run.world.tick);
          if(cpi>=0){
            for(const fly of run.world.flies){
              const st=run.learners[fly.id];
              if(arm==='selfmod'&&st.config.selfMod===true)proposals.push({agentId:fly.id,...selfProposeV1d(st,run.world.tick,cpi)});
              else if(arm==='random')proposals.push({agentId:fly.id,...randomApplyV1d(st,run.world.tick,cpi)});
              else if(arm==='copied')proposals.push({agentId:fly.id,...copiedApplyV1d(st,fly.id,run.world.tick,cpi,mir)});
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
  assert.deepEqual(rsiSelfV1dSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=S4_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,S4_EXPECT_MAINS,'Ledger mains count wrong');
  assert.equal(ledger.probes,S4_EXPECT_PROBES,'Ledger probes count wrong');
  const verdict=scoreRsiSelfV1d(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreRsiSelfV1d(rows){
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const lv=r=>r.endpoint.budgetAdjustedEnergyPerFounder;
  const selfRows=rows.filter(r=>r.arm==='selfmod'),randRows=rows.filter(r=>r.arm==='random'),fixRows=rows.filter(r=>r.arm==='fixed'),copyRows=rows.filter(r=>r.arm==='copied');
  const g1rows=rows.length===S4_EXPECT_MAINS&&selfRows.length===8&&randRows.length===8&&fixRows.length===8&&copyRows.length===8&&
    rows.every(r=>r.endpoint&&Number.isFinite(lv(r)));
  const fields=['tick','item','intensify','incVals','propVals','fitN','testN','errInc','errCand','decision'];
  const slots=[];
  for(const r of selfRows)for(let cpi=0;cpi<S4_CHECKPOINTS.length;cpi++){
    const cp=S4_CHECKPOINTS[cpi];
    const at=(r.proposals??[]).filter(q=>q.tick===cp);
    slots.push({seed:r.history.seed,tick:cp,cpi,n:at.length,
      adopts:at.filter(q=>q.decision==='adopt').length,
      keeps:at.filter(q=>q.decision==='keep').length,
      skips:at.filter(q=>q.decision==='skip').length,recs:at});
  }
  const g1cp=slots.length===48&&slots.every(c=>c.n>0&&c.recs.every(q=>fields.every(f=>f in q)));
  const g1=g1rows&&g1cp;
  const expectVals=(q)=>{
    if(q.decision==='skip')return q.propVals===null&&q.testN===0&&q.errInc===null&&q.errCand===null;
    if(!(q.fitN>0&&q.testN===S4_TEST_N&&Number.isFinite(q.errInc)&&Number.isFinite(q.errCand)))return false;
    if(q.item==='rate'&&(q.propVals.rate<S4_RATE_MIN||q.propVals.rate>S4_RATE_MAX))return false;
    if(q.item==='gain'&&(q.propVals.gain<0||q.propVals.gain>S4_GAIN_MAX))return false;
    if(q.item==='margin'&&!((q.propVals.width===0.1&&q.propVals.boost===1.0)||(q.propVals.width===0&&q.propVals.boost===0)))return false;
    const want=applyItemValues(q.item,q.intensify,q.incVals);
    return JSON.stringify(want)===JSON.stringify(q.propVals);
  };
  const selfRecs=slots.flatMap(c=>c.recs.map(q=>({...q,cpi:c.cpi})));
  const g2self=selfRecs.length>0&&selfRecs.every(q=>
    S4_ITEMS[q.cpi%S4_ITEMS.length]===q.item&&expectVals(q)&&
    (q.decision==='skip'||q.decision===(q.errCand<q.errInc*S4_ADOPT_FRAC?'adopt':'keep')));
  const randRecs=randRows.flatMap(r=>r.proposals??[]);
  const g2rand=randRecs.length>0&&randRecs.every(q=>
    q.decision==='applied'&&typeof q.flip==='boolean'&&q.errInc===null&&q.errCand===null&&
    q.fitN===0&&q.testN===0&&q.intensify===q.flip&&
    S4_ITEMS[S4_CHECKPOINTS.indexOf(q.tick)%S4_ITEMS.length]===q.item&&
    JSON.stringify(applyItemValues(q.item,q.flip,q.incVals))===JSON.stringify(q.propVals));
  const mirror=new Map();
  for(const r of selfRows)for(const q of (r.proposals??[]))if(q.decision==='adopt')mirror.set(r.history.seed+':'+q.agentId+':'+q.tick,q.propVals);
  const copyRecs=copyRows.flatMap(r=>(r.proposals??[]).map(q=>({...q,seed:r.history.seed})));
  const g2copy=copyRecs.length>0&&copyRecs.every(q=>{
    if(q.decision!=='copied'||q.fitN!==0||q.testN!==0||q.errInc!==null||q.errCand!==null)return false;
    if(q.intensify!==null||q.flip!=null)return false;
    const cpi=S4_CHECKPOINTS.indexOf(q.tick);
    if(S4_ITEMS[cpi%S4_ITEMS.length]!==q.item)return false;
    if(cpi===0)return q.noop===true&&q.sourceCp===null&&JSON.stringify(q.propVals)===JSON.stringify(q.incVals);
    const src=S4_CHECKPOINTS[cpi-1];
    if(q.sourceCp!==src)return false;
    const mv=mirror.get(q.seed+':'+q.agentId+':'+src);
    if(mv===undefined)return q.noop===true&&JSON.stringify(q.propVals)===JSON.stringify(q.incVals);
    return q.noop===false&&JSON.stringify(q.propVals)===JSON.stringify(mv);
  });
  const g2=g2self&&g2rand&&g2copy;
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const gap=mean(selfRows.map(lv))-mean(fixRows.map(lv));
  const g3=Number.isFinite(gap)&&gap>=-S4_LEVEL_TOL;
  const adoptCp=slots.filter(c=>c.adopts>0).length,keepCp=slots.filter(c=>c.keeps>0).length;
  const skipCp=slots.filter(c=>c.n>0&&c.adopts===0&&c.keeps===0).length;
  const g4=adoptCp>=S4_MIN_ADOPT_CP&&keepCp>=S4_MIN_KEEP_CP&&skipCp<=S4_MAX_SKIP_CP;
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
  const g5=persistent>=S4_MIN_PERSIST&&persistItems.size>=S4_MIN_PERSIST_ITEMS;
  const dSelf=mean(selfRows.map(lv))-mean(randRows.map(lv));
  const g6a=Number.isFinite(dSelf)&&dSelf>S4_SEL_BAND;
  const g6label=!Number.isFinite(dSelf)?'NO-RANDOM-BASELINE':dSelf>S4_SEL_BAND?'selection signal':dSelf<-S4_SEL_BAND?'selection harmful':'no selection signal';
  const dCopy=mean(selfRows.map(lv))-mean(copyRows.map(lv));
  const dCopyFix=mean(copyRows.map(lv))-mean(fixRows.map(lv));
  const g6b={selfmodVsCopied:dCopy,copiedVsFixed:dCopyFix,
    label:!Number.isFinite(dCopy)?'NO-COPIED-BASELINE':dCopy>S4_SEL_BAND?'timing/selection matters':dCopy<-S4_SEL_BAND?'copying beats searching':'configs are all that matters'};
  const go=g1&&g2&&g3&&g4&&g5&&g6a;
  return {g1,g2,g3,g4,g5,g6a,go,gap,adoptCp,keepCp,skipCp,persistent,persistItems:[...persistItems],selGap:dSelf,g6label,g6b,
    verdict:go?`PHASE-D-GO [${g6label}; copy:${g6b.label}]`:(!g1?'INVALID':(!g2?'INVALID':(!g4?'INCOMPLETE':'PHASE-D-NOGO'))),
    detail:slots.map(({seed,tick,n,adopts,keeps,skips})=>({seed,tick,n,adopts,keeps,skips}))};
}
