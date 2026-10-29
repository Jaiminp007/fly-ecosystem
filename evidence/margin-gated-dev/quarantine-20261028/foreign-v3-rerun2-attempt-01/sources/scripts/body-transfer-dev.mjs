// Body-transfer V3 Phase-D dev instrument (FROZEN under docs/BODY_TRANSFER_PLAN_V3.md).
// N-body only, 3 anchor configs (l=0 control + l=.02/.08), 4 histories x 6 arms,
// 17-probe pressure batteries, alignment readout cos(w_C,w_A). No banks spent
// here beyond the single 32-seed dev bank; no qual seeds touched.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {join,dirname,resolve,relative,sep} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {runTastePressureBattery} from '../learning/taste-pressure.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_PROBE_OP_CAP,BT_BYTE_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS,BT_OUTPUT_BYTES} from './body-transfer.mjs';

export const DEV_EXPERIMENT='body-transfer-v3-dev';
export const DEV_HISTORIES=4, DEV_LAMBDAS=Object.freeze([0,0.02,0.08]), DEV_ARMS=Object.freeze(
  ['candidate','unlearned','frozen','reset','acceptCruise','acceptStationary']);
// Plan text said 68 probes/config (17x4) but the frozen pressure battery is 12
// probes + sham = 13 executions/history (V2 per-body 17 = 13 + 4 early-A/B,
// which Phase D omits). Corrected expectation: 3x4x13 = 156 probes,
// 228 executions total, still under the frozen 276/90e9 ceilings.
export const DEV_EXPECT_MAINS=72, DEV_EXPECT_PROBES=156;
export const DEV_AGG_OP_CAP=90_000_000_000, DEV_MU=1e-3;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function devExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/body-transfer-dev.mjs','docs/BODY_TRANSFER_PLAN_V3.md']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function bodyTransferDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
  };
  for(const name of ['scripts/body-transfer-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','tests/taste-anchor.test.mjs','docs/BODY_TRANSFER_PLAN_V3.md'])visit(resolve(root,name));
  return found;
}
export function bodyTransferDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,DEV_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of devExtraTokens())excluded.add(t);
  const used=new Set(excluded),fresh=()=>{let s;do{s=randomBytes(4).readUInt32BE();}while(!s||used.has(s));used.add(s);return s;};
  const histories=Array.from({length:DEV_HISTORIES},()=>({seed:fresh(),cueSeed:fresh(),
    resourceSeeds:Array.from({length:4},fresh),probeSeeds:{A:fresh(),B:fresh(),transfer:fresh()}}));
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,DEV_HISTORIES*9,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:DEV_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'V3 Phase-D dev bank (32 fresh + 4 probe-transfer = 36 unique). First use is the single dev run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
export function tasteAlignment(atA,atC){
  const A=Object.values(atA.state.learners).filter(l=>!l.dead),C=Object.values(atC.state.learners);
  const byId=new Map(C.map(l=>[l.agentId,l]));let sum=0,n=0;
  for(const la of A){const lc=byId.get(la.agentId);if(!lc||lc.dead)continue;
    const w=la.weights.taste,s=lc.weights.taste;
    const nn=Math.sqrt(w.reduce((x,v)=>x+v*v,0)*s.reduce((x,v)=>x+v*v,0));
    if(!(nn>0))continue;sum+=w.reduce((x,v,j)=>x+v*s[j],0)/nn;n++;}
  return {cos:n?sum/n:NaN,n};
}
export function devGoNoGo(perLambda){
  // perLambda: {lambda, meanAret, meanBret, meanLevel, meanAlign}; control is lambda 0.
  const control=perLambda.find(p=>p.lambda===0);assert.ok(control);
  const best=[...perLambda].filter(p=>p.lambda>0).sort((a,b)=>b.meanAret-a.meanAret)[0];
  const dA=best.meanAret-control.meanAret,dB=best.meanBret-control.meanBret,
    dL=best.meanLevel-control.meanLevel,alignUp=best.meanAlign>control.meanAlign;
  const go=dA>=0.15&&dB>=-0.10&&dL>=-0.20&&alignUp;
  return {bestLambda:best.lambda,dA,dB,dL,alignUp,go,verdict:go?'DEV-GO':'DEV-NOGO'};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runBodyTransferDev({bankPath,output,resume=false}){
  const sources=bodyTransferDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=bodyTransferDevBank(bankPathAbs);
  assert.equal(p.histories.length,DEV_HISTORIES);
  let rows=[],ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0},runtimes={},redone=[];
  if(existsSync(join(outputAbs,'dev-results.json'))&&!resume)throw new Error(`Dev output already exists; preserve it: ${outputAbs}`);
  mkdirSync(join(outputAbs,'rows'),{recursive:true});mkdirSync(join(outputAbs,'anchors'),{recursive:true});
  if(resume){
    rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
    const l=read(join(outputAbs,'ledger.json'));ledger=l.ledger;runtimes=l.runtimes;redone=l.redone;
  }else{
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(dirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)),{flag:'wx'});}
    write(join(outputAbs,'protocol.json'),p);
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'body-transfer-v3-dev-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},anchorRate:DEV_MU,lambdas:[...DEV_LAMBDAS],arms:[...DEV_ARMS],
      caps:{aggregateScalarOperations:DEV_AGG_OP_CAP},scope:'V3 Phase-D single dev run. No tuning on qual seeds; go-bar decides.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=DEV_AGG_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const lambda of DEV_LAMBDAS){
    const tag=`lambda-${lambda}`;
    const {wall,cpuS}=timed(tag,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.lambda===lambda);
        if(row&&Object.keys(row.arms).length===DEV_ARMS.length&&Object.keys(row.probes).length===12){
          console.log(JSON.stringify({stage:'skip',lambda,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${tag}`);
        row=row??{history:{seed:history.seed},lambda,arms:{},probes:{}};
        const learnerOptions={...BT_LEARNER_OPTIONS,slowAnchorRate:DEV_MU,slowAnchorStrength:lambda};
        for(const arm of DEV_ARMS){
          const run=new TasteExperiment({history,arm,learnerOptions:{...learnerOptions},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING}});
          run.advance(BT_TICKS);
          const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${arm}/${history.seed}`);
          row.arms[arm]={endpoint};note(1,0,BT_TICKS,endpoint.scalarOperations);
          if(arm==='candidate'){
            writeOver(join(outputAbs,'anchors',tag,`${history.seed}-A.json`),run.atA);
            writeOver(join(outputAbs,'anchors',tag,`${history.seed}-C.json`),run.atC);
          }
          console.log(JSON.stringify({stage:'world',lambda,seed:history.seed,arm,energy:endpoint.budgetAdjustedEnergyPerFounder}));
        }
        const atC=read(join(outputAbs,'anchors',tag,`${history.seed}-C.json`));
        const atA=read(join(outputAbs,'anchors',tag,`${history.seed}-A.json`));
        const pressure=runTastePressureBattery(atC,history,{founders:BT_FOUNDERS,ticks:256});
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
  assert.deepEqual(bodyTransferDevSources(),sources,'Sources changed during dev run');
  const perLambda=DEV_LAMBDAS.map(lambda=>{
    const rs=rows.filter(r=>r.lambda===lambda);assert.equal(rs.length,DEV_HISTORIES);
    const aret=rs.map(r=>r.probes['A:current'].value-0.95*r.probes['A:A'].value-0.05*r.probes['A:reset'].value);
    const bret=rs.map(r=>r.probes['B:current'].value-0.95*r.probes['B:B'].value-0.05*r.probes['B:reset'].value);
    const lvl=rs.map(r=>r.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-r.arms.unlearned.endpoint.budgetAdjustedEnergyPerFounder);
    const mean=a=>a.reduce((x,v)=>x+v,0)/a.length;
    return {lambda,meanAret:mean(aret),meanBret:mean(bret),meanLevel:mean(lvl),meanAlign:mean(rs.map(r=>r.alignment.cos))};
  });
  const decision=devGoNoGo(perLambda);
  assert.equal(ledger.mains,DEV_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,DEV_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{perLambda,decision,ledger,runtimes,redone});
  return {perLambda,decision,ledger};
}
export function rescoreBodyTransferDev({bankPath,output}){
  // Analytic-only completion: zero worlds, zero bank contact. Reads completed
  // rows/anchors/ledger from disk, recomputes alignment + verdict, writes
  // dev-results.json. Used after the count-constant correction (execution
  // logic identical; only terminal asserts changed).
  const outputAbs=resolve(output);
  const attempt=read(join(outputAbs,'attempt.json'));
  const rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
  assert.equal(rows.length,DEV_LAMBDAS.length*DEV_HISTORIES);
  const ledger=read(join(outputAbs,'ledger.json')).ledger;
  assert.equal(ledger.mains,DEV_EXPECT_MAINS);assert.equal(ledger.probes,DEV_EXPECT_PROBES);
  const perLambda=DEV_LAMBDAS.map(lambda=>{
    const rs=rows.filter(r=>r.lambda===lambda);assert.equal(rs.length,DEV_HISTORIES);
    const aret=rs.map(r=>r.probes['A:current'].value-0.95*r.probes['A:A'].value-0.05*r.probes['A:reset'].value);
    const bret=rs.map(r=>r.probes['B:current'].value-0.95*r.probes['B:B'].value-0.05*r.probes['B:reset'].value);
    const lvl=rs.map(r=>r.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-r.arms.unlearned.endpoint.budgetAdjustedEnergyPerFounder);
    const mean=a=>a.reduce((x,v)=>x+v,0)/a.length;
    return {lambda,meanAret:mean(aret),meanBret:mean(bret),meanLevel:mean(lvl),meanAlign:mean(rs.map(r=>r.alignment.cos))};
  });
  const decision=devGoNoGo(perLambda);
  writeOver(join(outputAbs,'dev-results.json'),{perLambda,decision,ledger,
    executionSources:attempt.sourceSha256,scoringSources:bodyTransferDevSources(),
    correction:'Count constants corrected post-execution (204->156 probes, 228 total); execution logic untouched.'});
  return {perLambda,decision,ledger};
}
const args=Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]&&!arr[i+1].startsWith('--')?arr[i+1]:true]:[]).filter(x=>x.length));
if(args.bank&&args.output&&(args.rescore===true||args.rescore==='true'))rescoreBodyTransferDev({bankPath:args.bank,output:args.output});
else if(args.bank&&args.output)runBodyTransferDev({bankPath:args.bank,output:args.output,resume:args.resume===true||args.resume==='true'});
