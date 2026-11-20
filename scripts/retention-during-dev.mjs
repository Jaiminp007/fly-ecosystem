// RETENTION-DURING Phase-A dev instrument (FROZEN under docs/RETENTION_DURING_PLAN_V1.md).
// Online retention of stable-foraging (A) WHILE moving-foraging (B) is learned:
// candidate trains A(512)->B(512) with weight snapshots at 512/640/768/896/1024;
// each snapshot -> frozen A-probe (novel stable layout, 256 ticks, updates held,
// pure weight readout) + naive frozen unlearned probe (same layout, exact baseline).
// Differs from taste-backward (live return-A phase after B+C, confounds retention
// with M-RELEARN-ceiling relearning): frozen probes during B, separate worlds.
// GO iff post-B AND mean-during-B food rates exceed unlearned x1.1 (pooled n=2);
// baseline must exceed unlearned x1.1 else INCOMPLETE-NOLEARN (no skill to retain).
// Thin n=2. No transfer/RSI/population claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {freezeTasteEnergyBody} from '../learning/taste-energy.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from './turn-gated-dev-v1m.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';
export const RD_OP_CAP=20_000_000_000, RD_WALL_CAP_SECONDS=3600;

export const RD_EXPERIMENT='retention-during-dev';
export const RD_PAIRS=2;
export const RD_ARMS=Object.freeze(['candidate','unlearned']);
export const RD_TRAIN_TICKS=1024;
export const RD_SNAP_TICKS=Object.freeze([512,640,768,896,1024]);
export const RD_PROBE_TICKS=256;
export const RD_MARGIN=1.1;
export const RD_EXPECT_MAINS=2, RD_EXPECT_PROBES=12;
export const RD_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>474037+j));
const RD_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036]];
export const RD_SPENT_SEEDS=Object.freeze([381001,...RD_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function rdExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/retention-during-dev.mjs','docs/RETENTION_DURING_PLAN_V1.md','tests/retention-during-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rdSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/retention-during-dev.mjs','scripts/taste-backward-dev.mjs','scripts/turn-gated-dev-v1m.mjs','scripts/rsi-transfer-v1b.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/taste-pressure.mjs','learning/continual-regimes.mjs','docs/RETENTION_DURING_PLAN_V1.md'])visit(resolve(root,name));
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
export function rdBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,RD_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of rdExtraTokens())excluded.add(t);
  for(const s of RD_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of RD_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=RD_FIXTURE_SEEDS.length/9===4?Array.from({length:4},(_,h)=>{
    const s=RD_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:Math.floor(h/2),role:h%2===0?'train':'probe'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,36,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:RD_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RETENTION-DURING V1 dev bank (deterministic fresh 474037-474072, 36 seeds, 2 train/probe pairs). Spend: 2 mains + 12 probes. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function foodRate(endpoint){
  // Colony food per tick over the probe (frozen 256-tick readout). Pure.
  assert.ok(endpoint&&endpoint.totals&&Number.isFinite(endpoint.totals.foodEaten));
  assert.ok(Number.isFinite(endpoint.tick)&&endpoint.tick>0);
  return endpoint.totals.foodEaten/endpoint.tick;
}
export function runRetentionDuring({bankPath,output,resume=false}){
  const sources=rdSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rdBank(bankPathAbs);
  assert.equal(p.histories.length,4);
  const pairs=[0,1].map(pi=>({train:p.histories.find(h=>h.pair===pi&&h.role==='train'),probe:p.histories.find(h=>h.pair===pi&&h.role==='probe')}));
  assert.ok(pairs.every(q=>q.train&&q.probe));
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...RD_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'retention-during-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:RD_TRAIN_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...RD_ARMS],pairs:pairs.map(q=>({train:q.train.seed,probe:q.probe.seed})),
      snaps:[...RD_SNAP_TICKS],probeTicks:RD_PROBE_TICKS,margin:RD_MARGIN,
      caps:{executions:300,aggregateScalarOperations:RD_OP_CAP,wallSeconds:RD_WALL_CAP_SECONDS},
      scope:'RETENTION-DURING V1 single attempt. Online A-retention during B via frozen snapshot probes + naive frozen control. GO iff pooled post-B AND pooled mean-during-B food rates exceed unlearned x1.1; baseline must exceed unlearned x1.1 else INCOMPLETE-NOLEARN; else NOGO. Retention only, no transfer/RSI/population claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*RD_TRAIN_TICKS+probes*RD_PROBE_TICKS)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=RD_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const trainOne=(history)=>{
    let row=rows.find(r=>r.history.seed===history.seed&&r.arm==='candidate'&&r.stage==='train');
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',arm:'candidate',seed:history.seed,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`${history.seed}:candidate:train`);
    row=row??{history:{seed:history.seed},arm:'candidate',stage:'train',snaps:null,phaseRows:null,endpoint:null};
    const run=new TasteExperiment({history,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    run.advance(512);
    const snaps={512:snapshotWeights(run.learners)};
    for(let k=0;k<4;k++){run.advance(128);snaps[512+(k+1)*128]=snapshotWeights(run.learners);}
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`candidate/${history.seed}:train`);
    row.snaps=snaps;row.phaseRows=run.phaseRows;row.endpoint=endpoint;
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for candidate/'+history.seed);
    note(1,0,RD_TRAIN_TICKS,endpoint.scalarOperations);
    if(!rows.includes(row))rows.push(row);
    writeOver(join(outputAbs,'rows',`${history.seed}-candidate-train.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',phase:'train',arm:'candidate',seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    return rows.find(r=>r.history.seed===history.seed&&r.arm==='candidate'&&r.stage==='train');
  };
  const probeOne=(trainRow,snapTick,probeHistory,arm)=>{
    const key=`${probeHistory.seed}-${arm}-probe-${snapTick}`;
    let row=rows.find(r=>r.history.seed===probeHistory.seed&&r.arm===arm&&r.stage==='probe'&&r.snapTick===snapTick);
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',arm,seed:probeHistory.seed,snapTick,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`${key}`);
    const run=new TasteExperiment({history:probeHistory,arm:arm==='unlearned'?'unlearned':'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    let sourceDigest=null,appliedDigest=null,transferred=0;
    if(arm==='candidate'){
      const weights=trainRow.snaps[String(snapTick)];
      assert.ok(weights,'missing snapshot '+snapTick);
      for(const id of Object.keys(weights))assertFreshTarget(run.learners[id],id);
      const cp=copyWeights(weights,run.learners);
      const chk=checkTransplantIntegrity(weights,run.learners);
      assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
      sourceDigest=digestWeights(weights);appliedDigest=digestWeights(snapshotWeights(run.learners));
      assert.equal(sourceDigest,appliedDigest,'transplant digest mismatch');
      transferred=cp.transferred;
      for(const id of Object.keys(run.learners))freezeTasteEnergyBody(run.learners[id]);
    }
    run.advance(RD_PROBE_TICKS);
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${probeHistory.seed}:probe-${snapTick}`);
    const rate=foodRate(endpoint);
    row={history:{seed:probeHistory.seed},arm,stage:'probe',snapTick,source:{train:trainRow?trainRow.history.seed:null},
      transfer:{transferred,total:arm==='candidate'?Object.keys(trainRow.snaps[String(snapTick)]).length:0,sourceDigest,appliedDigest},
      foodRate:rate,endpoint};
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for probe '+key);
    note(0,1,RD_PROBE_TICKS,endpoint.scalarOperations);
    rows.push(row);
    writeOver(join(outputAbs,'rows',`${key}.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',phase:'probe',arm,seed:probeHistory.seed,snapTick,foodRate:rate}));
    return rows.find(r=>r.history.seed===probeHistory.seed&&r.arm===arm&&r.stage==='probe'&&r.snapTick===snapTick);
  };
  for(const q of pairs){
    const {wall}=timed('train-'+q.train.seed,()=>{trainOne(q.train);});
    runtimes['train-'+q.train.seed]=wall;checkpointLedger();
  }
  for(const q of pairs){
    const {wall}=timed('probe-'+q.probe.seed,()=>{
      const tr=rows.find(r=>r.history.seed===q.train.seed&&r.arm==='candidate'&&r.stage==='train');
      assert.ok(tr&&tr.endpoint&&tr.snaps,'train row missing for probe '+q.train.seed);
      for(const t of RD_SNAP_TICKS)probeOne(tr,t,q.probe,'candidate');
      probeOne(null,'naive',q.probe,'unlearned');
    });
    runtimes['probe-'+q.probe.seed]=wall;checkpointLedger();
  }
  assert.deepEqual(rdSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=RD_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,RD_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,RD_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreRetentionDuringRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreRetentionDuringRows(rows){
  // Online A-retention during B, pooled over pairs. Baseline (post-A 512)
  // must exceed naive x1.1 (else no skill to retain -> void). GO iff pooled
  // post-B (1024) AND pooled mean-during-B (640/768/896/1024) exceed naive
  // x1.1; else NOGO.
  const trains=rows.filter(r=>r.stage==='train');
  const probes=rows.filter(r=>r.stage==='probe'&&r.endpoint);
  const byPair={};
  for(const r of probes){
    const b=byPair[r.history.seed]??={cand:{},un:null};
    if(r.arm==='candidate')b.cand[r.snapTick]=r.foodRate;
    else if(r.snapTick==='naive')b.un=r.foodRate;
  }
  const pairs=Object.keys(byPair);
  const g1=trains.length===2&&probes.length===12&&pairs.length===2&&
    trains.every(r=>Array.isArray(r.phaseRows)&&r.phaseRows.length>=2&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder))&&
    pairs.every(k=>RD_SNAP_TICKS.every(t=>Number.isFinite(byPair[k].cand[t]))&&Number.isFinite(byPair[k].un));
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const pooled=s=>mean(pairs.map(k=>byPair[k].cand[s]));
  const pooledUn=mean(pairs.map(k=>byPair[k].un));
  const baseline=pooled(512),postB=pooled(1024);
  const duringB=mean([640,768,896,1024].map(pooled));
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/probes/foodRates)'}
    :!(baseline>pooledUn*RD_MARGIN)?{go:false,verdict:'INCOMPLETE-NOLEARN',reason:`no A-skill to retain: pooled post-A food rate ${baseline.toFixed(4)} <= naive ${pooledUn.toFixed(4)} x${RD_MARGIN} (void)`}
    :(postB>pooledUn*RD_MARGIN&&duringB>pooledUn*RD_MARGIN)?{go:true,verdict:'RETENTION-DURING-GO-V1',reason:`A-skill retained during B: pooled post-B ${postB.toFixed(4)} and mean-during-B ${duringB.toFixed(4)} exceed naive ${pooledUn.toFixed(4)} x${RD_MARGIN} (thin n=2, retention only)`}
    :{go:false,verdict:'RETENTION-DURING-NOGO-V1',reason:`A-skill not retained during B: pooled post-B ${postB.toFixed(4)}, mean-during-B ${duringB.toFixed(4)} vs naive ${pooledUn.toFixed(4)} x${RD_MARGIN}`};
  return {perPair:Object.fromEntries(pairs.map(k=>[k,{cand:byPair[k].cand,un:+byPair[k].un.toFixed(4)}])),
    pooled:{baseline:+baseline.toFixed(4),postB:+postB.toFixed(4),duringB:+duringB.toFixed(4),un:+pooledUn.toFixed(4)},
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
