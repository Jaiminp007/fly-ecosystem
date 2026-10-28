// Motor-anchor Phase-D dev instrument (FROZEN under docs/MOTOR_ANCHOR_PLAN_V1.md).
// N-body only, 3 motor-anchor configs (l=0 control + l=.02/.08), 4 histories x
// 6 arms, 12-probe pressure batteries + actor-margin/block logging riding the
// same executions, actor alignment cos(actor_C, actor_A). No banks spent here
// beyond the single 36-seed dev bank; no qual seeds touched.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,dirname,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {runTastePressureBattery} from '../learning/taste-pressure.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_PROBE_OP_CAP,BT_BYTE_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS,BT_OUTPUT_BYTES} from './body-transfer.mjs';

export const M_EXPERIMENT='motor-anchor-dev';
export const M_HISTORIES=4, M_LAMBDAS=Object.freeze([0,0.02,0.08]), M_ARMS=Object.freeze(
  ['candidate','unlearned','frozen','reset','acceptCruise','acceptStationary']);
export const M_EXPECT_MAINS=72, M_EXPECT_PROBES=156;
export const M_AGG_OP_CAP=90_000_000_000, M_MU=1e-3;
// Spent synthetic fixture seeds (probe-emit plumbing check 2026-10-28: one
// 8-tick synthetic main; anchor null, assert path only). Union-excluded from
// all future banks via motorExtraTokens. No bank contact, no verdict impact.
export const SPENT_FIXTURE_SEEDS=Object.freeze([379001,379002,379003,379004,379005,379006,379007,379008,379009]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function motorExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/motor-anchor-dev.mjs','docs/MOTOR_ANCHOR_PLAN_V1.md','tests/motor-anchor.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function motorAnchorDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/motor-anchor-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','tests/motor-anchor.test.mjs','docs/MOTOR_ANCHOR_PLAN_V1.md'])visit(resolve(root,name));
  return found;
}
export function motorAnchorDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,M_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of motorExtraTokens())excluded.add(t);
  for(const s of SPENT_FIXTURE_SEEDS)excluded.add(s);
  const used=new Set(excluded),fresh=()=>{let s;do{s=randomBytes(4).readUInt32BE();}while(!s||used.has(s));used.add(s);return s;};
  const histories=Array.from({length:M_HISTORIES},()=>({seed:fresh(),cueSeed:fresh(),
    resourceSeeds:Array.from({length:4},fresh),probeSeeds:{A:fresh(),B:fresh(),transfer:fresh()}}));
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,M_HISTORIES*9,'Dev bank draws must be 36 unique seeds');
  const p={schema:1,experiment:M_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'Motor-anchor Phase-D dev bank (32 fresh + 4 probe-transfer = 36 unique). First use is the single dev run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Block of the dominant motor feature slice (16-wide blocks; ecology=96).
// Returns -1 when phi is all zero (no update-bearing decision).
export function blockOf(phi){
  let best=-1,bestMass=0;
  for(let b=0;b<phi.length/16;b++){
    let mass=0;for(let j=b*16;j<(b+1)*16&&j<phi.length;j++)mass+=Math.abs(phi[j]);
    if(mass>bestMass){bestMass=mass;best=b;}
  }
  return best;
}
// Margin/block collector. Feed wrapped battery events ({probe,event}) or raw
// main-run events; splits motor-progress records by probe key or by phase.
export function collectMarginEvents(){
  const perProbe={},perPhase={};
  const emit=wrapped=>{
    const tag=wrapped.probe!==undefined?wrapped:null;
    const e=tag?tag.event:wrapped;
    if(e.type!=='update'||!e.event||e.event.type!=='motor-progress')return;
    const r=e.event.record;if(!r||r.cruise!==true)return;
    const margin=Math.abs(r.baseProbability-0.5),block=blockOf(r.phi??[]);
    const key=tag?tag.probe:'main';
    (perProbe[key]??={n:0,marginSum:0,near:0,blocks:{},events:[]});const s=perProbe[key];
    s.n++;s.marginSum+=margin;if(margin<0.1)s.near++;
    if(block>=0)s.blocks[block]=(s.blocks[block]??0)+1;
    if(!tag)s.events.push({tick:r.tick,block});
  };
  // Partition main-run cruise events into phases using phase-end tick bounds
  // [{phase,tick}]. Descriptive only (H1m shared-block check).
  const attributeMain=bounds=>{
    const out={};
    for(const ev of (perProbe.main??{events:[]}).events){
      const b=bounds.find(b=>ev.tick<=b.tick)??bounds[bounds.length-1];
      const phase=b?b.phase:'unknown';
      (out[phase]??={n:0,blocks:{}});out[phase].n++;
      if(ev.block>=0)out[phase].blocks[ev.block]=(out[phase].blocks[ev.block]??0)+1;
    }
    return out;
  };
  const summarize=s=>s.n?{n:s.n,meanMargin:s.marginSum/s.n,threshFrac:s.near/s.n,blocks:s.blocks}:{n:0,meanMargin:NaN,threshFrac:NaN,blocks:{}};
  return {emit,perProbe,perPhase,summarize,attributeMain};
}
export function actorAlignment(atA,atC){
  const A=Object.values(atA.state.learners).filter(l=>!l.dead),C=Object.values(atC.state.learners);
  const byId=new Map(C.map(l=>[l.agentId,l]));let sum=0,n=0;
  for(const la of A){const lc=byId.get(la.agentId);if(!lc||lc.dead)continue;
    const w=la.weights.actor,s=lc.weights.actor;
    const nn=Math.sqrt(w.reduce((x,v)=>x+v*v,0)*s.reduce((x,v)=>x+v*v,0));
    if(!(nn>0))continue;sum+=w.reduce((x,v,j)=>x+v*s[j],0)/nn;n++;}
  return {cos:n?sum/n:NaN,n};
}
export function motorGoNoGo(perLambda){
  // perLambda: {lambda, meanAret, meanBret, meanLevel, meanAlign,
  //   meanMargin, meanThreshFrac}; control is lambda 0.
  const control=perLambda.find(p=>p.lambda===0);assert.ok(control);
  const best=[...perLambda].filter(p=>p.lambda>0).sort((a,b)=>b.meanAret-a.meanAret)[0];
  const dA=best.meanAret-control.meanAret,dB=best.meanBret-control.meanBret,
    dL=best.meanLevel-control.meanLevel,alignUp=best.meanAlign>control.meanAlign,
    marginOk=(best.meanMargin-control.meanMargin)>=-0.05,
    threshOk=(best.meanThreshFrac-control.meanThreshFrac)<=0.05;
  const go=dA>=0.15&&dB>=-0.10&&dL>=-0.20&&alignUp&&marginOk&&threshOk;
  return {bestLambda:best.lambda,dA,dB,dL,alignUp,marginOk,threshOk,go,verdict:go?'DEV-GO':'DEV-NOGO'};
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runMotorAnchorDev({bankPath,output,resume=false}){
  const sources=motorAnchorDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=motorAnchorDevBank(bankPathAbs);
  assert.equal(p.histories.length,M_HISTORIES);
  let rows=[],ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0},runtimes={},redone=[];
  if(existsSync(join(outputAbs,'dev-results.json'))&&!resume)throw new Error(`Dev output already exists; preserve it: ${outputAbs}`);
  mkdirSync(join(outputAbs,'rows'),{recursive:true});mkdirSync(join(outputAbs,'anchors'),{recursive:true});
  if(resume){
    rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
    const l=read(join(outputAbs,'ledger.json'));ledger=l.ledger;runtimes=l.runtimes;redone=l.redone;
  }else{
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(pathDirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)),{flag:'wx'});}
    write(join(outputAbs,'protocol.json'),p);
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'motor-anchor-dev-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},anchorRate:M_MU,lambdas:[...M_LAMBDAS],arms:[...M_ARMS],
      caps:{aggregateScalarOperations:M_AGG_OP_CAP},scope:'Motor-anchor Phase-D single dev run. No tuning on qual seeds; go-bar decides.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=M_AGG_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const lambda of M_LAMBDAS){
    const tag=`lambda-${lambda}`;
    const {wall,cpuS}=timed(tag,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.lambda===lambda);
        if(row&&Object.keys(row.arms).length===M_ARMS.length&&Object.keys(row.probes).length===12){
          console.log(JSON.stringify({stage:'skip',lambda,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${tag}`);
        row=row??{history:{seed:history.seed},lambda,arms:{},probes:{},blocks:{},margins:{}};
        const learnerOptions={...BT_LEARNER_OPTIONS,motorAnchorRate:M_MU,motorAnchorStrength:lambda};
        for(const arm of M_ARMS){
          const collector=arm==='candidate'?collectMarginEvents():null;
          const run=new TasteExperiment({history,arm,learnerOptions:{...learnerOptions},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector?collector.emit:null});
          run.advance(BT_TICKS);
          const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${arm}/${history.seed}`);
          row.arms[arm]={endpoint};note(1,0,BT_TICKS,endpoint.scalarOperations);
          if(arm==='candidate'){
            writeOver(join(outputAbs,'anchors',tag,`${history.seed}-A.json`),run.atA);
            writeOver(join(outputAbs,'anchors',tag,`${history.seed}-C.json`),run.atC);
            const bounds=run.phaseRows.map(r=>({phase:r.phase,tick:r.tick}));
            row.blocks={bounds,perPhase:collector.attributeMain(bounds)};
          }
          console.log(JSON.stringify({stage:'world',lambda,seed:history.seed,arm,energy:endpoint.budgetAdjustedEnergyPerFounder}));
        }
        const atC=read(join(outputAbs,'anchors',tag,`${history.seed}-C.json`));
        const atA=read(join(outputAbs,'anchors',tag,`${history.seed}-A.json`));
        const probeCollector=collectMarginEvents();
        const pressure=runTastePressureBattery(atC,history,{founders:BT_FOUNDERS,ticks:256,emit:probeCollector.emit});
        for(const [k,probe] of Object.entries(pressure.probes)){row.probes[k]=probe;note(0,1,256,probe.endpoint.additionalScalarOperations);}
        note(0,1,256,pressure.sham.endpoint.additionalScalarOperations);
        for(const [k,s] of Object.entries(probeCollector.perProbe))row.margins[k]=probeCollector.summarize(s);
        row.alignment=actorAlignment(atA,atC);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
        checkpointLedger();
      }
    });
    runtimes[tag]={wall,cpuS};checkpointLedger();
  }
  assert.deepEqual(motorAnchorDevSources(),sources,'Sources changed during dev run');
  const perLambda=M_LAMBDAS.map(lambda=>{
    const rs=rows.filter(r=>r.lambda===lambda);assert.equal(rs.length,M_HISTORIES);
    const aret=rs.map(r=>r.probes['A:current'].value-0.95*r.probes['A:A'].value-0.05*r.probes['A:reset'].value);
    const bret=rs.map(r=>r.probes['B:current'].value-0.95*r.probes['B:B'].value-0.05*r.probes['B:reset'].value);
    const lvl=rs.map(r=>r.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-r.arms.unlearned.endpoint.budgetAdjustedEnergyPerFounder);
    const aCur=rs.map(r=>r.margins['A:current']??{n:0,meanMargin:NaN,threshFrac:NaN});
    const mean=a=>a.reduce((x,v)=>x+v,0)/a.length;
    return {lambda,meanAret:mean(aret),meanBret:mean(bret),meanLevel:mean(lvl),meanAlign:mean(rs.map(r=>r.alignment.cos)),
      meanMargin:mean(aCur.map(m=>m.meanMargin)),meanThreshFrac:mean(aCur.map(m=>m.threshFrac))};
  });
  const decision=motorGoNoGo(perLambda);
  assert.equal(ledger.mains,M_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,M_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{perLambda,decision,ledger,runtimes,redone});
  return {perLambda,decision,ledger};
}
export function rescoreMotorAnchorDev({bankPath,output}){
  // Analytic-only completion: zero worlds, zero bank contact.
  const outputAbs=resolve(output);
  const attempt=read(join(outputAbs,'attempt.json'));
  const rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
  assert.equal(rows.length,M_LAMBDAS.length*M_HISTORIES);
  const ledger=read(join(outputAbs,'ledger.json')).ledger;
  assert.equal(ledger.mains,M_EXPECT_MAINS);assert.equal(ledger.probes,M_EXPECT_PROBES);
  const perLambda=M_LAMBDAS.map(lambda=>{
    const rs=rows.filter(r=>r.lambda===lambda);assert.equal(rs.length,M_HISTORIES);
    const aret=rs.map(r=>r.probes['A:current'].value-0.95*r.probes['A:A'].value-0.05*r.probes['A:reset'].value);
    const bret=rs.map(r=>r.probes['B:current'].value-0.95*r.probes['B:B'].value-0.05*r.probes['B:reset'].value);
    const lvl=rs.map(r=>r.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-r.arms.unlearned.endpoint.budgetAdjustedEnergyPerFounder);
    const aCur=rs.map(r=>r.margins['A:current']??{n:0,meanMargin:NaN,threshFrac:NaN});
    const mean=a=>a.reduce((x,v)=>x+v,0)/a.length;
    return {lambda,meanAret:mean(aret),meanBret:mean(bret),meanLevel:mean(lvl),meanAlign:mean(rs.map(r=>r.alignment.cos)),
      meanMargin:mean(aCur.map(m=>m.meanMargin)),meanThreshFrac:mean(aCur.map(m=>m.threshFrac))};
  });
  const decision=motorGoNoGo(perLambda);
  writeOver(join(outputAbs,'dev-results.json'),{perLambda,decision,ledger,
    executionSources:attempt.sourceSha256,scoringSources:motorAnchorDevSources()});
  return {perLambda,decision,ledger};
}
const args=Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]&&!arr[i+1].startsWith('--')?arr[i+1]:true]:[]).filter(x=>x.length));
if(args.bank&&args.output&&(args.rescore===true||args.rescore==='true'))rescoreMotorAnchorDev({bankPath:args.bank,output:args.output});
else if(args.bank&&args.output)runMotorAnchorDev({bankPath:args.bank,output:args.output,resume:args.resume===true||args.resume==='true'});
