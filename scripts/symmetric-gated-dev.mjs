// Symmetric-gated protection Phase-D dev instrument (FROZEN under
// docs/SYMMETRIC_GATED_PLAN_V1.md). N-body only. Three configs: tau in
// {null (off/control: compute, never apply), 0 (V3-uniform replication),
// 0.3}, all at slowAnchorRate=DEV_MU, slowAnchorStrength=0.02 (masked apply:
// billing constant at identical states). 4 histories x 6 arms = 72 mains
// (BT_TICKS=1792); 3 configs x 52-probe batteries = 156 probes. Bars: G1
// relevance (control-candidate mains motor-progress terciles), G2 effect
// (tau-0.3 vs null, V3 aggregates), G3 (fixture exactness pre-proven +
// in-bank non-degeneracy (iii')), G4 caps, G5 triage. Single attempt;
// no qual contact.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {runTastePressureBattery} from '../learning/taste-pressure.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';
import {DEV_MU,tasteAlignment} from './body-transfer-dev.mjs';

export const S_EXPERIMENT='symmetric-gated-dev';
export const S_HISTORIES=4;
export const S_TAUS=Object.freeze([null,0,0.3]);
export const S_ANCHOR_STRENGTH=0.02;
export const S_ARMS=Object.freeze(
  ['candidate','unlearned','frozen','reset','acceptCruise','acceptStationary']);
export const S_EXPECT_MAINS=72, S_EXPECT_PROBES=156, S_EXPECT_EXEC=228;
export const S_OP_CAP=20_000_000_000, S_WALL_CAP_SECONDS=3600;
export const S_FIXTURE_SEEDS=Object.freeze(Array.from({length:36},(_,j)=>383001+j));
const S_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036]];
export const S_SPENT_SEEDS=Object.freeze([381001,...S_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function gateExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/symmetric-gated-dev.mjs','docs/SYMMETRIC_GATED_PLAN_V1.md','tests/symmetric-gated.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function symmetricGatedDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/symmetric-gated-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','tests/symmetric-gated.test.mjs','docs/SYMMETRIC_GATED_PLAN_V1.md'])visit(resolve(root,name));
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
export function symmetricGatedDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,S_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gateExtraTokens())excluded.add(t);
  for(const s of S_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of S_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=S_FIXTURE_SEEDS.length/S_HISTORIES===9?Array.from({length:S_HISTORIES},(_,h)=>{
    const s=S_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,S_HISTORIES*9,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:S_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'S-GATE Phase-D dev bank (deterministic fresh 383001-383036, 9/history). First use is the single dev run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// G1 relevance collector: admitted motor-progress records from control mains.
export function collectRelevance(){
  const recs=[];let bad=0;
  const emit=e=>{
    if(e.type!=='update'||!e.event||e.event.type!=='motor-progress')return;
    const ev=e.event;if(!ev.admitted)return;
    const r=ev.record;if(!r||!Number.isFinite(r.baseProbability)){bad++;return;}
    if(ev.target!==0&&ev.target!==1){bad++;return;}
    recs.push({margin:Math.abs(r.baseProbability-0.5),hit:ev.target===1?1:0});
  };
  const verdict=()=>{
    const n=recs.length;
    if(bad>0||n<1000)return {n,bad,go:false,reason:bad>0?'non-binary-or-missing target/margin':'fewer than 1000 admitted decisions'};
    const sorted=[...recs].sort((a,b)=>a.margin-b.margin);
    const k=Math.floor(n/3);
    const lo=sorted.slice(0,k),hi=sorted.slice(n-k);
    const rate=a=>a.reduce((x,r)=>x+r.hit,0)/a.length;
    const gap=rate(hi)-rate(lo);
    return {n,bad,cut1:sorted[k-1].margin,cut2:sorted[n-k].margin,loRate:rate(lo),hiRate:rate(hi),gap,go:gap>=0.10};
  };
  return {emit,recs,verdict};
}
export function gateGoNoGo(perTau){
  // perTau: {tau, meanAret, meanBret, meanLevel, meanAlign}; control is null.
  const control=perTau.find(p=>p.tau===null);assert.ok(control);
  const gated=perTau.filter(p=>p.tau!==null&&p.tau!==undefined);
  assert.ok(gated.length>0);
  const best=[...gated].sort((a,b)=>b.meanAret-a.meanAret)[0];
  const dA=best.meanAret-control.meanAret,dB=best.meanBret-control.meanBret,
    dL=best.meanLevel-control.meanLevel,alignUp=best.meanAlign>control.meanAlign;
  const go=dA>=0.15&&dB>=-0.10&&dL>=-0.20&&alignUp;
  return {bestTau:best.tau,dA,dB,dL,alignUp,go,verdict:go?'DEV-GO':'DEV-NOGO'};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
function weightsOf(anchor){const out={};for(const[l]of Object.values(anchor.state.learners).map(x=>[x]))out[l.agentId]=l.weights;return out;}
function tauTag(tau){return tau===null?'tau-null':`tau-${tau}`;}
function checkNonDegeneracy(rows,outputAbs){
  // G3(iii'): the 0.3 gate must have opened AND closed somewhere in-bank.
  // Deterministic masked billing: any anchor difference ⟺ gate took that path.
  const W={};for(const t of S_TAUS)W[tauTag(t)]={};
  for(const r of rows){const w=weightsOf(read(join(outputAbs,'anchors',r.tag,`${r.history.seed}-C.json`)));W[r.tag][r.history.seed]=w;}
  let opened=false,closed=false;const detail=[];
  for(const h of Object.keys(W['tau-0.3'])){
    const sameAsNull=JSON.stringify(W['tau-0.3'][h])===JSON.stringify(W['tau-null'][h]);
    const sameAsZero=JSON.stringify(W['tau-0.3'][h])===JSON.stringify(W['tau-0'][h]);
    detail.push({seed:Number(h),sameAsNull,sameAsZero});
    if(!sameAsNull)opened=true;if(!sameAsZero)closed=true;
  }
  return {opened,closed,go:opened&&closed,detail};
}
export function runSymmetricGatedDev({bankPath,output,resume=false}){
  const sources=symmetricGatedDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=symmetricGatedDevBank(bankPathAbs);
  assert.equal(p.histories.length,S_HISTORIES);
  // Fixture AFTER bank build (V1c ordering lesson: the exclusion scan
  // seed-indexes evidence JSON, so writing it first would self-poison).
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...S_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'symmetric-gated-dev-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},anchorRate:DEV_MU,anchorStrength:S_ANCHOR_STRENGTH,
      taus:['null',0,0.3],arms:[...S_ARMS],
      caps:{executions:300,aggregateScalarOperations:S_OP_CAP,wallSeconds:S_WALL_CAP_SECONDS},
      scope:'S-GATE Phase-D single dev run (V1). No tuning on qual seeds; conjunctive G1-G5 decide.'});
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
  const configs=S_TAUS.map(tau=>({tag:tauTag(tau),tau,strength:S_ANCHOR_STRENGTH}));
  for(const {tag,tau,strength} of configs){
    const {wall,cpuS}=timed(tag,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.tag===tag);
        if(row&&Object.keys(row.arms).length===S_ARMS.length&&Object.keys(row.probes).length===12){
          console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${tag}`);
        row=row??{history:{seed:history.seed},tag,tau,strength,arms:{},probes:{},relevance:null};
        const learnerOptions={...BT_LEARNER_OPTIONS,slowAnchorRate:DEV_MU,slowAnchorStrength:strength,marginGateTau:tau};
        const rel=tag==='tau-null'?collectRelevance():null;
        for(const arm of S_ARMS){
          const collector=(tag==='tau-null'&&arm==='candidate')?rel:null;
          const run=new TasteExperiment({history,arm,learnerOptions:{...learnerOptions},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector?collector.emit:null});
          run.advance(BT_TICKS);
          const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${arm}/${history.seed}`);
          row.arms[arm]={endpoint};note(1,0,BT_TICKS,endpoint.scalarOperations);
          if(arm==='candidate'){
            writeOver(join(outputAbs,'anchors',tag,`${history.seed}-A.json`),run.atA);
            writeOver(join(outputAbs,'anchors',tag,`${history.seed}-C.json`),run.atC);
          }
          console.log(JSON.stringify({stage:'world',tag,seed:history.seed,arm,energy:endpoint.budgetAdjustedEnergyPerFounder}));
        }
        if(rel)row.relevance={recs:rel.recs};
        const atC=read(join(outputAbs,'anchors',tag,`${history.seed}-C.json`));
        const atA=read(join(outputAbs,'anchors',tag,`${history.seed}-A.json`));
        const pressure=runTastePressureBattery(atC,history,{founders:BT_FOUNDERS,ticks:256,emit:null});
        for(const [k,probe] of Object.entries(pressure.probes)){row.probes[k]=probe;note(0,1,256,probe.endpoint.additionalScalarOperations);}
        note(0,1,256,pressure.sham.endpoint.additionalScalarOperations);
        row.alignment=tasteAlignment(atA,atC);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
        checkpointLedger();
      }
    });
    runtimes[tag]={wall,cpuS};checkpointLedger();
  }
  assert.deepEqual(symmetricGatedDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=S_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const verdict=scoreSymmetricGatedDev(rows,ledger,outputAbs);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function scoreSymmetricGatedDev(rows,ledger,outputAbs){
  const pool=rows.filter(r=>r.tag==='tau-null').flatMap(r=>r.relevance.recs);
  const g1=(()=>{const c=collectRelevance();for(const r of pool)c.recs.push(r);return c.verdict();})();
  const perTau=S_TAUS.map(tau=>{
    const tag=tauTag(tau);
    const rs=rows.filter(r=>r.tag===tag);assert.equal(rs.length,S_HISTORIES);
    const aret=rs.map(r=>r.probes['A:current'].value-0.95*r.probes['A:A'].value-0.05*r.probes['A:reset'].value);
    const bret=rs.map(r=>r.probes['B:current'].value-0.95*r.probes['B:B'].value-0.05*r.probes['B:reset'].value);
    const lvl=rs.map(r=>r.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-r.arms.unlearned.endpoint.budgetAdjustedEnergyPerFounder);
    const mean=a=>a.reduce((x,v)=>x+v,0)/a.length;
    return {tau,meanAret:mean(aret),meanBret:mean(bret),meanLevel:mean(lvl),meanAlign:mean(rs.map(r=>r.alignment.cos))};
  });
  const g2=gateGoNoGo(perTau);
  const g3=checkNonDegeneracy(rows,outputAbs);
  const decision={g1,g2,g3seeds:g3.detail.map(d=>d.seed),go:g1.go&&g2.go&&g3.go,verdict:(g1.go&&g2.go&&g3.go)?'DEV-GO':'DEV-NOGO'};
  return {perTau,g1,g2,g3,decision};
}
