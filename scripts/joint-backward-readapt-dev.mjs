// JOINT-BACKWARD-READAPT Phase-A dev instrument (FROZEN under docs/JOINT_BACKWARD_READAPT_PLAN_V1.md).
// Same 2 fresh histories, both measures: (a) backward-lite full
// A/B/C/return-A runs (candidate + unlearned; segmentRates retA, imported
// backward core; no frozen arm — gaps only); (b) readapt-full
// replay-diverge ladder (5 T x 2 arms, imported runOne verbatim).
// Joint 2x2 on pooled gaps (x1.1): AGREE-BOTH-POSITIVE /
// AGREE-BOTH-NEGATIVE / DISAGREE (either direction). 24 mains, 0 probes.
// No RSI/transfer/population claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {segmentRates} from './taste-backward-dev.mjs';
import {runOne as readaptRunOne,RR_SWITCH_TICKS} from './retention-readapt-dev.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,BT_TICKS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const JR_EXPERIMENT='joint-backward-readapt-dev';
export const JR_ARMS=Object.freeze(['candidate','unlearned']);
export const JR_MARGIN=1.1;
export const JR_EXPECT_MAINS=24, JR_EXPECT_PROBES=0;
export const JR_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>474163+j));
export const JR_TRIAGE_SEEDS=Object.freeze(Array.from({length:9},(_,j)=>490037+j));
const JR_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045]];
export const JR_SPENT_SEEDS=Object.freeze([381001,...JR_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const JR_OP_CAP=20_000_000_000, JR_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function jrExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/joint-backward-readapt-dev.mjs','docs/JOINT_BACKWARD_READAPT_PLAN_V1.md','tests/joint-backward-readapt-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function jrSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/joint-backward-readapt-dev.mjs','scripts/taste-backward-dev.mjs','scripts/retention-readapt-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/cue-foraging.mjs','learning/continual-regimes.mjs','learning/taste-pressure.mjs','docs/JOINT_BACKWARD_READAPT_PLAN_V1.md'])visit(resolve(root,name));
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
export function jrBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,JR_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of jrExtraTokens())excluded.add(t);
  for(const s of JR_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of JR_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=JR_FIXTURE_SEEDS.length/9===2?Array.from({length:2},(_,h)=>{
    const s=JR_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:h,role:'main'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,18,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:JR_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'JOINT-BACKWARD-READAPT V1 dev bank (deterministic fresh 474163-474180, 18 seeds, 2 main histories). Spend: 24 mains. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runJoint({bankPath,output,resume=false}){
  const sources=jrSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=jrBank(bankPathAbs);
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'joint-backward-readapt-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...JR_ARMS],histories:p.histories.map(h=>h.seed),
      switchTicks:[...RR_SWITCH_TICKS],margin:JR_MARGIN,
      caps:{executions:300,aggregateScalarOperations:JR_OP_CAP,wallSeconds:JR_WALL_CAP_SECONDS},
      scope:'JOINT V1 single attempt. Backward-lite return-A + readapt-full ladder, same seeds. Pre-registered 2x2 agree/disagree. No RSI/transfer/population claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=JR_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const backwardOne=(history,arm)=>{
    let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='backward');
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',part:'backward',arm,seed:history.seed,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`bw:${history.seed}:${arm}`);
    const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    run.advance(BT_TICKS);
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`bw:${arm}/${history.seed}`);
    const seg=segmentRates(run.phaseRows);
    row={history:{seed:history.seed},arm,stage:'backward',seg,phaseRows:run.phaseRows,endpoint};
    assert.ok(seg&&Number.isFinite(seg.A.rate)&&Number.isFinite(seg.retA.rate),'backward segments malformed');
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for bw '+arm+'/'+history.seed);
    note(1,0,BT_TICKS,endpoint.scalarOperations);
    rows.push(row);
    writeOver(join(outputAbs,'rows',`${history.seed}-${arm}-backward.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',part:'backward',arm,seed:history.seed,retA:+seg.retA.rate.toFixed(4)}));
    return rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='backward');
  };
  const readaptOne=(history,arm,switchTick)=>{
    const key=`${history.seed}-${arm}-readapt-T${switchTick}`;
    let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='readapt'&&r.switchTick===switchTick);
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',part:'readapt',arm,seed:history.seed,switchTick,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`ra:${key}`);
    const rr=readaptRunOne(history,arm,switchTick);
    row={history:{seed:history.seed},arm,stage:'readapt',switchTick,foodRate:rr.foodRate,endpoint:rr.endpoint};
    note(1,0,switchTick+128,rr.endpoint.scalarOperations);
    rows.push(row);
    writeOver(join(outputAbs,'rows',`${key}.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',part:'readapt',arm,seed:history.seed,switchTick,foodRate:+rr.foodRate.toFixed(4)}));
    return rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='readapt'&&r.switchTick===switchTick);
  };
  for(const h of p.histories){
    const {wall}=timed(`backward-${h.seed}`,()=>{
      for(const arm of JR_ARMS)backwardOne(h,arm);
    });
    runtimes[`backward-${h.seed}`]=wall;checkpointLedger();
  }
  for(const h of p.histories){
    const {wall}=timed(`readapt-${h.seed}`,()=>{
      for(const arm of JR_ARMS)for(const t of RR_SWITCH_TICKS)readaptOne(h,arm,t);
    });
    runtimes[`readapt-${h.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(jrSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=JR_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,JR_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,JR_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreJointRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreJointRows(rows){
  // Pooled n=2. Backward-positive := pooled retA cand > pooled retA un
  // x1.1. Readapt-positive := pooled T=1024 AND pooled mean-during-B
  // exceed matched naive x1.1 (baseline reported, non-voiding here).
  // Pre-registered 2x2 agree/disagree.
  const bw=rows.filter(r=>r.stage==='backward'&&r.endpoint);
  const ra=rows.filter(r=>r.stage==='readapt'&&r.endpoint);
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const g1=bw.length===4&&ra.length===20&&seeds.length===2&&
    bw.every(r=>r.seg&&Number.isFinite(r.seg.retA.rate)&&Number.isFinite(r.seg.A.rate))&&
    ra.every(r=>Number.isFinite(r.foodRate)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const bwRate=(arm)=>mean(seeds.map(s=>bw.find(r=>r.history.seed===s&&r.arm===arm).seg.retA.rate));
  const raRate=(arm,t)=>mean(seeds.map(s=>ra.find(r=>r.history.seed===s&&r.arm===arm&&r.switchTick===t).foodRate));
  const bwCand=bwRate('candidate'),bwUn=bwRate('unlearned');
  const raPost=raRate('candidate',1024),raPostUn=raRate('unlearned',1024);
  const raDuring=mean([640,768,896,1024].map(t=>raRate('candidate',t)));
  const raDuringUn=mean([640,768,896,1024].map(t=>raRate('unlearned',t)));
  const raBase=raRate('candidate',512),raBaseUn=raRate('unlearned',512);
  const bwPos=bwCand>bwUn*JR_MARGIN;
  const raPos=raPost>raPostUn*JR_MARGIN&&raDuring>raDuringUn*JR_MARGIN;
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/segments/rates)'}
    :(bwPos&&raPos)?{go:true,verdict:'JOINT-AGREE-BOTH-POSITIVE',reason:`both measures positive: retA ${bwCand.toFixed(4)} vs ${bwUn.toFixed(4)}, readapt post ${raPost.toFixed(4)} vs ${raPostUn.toFixed(4)} (x${JR_MARGIN})`}
    :(!bwPos&&!raPos)?{go:false,verdict:'JOINT-AGREE-BOTH-NEGATIVE',reason:`both measures negative: retA ${bwCand.toFixed(4)} vs ${bwUn.toFixed(4)}, readapt post ${raPost.toFixed(4)} vs ${raPostUn.toFixed(4)} (x${JR_MARGIN})`}
    :{go:false,verdict:'JOINT-DISAGREE',reason:`measures disagree: backward retA ${bwCand.toFixed(4)} vs ${bwUn.toFixed(4)} (${bwPos?'pos':'neg'}), readapt post ${raPost.toFixed(4)} vs ${raPostUn.toFixed(4)} / during ${raDuring.toFixed(4)} vs ${raDuringUn.toFixed(4)} (${raPos?'pos':'neg'})`};
  return {backward:{cand:+bwCand.toFixed(4),un:+bwUn.toFixed(4),positive:bwPos},
    readapt:{baseline:+raBase.toFixed(4),baselineUn:+raBaseUn.toFixed(4),postB:+raPost.toFixed(4),postBUn:+raPostUn.toFixed(4),
      duringB:+raDuring.toFixed(4),duringBUn:+raDuringUn.toFixed(4),positive:raPos},
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
