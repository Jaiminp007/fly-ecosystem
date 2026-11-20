// RETURN-NOVEL Phase-A dev instrument (FROZEN under docs/RETURN_NOVEL_PLAN_V1.md).
// Familiarity-vs-skill: backward-train A->B->C (snapshot at 1536), then
// transplant intact weights into a FRESH A-layout world, LIVE 256-tick
// probe vs fresh naive (same probe history, both learning). In-world
// return-A guards (benefit must replicate). GO iff fresh-probe intact >
// naive x1.1 (portable skill); NOGO iff not (old-world familiarity).
// 2 pairs x (2 backward mains + 2 fresh probes). Thin n=2.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {segmentRates} from './taste-backward-dev.mjs';
import {snapshotWeights,digestWeights,copyWeights,assertFreshTarget,checkTransplantIntegrity} from './turn-gated-dev-v1m.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_FOUNDERS,BT_TICKS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const RN_EXPERIMENT='return-novel-dev';
export const RN_ARMS=Object.freeze(['intact','unlearned']);
export const RN_SNAP_TICK=1536, RN_PROBE_TICKS=256;
export const RN_MARGIN=1.1;
export const RN_EXPECT_MAINS=4, RN_EXPECT_PROBES=4;
export const RN_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>474199+j));
const RN_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045],[473046,473063],[473064,473099],[473100,473117],[473118,473153],[473154,473189],[473190,473207],[473208,473225],[473226,473243],[473244,473279],[474001,474036],[474037,474072],[474073,474090],[474091,474108],[474109,474144],[474145,474162],[474163,474180],[474181,474198],[474199,474234],[490001,490009],[490010,490018],[490019,490027],[490028,490036],[490037,490045]];
export const RN_SPENT_SEEDS=Object.freeze([381001,...RN_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const RN_OP_CAP=20_000_000_000, RN_WALL_CAP_SECONDS=3600;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function rnExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/return-novel-dev.mjs','docs/RETURN_NOVEL_PLAN_V1.md','tests/return-novel-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rnSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/return-novel-dev.mjs','scripts/taste-backward-dev.mjs','scripts/turn-gated-dev-v1m.mjs',
    'learning/taste-experiment.mjs','learning/taste-energy.mjs','learning/continual-regimes.mjs','learning/taste-pressure.mjs','docs/RETURN_NOVEL_PLAN_V1.md'])visit(resolve(root,name));
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
export function rnBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,RN_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of rnExtraTokens())excluded.add(t);
  for(const s of RN_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of RN_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=RN_FIXTURE_SEEDS.length/9===4?Array.from({length:4},(_,h)=>{
    const s=RN_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]},pair:Math.floor(h/2),role:h%2===0?'train':'probe'};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,36,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:RN_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'RETURN-NOVEL V1 dev bank (deterministic fresh 474199-474234, 36 seeds, 2 train/probe pairs). Spend: 4 mains + 4 probes. First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function foodRate(endpoint){
  assert.ok(endpoint&&endpoint.totals&&Number.isFinite(endpoint.totals.foodEaten));
  assert.ok(Number.isFinite(endpoint.tick)&&endpoint.tick>0);
  return endpoint.totals.foodEaten/endpoint.tick;
}
export function runReturnNovel({bankPath,output,resume=false}){
  const sources=rnSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rnBank(bankPathAbs);
  assert.equal(p.histories.length,4);
  const pairs=[0,1].map(pi=>({train:p.histories.find(h=>h.pair===pi&&h.role==='train'),probe:p.histories.find(h=>h.pair===pi&&h.role==='probe')}));
  assert.ok(pairs.every(q=>q.train&&q.probe));
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'return-novel-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...RN_ARMS],pairs:pairs.map(q=>({train:q.train.seed,probe:q.probe.seed})),
      snapTick:RN_SNAP_TICK,probeTicks:RN_PROBE_TICKS,margin:RN_MARGIN,
      caps:{executions:300,aggregateScalarOperations:RN_OP_CAP,wallSeconds:RN_WALL_CAP_SECONDS},
      scope:'RETURN-NOVEL V1 single attempt. Backward-train then fresh-live-A-probe vs naive. GO iff fresh intact > fresh naive x1.1 (portable skill); NOGO iff not (familiarity); NOBENEFIT void if in-world benefit fails. No transfer/RSI/population claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*RN_PROBE_TICKS)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=RN_OP_CAP,'Dev aggregate op cap breached');};
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
    const expArm=arm==='unlearned'?'unlearned':'candidate';
    const run=new TasteExperiment({history,arm:expArm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    run.advance(RN_SNAP_TICK);
    const snap=arm==='intact'?snapshotWeights(run.learners):null;
    run.advance(BT_TICKS-RN_SNAP_TICK);
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`bw:${arm}/${history.seed}`);
    const seg=segmentRates(run.phaseRows);
    row={history:{seed:history.seed},arm,stage:'backward',snap,seg,phaseRows:run.phaseRows,endpoint};
    assert.ok(seg&&Number.isFinite(seg.retA.rate),'backward segments malformed');
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for bw '+arm+'/'+history.seed);
    note(1,0,BT_TICKS,endpoint.scalarOperations);
    rows.push(row);
    writeOver(join(outputAbs,'rows',`${history.seed}-${arm}-backward.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',part:'backward',arm,seed:history.seed,retA:+seg.retA.rate.toFixed(4)}));
    return rows.find(r=>r.history.seed===history.seed&&r.arm===arm&&r.stage==='backward');
  };
  const probeOne=(trainRow,probeHistory,arm)=>{
    const key=`${probeHistory.seed}-${arm}-probe`;
    let row=rows.find(r=>r.history.seed===probeHistory.seed&&r.arm===arm&&r.stage==='probe');
    if(row&&row.endpoint){
      console.log(JSON.stringify({stage:'skip',part:'probe',arm,seed:probeHistory.seed,reason:'complete on disk'}));return row;
    }
    if(resume)redone.push(`${key}`);
    const run=new TasteExperiment({history:probeHistory,arm:'candidate',learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
    let sourceDigest=null,appliedDigest=null,transferred=0;
    if(arm==='intact'){
      assert.ok(trainRow&&trainRow.snap,'train snapshot missing for probe');
      for(const id of Object.keys(trainRow.snap))assertFreshTarget(run.learners[id],id);
      const cp=copyWeights(trainRow.snap,run.learners);
      const chk=checkTransplantIntegrity(trainRow.snap,run.learners);
      assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
      sourceDigest=digestWeights(trainRow.snap);appliedDigest=digestWeights(snapshotWeights(run.learners));
      assert.equal(sourceDigest,appliedDigest,'transplant digest mismatch');
      transferred=cp.transferred;
    }
    run.advance(RN_PROBE_TICKS);
    const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${probeHistory.seed}:probe`);
    const rate=foodRate(endpoint);
    row={history:{seed:probeHistory.seed},arm,stage:'probe',snapTick:RN_SNAP_TICK,
      source:{train:trainRow?trainRow.history.seed:null},
      transfer:{transferred,total:arm==='intact'?Object.keys(trainRow.snap).length:0,sourceDigest,appliedDigest},
      foodRate:rate,endpoint};
    assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for probe '+key);
    note(0,1,RN_PROBE_TICKS,endpoint.scalarOperations);
    rows.push(row);
    writeOver(join(outputAbs,'rows',`${key}.json`),row);
    checkpointLedger();
    console.log(JSON.stringify({stage:'world',part:'probe',arm,seed:probeHistory.seed,foodRate:+rate.toFixed(4)}));
    return rows.find(r=>r.history.seed===probeHistory.seed&&r.arm===arm&&r.stage==='probe');
  };
  for(const q of pairs){
    const {wall}=timed(`backward-${q.train.seed}`,()=>{
      for(const arm of RN_ARMS)backwardOne(q.train,arm);
    });
    runtimes[`backward-${q.train.seed}`]=wall;checkpointLedger();
  }
  for(const q of pairs){
    const {wall}=timed(`probe-${q.probe.seed}`,()=>{
      const tr=rows.find(r=>r.history.seed===q.train.seed&&r.arm==='intact'&&r.stage==='backward');
      assert.ok(tr&&tr.endpoint&&tr.snap,'intact train row missing for probe');
      for(const arm of RN_ARMS)probeOne(tr,q.probe,arm);
    });
    runtimes[`probe-${q.probe.seed}`]=wall;checkpointLedger();
  }
  assert.deepEqual(rnSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=RN_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,RN_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,RN_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreReturnNovelRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreReturnNovelRows(rows){
  // Pooled n=2. Guard: in-world retA intact > naive x1.1 (else nothing to
  // test -> void). GO iff fresh-probe intact > fresh-probe naive x1.1
  // (portable skill); else NOGO (familiarity).
  const bw=rows.filter(r=>r.stage==='backward'&&r.endpoint);
  const pr=rows.filter(r=>r.stage==='probe'&&r.endpoint);
  const seeds=[...new Set(bw.map(r=>r.history.seed))];
  const g1=bw.length===4&&pr.length===4&&seeds.length===2&&
    bw.every(r=>r.seg&&Number.isFinite(r.seg.retA.rate))&&
    pr.every(r=>Number.isFinite(r.foodRate)&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder));
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const bwRate=a=>mean(seeds.map(s=>bw.find(r=>r.history.seed===s&&r.arm===a).seg.retA.rate));
  const prRate=a=>{const p=rows.filter(r=>r.stage==='probe'&&r.arm===a);return mean(p.map(r=>r.foodRate));};
  const bwIntact=bwRate('intact'),bwUn=bwRate('unlearned');
  const prIntact=prRate('intact'),prUn=prRate('unlearned');
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/probes/rates)'}
    :!(bwIntact>bwUn*RN_MARGIN)?{go:false,verdict:'INCOMPLETE-NOBENEFIT',reason:`in-world benefit did not replicate: retA intact ${bwIntact.toFixed(4)} <= naive ${bwUn.toFixed(4)} x${RN_MARGIN} (void)`}
    :(prIntact>prUn*RN_MARGIN)?{go:true,verdict:'RETURN-NOVEL-GO-V1',reason:`benefit persists on novel layout: fresh intact ${prIntact.toFixed(4)} vs naive ${prUn.toFixed(4)} x${RN_MARGIN} (portable skill, not familiarity)`}
    :{go:false,verdict:'RETURN-NOVEL-NOGO-V1',reason:`benefit vanishes on novel layout: fresh intact ${prIntact.toFixed(4)} vs naive ${prUn.toFixed(4)} (x${RN_MARGIN}) — old-world familiarity`};
  return {backward:{intact:+bwIntact.toFixed(4),un:+bwUn.toFixed(4)},
    probe:{intact:+prIntact.toFixed(4),un:+prUn.toFixed(4)},
    g1,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
