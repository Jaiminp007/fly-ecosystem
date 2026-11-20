// R-GAP Phase-A dev instrument (FROZEN under docs/R_GAP_PLAN_V1.md + V1a).
// Gap-widening search: control + 5 proposals (S1 shared/appetite, S2
// frontload/recent, S3 td+criticWarmStart), each = 6 candidate-equivalent
// mains + A/B/transfer current-vs-reset probes (6 keys x 6 histories).
// 6 configs x 42 exec = 252 total. No battery wrapper (runTasteProbe direct;
// the 6 keys are all the verdict needs). Symmetric billing mandatory:
// S2's schedule check is plain-JS (unbilled); all arms bill identical
// engine paths at identical states (fixture-proven). Transfer guard:
// any per-history |Tgap - Tgap_control| > 0.1 INVALIDATES the run.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment,runTasteProbe} from '../learning/taste-experiment.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const R_EXPERIMENT='r-gap-dev';
export const R_HISTORIES=6;
export const R_ARMS=Object.freeze(
  ['candidate','unlearned','frozen','reset','acceptCruise','acceptStationary']);
export const R_PROBE_SPECS=Object.freeze([
  ['A','current'],['A','reset'],['B','current'],['B','reset'],
  ['transfer','current'],['transfer','reset']]);
export const R_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>387001+j));
const R_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],
  [382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054]];
export const R_SPENT_SEEDS=Object.freeze([381001,...R_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const R_EXPECT_MAINS=36, R_EXPECT_PROBES=216, R_EXPECT_EXEC=252;
export const R_OP_CAP=20_000_000_000, R_WALL_CAP_SECONDS=3600;
export const R_G1_BAR=0.5, R_GUARD_TOL=0.1, R_BASELINE_LO=0.5, R_BASELINE_HI=2.5;
export const R_V1B_TRANSFER_CAP=5.0;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

export const R_CONFIGS=Object.freeze([
  {tag:'control',arm:'candidate',options:{}},
  {tag:'S1-shared',arm:'candidate',options:{motorRepresentation:'shared'}},
  {tag:'S1-appetite',arm:'candidate',options:{motorRepresentation:'appetite'}},
  {tag:'S2-frontload',arm:'frontload',options:{}},
  {tag:'S2-recent',arm:'recent',options:{}},
  {tag:'S3-tdwarm',arm:'candidate',options:{motorRule:'td',criticWarmStart:true}},
]);

function gapExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/r-gap-dev.mjs','docs/R_GAP_PLAN_V1.md','docs/R_GAP_PLAN_V1A.md','tests/r-gap-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function rGapDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/r-gap-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','tests/r-gap-dev.test.mjs','docs/R_GAP_PLAN_V1.md','docs/R_GAP_PLAN_V1A.md'])visit(resolve(root,name));
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
export function rGapDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,R_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gapExtraTokens())excluded.add(t);
  for(const s of R_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of R_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=R_FIXTURE_SEEDS.length/R_HISTORIES===9?Array.from({length:R_HISTORIES},(_,h)=>{
    const s=R_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,R_HISTORIES*9,'Dev bank must be 54 unique seeds');
  const p={schema:1,experiment:R_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'R-GAP Phase-A dev bank (deterministic fresh 387001-387054, 9/history). First use is the single Phase-A run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
// Pure gap scorer (exported for fixtures): gaps[tag][seed] = {dA,dB,dT}.
export function scoreRGap(gaps){
  const tags=Object.keys(gaps);
  assert.ok(tags.includes('control'));
  const mean=a=>a.reduce((x,v)=>x+v,0)/a.length;
  const perConfig={};
  for(const t of tags){
    const hs=Object.keys(gaps[t]);
    perConfig[t]={n:hs.length,
      meanGap:mean(hs.map(h=>(gaps[t][h].dA+gaps[t][h].dB)/2)),
      meanTransfer:mean(hs.map(h=>gaps[t][h].dT))};
  }
  const control=perConfig.control.meanGap;
  let best=null,bestGain=-Infinity;
  for(const t of tags){if(t==='control')continue;
    const gain=perConfig[t].meanGap-control;
    if(gain>bestGain){bestGain=gain;best=t;}}
  const guardViolations=[];
  for(const h of Object.keys(gaps[best]??{})){
    const dT=Math.abs(gaps[best][h].dT-(gaps.control[h]?.dT??0));
    if(dT>R_GUARD_TOL)guardViolations.push({seed:h,dT});
  }
  const baselineOk=control>=R_BASELINE_LO&&control<=R_BASELINE_HI;
  const go=guardViolations.length===0&&baselineOk&&bestGain>=R_G1_BAR;
  const verdict=guardViolations.length>0?'INVALID-BILLING':!baselineOk?'INVALID-BASELINE':go?'PHASE-A-GO':'PHASE-A-NOGO';
  return {perConfig,controlGap:control,best,bestGain,guardViolations,baselineOk,go,verdict};
}
export function runRGapDev({bankPath,output,resume=false}){
  const sources=rGapDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=rGapDevBank(bankPathAbs);
  assert.equal(p.histories.length,R_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...R_FIXTURE_SEEDS]};
  if(existsSync(fixturePath))assert.deepEqual(read(fixturePath),fixture,'Fixture seeds file already exists with different content; will not overwrite');
  else write(fixturePath,fixture);
  let rows=[],ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0},runtimes={},redone=[];
  const t0=Date.now();
  if(existsSync(join(outputAbs,'dev-results.json'))&&!resume)throw new Error(`Dev output already exists; preserve it: ${outputAbs}`);
  mkdirSync(join(outputAbs,'rows'),{recursive:true});mkdirSync(join(outputAbs,'anchors'),{recursive:true});
  if(resume){
    rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
    const l=read(join(outputAbs,'ledger.json'));ledger=l.ledger;runtimes=l.runtimes;redone=l.redone;
  }else{
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(pathDirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)),{flag:'wx'});}
    write(join(outputAbs,'protocol.json'),p);
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'r-gap-phaseA-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},configs:R_CONFIGS.map(c=>({tag:c.tag,arm:c.arm,options:c.options})),
      caps:{executions:300,aggregateScalarOperations:R_OP_CAP,wallSeconds:R_WALL_CAP_SECONDS},
      scope:'R-GAP Phase-A single search (V1+V1a). No tuning on qual seeds; conjunctive G1-G5 decide.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=R_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const {tag,arm,options} of R_CONFIGS){
    const {wall,cpuS}=timed(tag,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.tag===tag);
        if(row&&row.endpoint&&Object.keys(row.probes??{}).length===R_PROBE_SPECS.length){
          console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${tag}`);
        row=row??{history:{seed:history.seed},tag,arm,options,endpoint:null,probes:{},digestSame:null};
        const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS,...options},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
        row.endpoint=endpoint;note(1,0,BT_TICKS,endpoint.scalarOperations);
        const anchor=run.checkpoint(false);
        writeOver(join(outputAbs,'anchors',tag,`${history.seed}-C.json`),anchor);
        const digestBefore=digest(JSON.stringify(anchor));
        for(const [family,version] of R_PROBE_SPECS){
          const probe=runTasteProbe(anchor,{family,version,seed:history.probeSeeds[family],ticks:256,founders:BT_FOUNDERS,emit:null});
          row.probes[`${family}:${version}`]=probe;note(0,1,256,probe.endpoint.additionalScalarOperations);
        }
        row.digestSame=digest(JSON.stringify(anchor))===digestBefore;
        assert.ok(row.digestSame,`anchor mutated during probes ${tag}/${history.seed}`);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
      }
    });
    runtimes[tag]={wall,cpuS};checkpointLedger();
  }
  assert.deepEqual(rGapDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=R_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const gaps={};
  for(const r of rows){
    const g=k=>Math.abs(r.probes[`${k}:current`].value-r.probes[`${k}:reset`].value);
    (gaps[r.tag]??={})[r.history.seed]={dA:g('A'),dB:g('B'),dT:g('transfer')};
  }
  const decision=scoreRGap(gaps);
  assert.equal(ledger.mains,R_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,R_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return decision;
}

// V1b bias-corrected scorer (frozen plan docs/R_GAP_PLAN_V1B.md):
// gap_disc = mean(|A|,|B|) − transfer, paired per history. Pure function.
export function scoreRGapV1b(rows){
  const mean=a=>a.reduce((x,v)=>x+v,0)/a.length;
  const perHist={};
  for(const r of rows){
    const v=k=>r.probes[`${k}:current`].value-r.probes[`${k}:reset`].value;
    const dT=Math.abs(v('transfer'));
    (perHist[r.tag]??={})[r.history.seed]={dA:Math.abs(v('A')),dB:Math.abs(v('B')),dT,
      sA:v('A'),sB:v('B')};
  }
  const tags=Object.keys(perHist);
  assert.ok(tags.includes('control'));
  const disc=(t,h)=>(perHist[t][h].dA+perHist[t][h].dB)/2-perHist[t][h].dT;
  const perConfig={};
  for(const t of tags){
    const hs=Object.keys(perHist[t]);
    perConfig[t]={n:hs.length,meanDisc:mean(hs.map(h=>disc(t,h))),
      meanRaw:mean(hs.map(h=>(perHist[t][h].dA+perHist[t][h].dB)/2))};
  }
  const control=perConfig.control.meanDisc;
  let best=null,bestGain=-Infinity;
  for(const t of tags){if(t==='control')continue;
    const gain=perConfig[t].meanDisc-control;
    if(gain>bestGain){bestGain=gain;best=t;}}
  const corrupt=Object.keys(perHist[best]??{}).filter(h=>perHist[best][h].dT>R_V1B_TRANSFER_CAP);
  const signOk=Object.keys(perHist[best]??{}).filter(h=>((perHist[best][h].sA+perHist[best][h].sB)/2)>=0).length;
  const signNeed=Math.ceil(Object.keys(perHist[best]??{}).length*4/6);
  const baselineOk=(()=>{const hs=Object.keys(perHist.control);
    const m=mean(hs.map(h=>(perHist.control[h].dA+perHist.control[h].dB)/2));
    return m>=R_BASELINE_LO&&m<=R_BASELINE_HI;})();
  const go=corrupt.length===0&&signOk>=signNeed&&baselineOk&&bestGain>=R_G1_BAR;
  const verdict=corrupt.length>0?'INVALID-CORRUPT':!baselineOk?'INVALID-BASELINE':!go?'V1B-NOGO':'V1B-GO';
  return {perConfig,control,best,bestGain,corrupt,signOk,signNeed,baselineOk,go,verdict};
}

export function rescoreRGapV1b({bankPath,output}){
  // Analytic-only completion (V1b): zero worlds, zero bank contact.
  const sources=rGapDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const attempt=read(join(outputAbs,'attempt.json'));
  assert.equal(attempt.kind,'r-gap-phaseA-attempt','wrong attempt for V1b rescore');
  assert.equal(digest(readFileSync(bankPathAbs)),attempt.bankSha256,'Bank changed since attempt start');
  const rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
  assert.equal(rows.length,6*R_HISTORIES,'Row count mismatch');
  const verdict=scoreRGapV1b(rows);
  writeOver(join(outputAbs,'dev-results-v1b.json'),{...verdict,
    executionSources:attempt.sourceSha256,scoringSources:sources});
  return verdict;
}
