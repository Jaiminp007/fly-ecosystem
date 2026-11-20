// RSI-SELF Phase-A dev instrument (FROZEN under docs/RSI_SELF_PLAN_V1.md + V1A).
// In-agent propose -> evaluate -> adopt loop. 2 arms (selfmod/fixed) x 4
// histories = 8 mains (BT_TICKS=1792), ZERO probes. The runner steps
// TasteExperiment directly; at world.tick in {512,1024,1536} (true BT phase
// boundaries A->B/B->C/C->return-A) it invokes selfPropose on live agents
// with config.selfMod===true. fixed arm: identical config, loop never runs.
// selfPropose (contract): scale-free direction from the agent's own testErr
// trajectory; symmetric sandboxed fit/test eval on clones; adopt iff
// candErr < incErr*0.99 (ties/noise keep); skip if store<16; flat fee
// 2*(fitN+testN)*(D+1) billed to the live meter (ALL math on clones, so the
// live delta is exactly the fee). Adoption changes the RATE only; live
// weights keep evolving through the agent's real update path.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {tasteUpdate,tastePrediction} from '../learning/taste-energy.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const S_EXPERIMENT='rsi-self-dev';
export const S_HISTORIES=4;
export const S_ARMS=Object.freeze(['selfmod','fixed']);
export const S_EXPECT_MAINS=8, S_EXPECT_PROBES=0;
export const S_OP_CAP=20_000_000_000, S_WALL_CAP_SECONDS=3600;
export const S_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>396001+j));
const S_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072]];
export const S_SPENT_SEEDS=Object.freeze([381001,...S_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const S_CHECKPOINTS=Object.freeze([512,1024,1536]);
export const S_RATE_MIN=0.05, S_RATE_MAX=2.0, S_ADOPT_FRAC=0.99;
export const S_SKIP_MIN_STORE=16, S_FIT_CAP=32, S_TEST_N=8;
export const S_LEVEL_TOL=0.15, S_MIN_ADOPT_CP=2, S_MIN_KEEP_CP=2, S_MAX_SKIP_CP=2;
const NOOP=()=>{};
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function rsiSelfExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/rsi-self-dev.mjs','docs/RSI_SELF_PLAN_V1.md','docs/RSI_SELF_PLAN_V1A.md']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rsiSelfDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/rsi-self-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','docs/RSI_SELF_PLAN_V1.md','docs/RSI_SELF_PLAN_V1A.md'])visit(resolve(root,name));
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
export function rsiSelfDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,S_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of rsiSelfExtraTokens())excluded.add(t);
  for(const s of S_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of S_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=Array.from({length:S_HISTORIES},(_,h)=>{
    const s=S_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  });
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,S_HISTORIES*9,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:S_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RSI-SELF dev bank (deterministic fresh 396001-396036, 9/history, 4 histories). Spend: 8 mains (2 arms x 4 main-seeds); other 28 slots reserved-excluded, never spendable elsewhere. First use is the single V1a run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Pure proposal direction (exported for fixtures): strictly-worse own test
// error doubles the rate, otherwise halves; first checkpoint defaults to half.
export function proposeDirection(testErr,prevTestErr,incRate){
  assert.ok(Number.isFinite(testErr)&&testErr>=0&&Number.isFinite(incRate)&&incRate>0);
  let r;
  if(prevTestErr===null||!Number.isFinite(prevTestErr))r=incRate*0.5;
  else r=testErr>prevTestErr?incRate*2:incRate*0.5;
  return Math.min(S_RATE_MAX,Math.max(S_RATE_MIN,r));
}
// The in-agent loop. Reads ONLY the agent's own state; writes the rate
// (adopt only), the fee, and the proposal log. All hypothetical math runs on
// structured clones, so the live meter delta is exactly the flat fee.
export function selfPropose(state,tick){
  assert.ok(state.config.selfMod===true,'selfPropose invoked on non-selfmod agent');
  const D=state.config.tasteDimensions;
  assert.ok(Number.isInteger(D)&&D>0);
  assert.ok(state.weights&&Array.isArray(state.weights.taste));
  const incRate=state.config.tasteRate;
  const sm=state.selfMod??={prevTestErr:null,proposals:[]};
  state.selfMod=sm;
  const store=[...state.older,...state.recent];
  if(store.length<S_SKIP_MIN_STORE){
    const rec={tick,incRate,propRate:null,fitN:0,testN:0,errInc:null,errCand:null,decision:'skip'};
    sm.proposals.push(rec);return rec;
  }
  const test=store.slice(-S_TEST_N);
  const fit=store.slice(0,-S_TEST_N).slice(-S_FIT_CAP);
  const fitN=fit.length,testN=test.length;
  assert.ok(fitN>0&&testN===S_TEST_N);
  const w0=state.weights.taste.slice();
  const cloneI=structuredClone(state),cloneC=structuredClone(state);
  const errOf=(cl,w)=>{let s=0;for(const rec of test)s+=Math.abs(rec.target-tastePrediction(cl,rec.phi,w));return s/testN;};
  const testErr=errOf(cloneI,w0);
  const propRate=proposeDirection(testErr,sm.prevTestErr,incRate);
  sm.prevTestErr=testErr;
  for(const rec of fit)tasteUpdate(cloneI,rec,'live',NOOP);
  const errInc=errOf(cloneI,cloneI.weights.taste);
  cloneC.config.tasteRate=propRate;
  for(const rec of fit)tasteUpdate(cloneC,rec,'live',NOOP);
  const errCand=errOf(cloneC,cloneC.weights.taste);
  assert.ok(Number.isFinite(testErr)&&Number.isFinite(errInc)&&Number.isFinite(errCand));
  const decision=errCand<errInc*S_ADOPT_FRAC?'adopt':'keep';
  if(decision==='adopt')state.config.tasteRate=propRate;
  const fee=2*(fitN+testN)*(D+1);
  state.work.scalarOperations+=fee;
  const rec={tick,incRate,propRate,fitN,testN,errInc,errCand,decision};
  sm.proposals.push(rec);return rec;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runRsiSelfDev({bankPath,output,resume=false}){
  const sources=rsiSelfDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rsiSelfDevBank(bankPathAbs);
  assert.equal(p.histories.length,S_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...S_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'rsi-self-v1a-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},sharedDelta:{surpriseGain:0.5,surpriseWindow:16},
      arms:[...S_ARMS],checkpoints:[...S_CHECKPOINTS],
      loop:{proposal:'testErr>prevTestErr ? rate*2 : rate*0.5, clip [0.05,2], first-checkpoint default *0.5',
        eval:'symmetric sandboxed fit/test on clones, adopt iff candErr<incErr*0.99 else keep, skip if store<16',
        billing:'flat fee 2*(fitN+testN)*(tasteDimensions+1) ops per evaluation; adoption changes rate only'},
      caps:{executions:300,aggregateScalarOperations:S_OP_CAP,wallSeconds:S_WALL_CAP_SECONDS},
      scope:'RSI-SELF V1a single mechanism-demo attempt. No tuning; conjunctive G1-G4 verdict decides; no improvement claimable.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=S_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of S_ARMS){
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
          if(S_CHECKPOINTS.includes(run.world.tick)){
            for(const fly of run.world.flies){
              const st=run.learners[fly.id];
              if(st.config.selfMod===true)proposals.push({agentId:fly.id,...selfPropose(st,run.world.tick)});
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
  assert.deepEqual(rsiSelfDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=S_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,S_EXPECT_MAINS,'Ledger mains count wrong');
  assert.equal(ledger.probes,S_EXPECT_PROBES,'Ledger probes count wrong');
  const verdict=scoreRsiSelf(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreRsiSelf(rows){
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const lv=r=>r.endpoint.budgetAdjustedEnergyPerFounder;
  const selfRows=rows.filter(r=>r.arm==='selfmod'),fixRows=rows.filter(r=>r.arm==='fixed');
  const fields=['tick','incRate','propRate','fitN','testN','errInc','errCand','decision'];
  const g1rows=rows.length===S_EXPECT_MAINS&&selfRows.length===4&&fixRows.length===4&&
    rows.every(r=>r.endpoint&&Number.isFinite(lv(r)));
  const cps=[];
  for(const r of selfRows)for(const cp of S_CHECKPOINTS){
    const at=(r.proposals??[]).filter(q=>q.tick===cp);
    cps.push({seed:r.history.seed,tick:cp,n:at.length,
      adopts:at.filter(q=>q.decision==='adopt').length,
      keeps:at.filter(q=>q.decision==='keep').length,
      skips:at.filter(q=>q.decision==='skip').length,recs:at});
  }
  const g1cp=cps.length===12&&cps.every(c=>c.n>0&&c.recs.every(q=>fields.every(f=>f in q)));
  const g1=g1rows&&g1cp;
  const rule=q=>q.decision==='skip'
    ?(q.testN===0&&q.propRate===null&&q.errInc===null&&q.errCand===null)
    :(q.fitN>0&&q.testN===S_TEST_N&&Number.isFinite(q.errInc)&&Number.isFinite(q.errCand)&&
      q.propRate>=S_RATE_MIN&&q.propRate<=S_RATE_MAX&&
      (q.decision===(q.errCand<q.errInc*S_ADOPT_FRAC?'adopt':'keep')));
  const allRecs=cps.flatMap(c=>c.recs);
  const g2=allRecs.length>0&&allRecs.every(rule);
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const gap=mean(selfRows.map(lv))-mean(fixRows.map(lv));
  const g3=Number.isFinite(gap)&&gap>=-S_LEVEL_TOL;
  const adoptCp=cps.filter(c=>c.adopts>0).length,keepCp=cps.filter(c=>c.keeps>0).length;
  const skipCp=cps.filter(c=>c.n>0&&c.adopts===0&&c.keeps===0).length;
  const g4=adoptCp>=S_MIN_ADOPT_CP&&keepCp>=S_MIN_KEEP_CP&&skipCp<=S_MAX_SKIP_CP;
  const go=g1&&g2&&g3&&g4;
  return {g1,g2,g3,g4,go,gap,adoptCp,keepCp,skipCp,
    verdict:go?'PHASE-A-GO':(!g1?'INVALID':(!g2?'INVALID':(!g4?'INCOMPLETE':'PHASE-A-NOGO'))),
    detail:cps.map(({seed,tick,n,adopts,keeps,skips})=>({seed,tick,n,adopts,keeps,skips}))};
}
