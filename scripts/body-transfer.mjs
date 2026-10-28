// Frozen Option A body-transfer study (docs/BODY_TRANSFER_PLAN_V1.md).
// Single authorized attempt. No tuning knobs, no variants, no exploratory scope.
// Worlds: 104 mains x 1792 ticks + 336 probes x 256 ticks = 440 executions.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,statSync} from 'node:fs';
import {dirname,resolve,relative,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {digest} from '../learning/intervention-study.mjs';
import {encodedStateBytes} from '../learning/sarsa-experiment.mjs';
import {TasteExperiment,runTasteProbe} from '../learning/taste-experiment.mjs';
import {runTastePressureBattery} from '../learning/taste-pressure.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const write=(file,value)=>{mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const mean=xs=>xs.reduce((n,v)=>n+v,0)/xs.length;

export const BODY_TRANSFER_EXPERIMENT='body-transfer-optionA-v1';
export const OPERATION_ENERGY=5e-6/17, BYTE_ENERGY_PER_SECOND=1e-5/(17*8);
export const BT_TICKS=1792, BT_FOUNDERS=24, BT_HISTORIES=8;
export const BT_ARMS=Object.freeze(['candidate','unlearned','frozen','reset','acceptCruise','acceptStationary']);
export const BT_DIRECT_SPECS=Object.freeze([
  ['A','current'],['A','reset'],['B','current'],['B','reset'],
  ['transfer','current'],['transfer','reset'],['transfer','acceptCruise'],['transfer','acceptStationary']
].map(([family,version])=>Object.freeze({family,version})));
export const BT_MAIN_OP_CAP=1_000_000_000, BT_PROBE_OP_CAP=100_000_000, BT_BYTE_CAP=65_536;
export const BT_AGG_OP_CAP=137_600_000_000;
export const BT_ROW_WALL_SECONDS=600, BT_ROW_CPU_SECONDS=600, BT_OUTPUT_BYTES=8*1024*1024*1024;
export const BT_LEARNER_OPTIONS=Object.freeze({feedingRule:'greedy',tasteRepresentation:'orthogonal',tasteRate:1,
  motorRepresentation:'ecology',holdTicks:1,motorRule:'progress',renewalRate:.1,capacity:32,recent:8,
  replayPasses:4,replayStrata:1,replayRate:1,replayTournament:1,greedyInference:true,criticWarmStart:false,
  tasteLearning:true,normalizeMotor:true,cueBlind:false,consolidationRate:0,motorConsolidationRate:0,
  streams:1,streamHysteresis:0,surpriseGain:0,surpriseWindow:0,phaseSlots:1,slotRate:.05,
  marginWidth:0,marginBoost:0,replaySkip:0,replaySurpriseGain:0,evictBias:0});
export const BT_PRICING=Object.freeze({operationEnergy:OPERATION_ENERGY,byteEnergyPerSecond:BYTE_ENERGY_PER_SECOND});

function walk(directory,visit,maxBytes=5*1024*1024){
  if(!existsSync(directory))return;
  for(const item of readdirSync(directory,{withFileTypes:true})){
    const path=join(directory,item.name);
    if(item.isDirectory())walk(path,visit,maxBytes);
    else if(item.isFile()&&(statSync(path).size<=maxBytes))visit(path,item.name);
  }
}
function visitSeedKeys(value,key,into){
  if(Array.isArray(value))for(const x of value)visitSeedKeys(x,key,into);
  else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))visitSeedKeys(v,/seed/i.test(k)?k:key,into);
  else if(/seed/i.test(key)&&Number.isInteger(value)&&value>0&&value<=0xffffffff)into.add(value);
}
function visitTokens(bytes,into){
  for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
    const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
  }
}
export function bodyTransferExclusions(){
  const excluded=new Set([41,...Array.from({length:512},(_,i)=>250001+i),...Array.from({length:512},(_,i)=>252001+i),...Array.from({length:3072},(_,i)=>253001+i)]);
  const registries=[],engineering=[],handoffSources=[];
  walk(join(root,'evidence'),(file,name)=>{
    if(!name.endsWith('.json'))return;const bytes=readFileSync(file);
    visitSeedKeys(JSON.parse(bytes.toString()),'',excluded);
    if(name==='protocol.json')registries.push({path:relative(root,file).split(sep).join('/'),sha256:digest(bytes)});
  });
  walk(join(root,'handoff'),(file,name)=>{
    if(!name.endsWith('.json'))return;const bytes=readFileSync(file);
    try{visitSeedKeys(JSON.parse(bytes.toString()),'',excluded);}catch{/* non-JSON manifest; tokens only */}
    visitTokens(bytes,excluded);handoffSources.push({path:relative(root,file).split(sep).join('/'),sha256:digest(bytes)});
  });
  for(const name of readdirSync(join(root,'tests'))){
    if(!name.endsWith('.mjs'))continue;const file=join(root,'tests',name),bytes=readFileSync(file);
    visitTokens(bytes,excluded);engineering.push({path:`tests/${name}`,sha256:digest(bytes)});
  }
  for(const name of ['scripts/body-transfer.mjs']){
    const file=join(root,name),bytes=readFileSync(file);
    visitTokens(bytes,excluded);engineering.push({path:name,sha256:digest(bytes)});
  }
  return {excluded,registries,engineering,handoffSources};
}
export function bodyTransferBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,BODY_TRANSFER_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  const used=new Set(excluded),fresh=()=>{let s;do{s=randomBytes(4).readUInt32BE();}while(!s||used.has(s));used.add(s);return s;};
  const histories=Array.from({length:BT_HISTORIES},()=>({seed:fresh(),cueSeed:fresh(),
    resourceSeeds:Array.from({length:4},fresh),probeSeeds:{A:fresh(),B:fresh(),transfer:fresh()}}));
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,BT_HISTORIES*9,'Bank draws must be 72 unique seeds');
  const p={schema:1,experiment:BODY_TRANSFER_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'Frozen Option A body-transfer study bank. First use is the single authorized attempt; any exposure spends it. No hand-selection, no geometry screen, no outcome peek.'};
  write(path,p);return p;
}
export function bodyTransferSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
  };
  for(const name of ['scripts/body-transfer.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/pursuit-authority.mjs','learning/taste-pressure.mjs','tests/body-transfer.test.mjs',
    'tests/taste-experiment.test.mjs','tests/taste-energy.test.mjs','docs/BODY_TRANSFER_PLAN_V1.md'])visit(resolve(root,name));
  return found;
}
export const settledValue=(V,pendingEnd,pendingStart)=>V-OPERATION_ENERGY*(pendingEnd-pendingStart)/BT_FOUNDERS;
const pendingOf=endpoint=>endpoint.scalarOperations-(endpoint.operationsBilled??0);

function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(Math.abs(endpoint.incurredEnergy-endpoint.paidEnergy-endpoint.outstandingEnergy)<1e-8,`${label}: debt reconciliation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
function checkProbeIntegrity(row,label){
  const e=row.endpoint;
  assert.ok(Math.abs(e.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(Math.abs(e.incurredEnergy-e.paidEnergy-e.outstandingEnergy)<1e-8,`${label}: debt reconciliation failed`);
  assert.ok(e.additionalScalarOperations<=BT_PROBE_OP_CAP,`${label}: probe op ceiling breached`);
}
function maxBytesFor(run){
  return Math.max(...Object.values(run.learners).map(encodedStateBytes));
}
function runMain(history,arm,body,emit=null){
  const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},
    cruiseSpeed:0,body,pricing:{...BT_PRICING},emit});
  run.advance(BT_TICKS);
  const endpoint=run.endpoint();
  checkMainIntegrity(endpoint,`${body}/${arm}/${history.seed}`);
  const bytes=maxBytesFor(run);
  assert.ok(bytes<=BT_BYTE_CAP*BT_FOUNDERS,`${body}/${arm}/${history.seed}: byte ceiling breached`);
  assert.equal(endpoint.founders,BT_FOUNDERS);
  return {run,endpoint,bytes};
}
function runProbe(anchor,{family,version,seed,body=null}){
  const row=runTasteProbe(anchor,{family,version,seed,founders:BT_FOUNDERS,ticks:256,body});
  checkProbeIntegrity(row,`${body??'N'}/${family}:${version}/${seed}`);
  return row;
}

export function scoreBodyTransfer(rows){
  assert.equal(rows.length,BT_HISTORIES);
  const perHistory=rows.map(row=>{
    const out={seed:row.history.seed,bodies:{},direct:{},gates:{}};
    for(const body of ['N','P']){
      const A=row[body].arms,cand=A.candidate.endpoint;
      const V=a=>A[a].endpoint.budgetAdjustedEnergyPerFounder;
      const Vs=a=>settledValue(V(a),pendingOf(A[a].endpoint),0);
      const P=row[body].probes,v=k=>P[k].value;
      const vs=k=>settledValue(v(k),pendingOf(P[k].endpoint),P[k].startPending);
      const L=V('candidate')-V('unlearned'),F=V('candidate')-V('frozen'),Z=V('candidate')-V('reset');
      const Ls=Vs('candidate')-Vs('unlearned'),Fs=Vs('candidate')-Vs('frozen'),Zs=Vs('candidate')-Vs('reset');
      const skills={},skillsS={};
      for(const settled of [false,true]){
        const val=settled?vs:v,s=settled?skillsS:skills;
        s.aSkill=val('A:A')-val('A:reset');s.bSkill=val('B:B')-val('B:reset');
        s.bAcquisition=val('B:B')-val('B:A');
        s.aRetention=val('A:current')-.95*val('A:A')-.05*val('A:reset');
        s.bRetention=val('B:current')-.95*val('B:B')-.05*val('B:reset');
        s.transfer=val('transfer:current')-val('transfer:reset');
      }
      const surv=a=>A[a].endpoint.survivors, psurv=k=>P[k].survivors;
      out.bodies[body]={L,F,Z,Ls,Fs,Zs,...skills,
        survL:surv('candidate')-surv('unlearned'),survF:surv('candidate')-surv('frozen'),survZ:surv('candidate')-surv('reset'),
        survTransfer:psurv('transfer:current')-psurv('transfer:reset'),
        survA:psurv('A:current')-psurv('A:A'),survB:psurv('B:current')-psurv('B:B')};
    }
    for(const f of ['A','B']){
      const KN=row.N.probes[`${f}:current`].value-row.N.probes[`${f}:reset`].value;
      const KX=row.direct[`${f}:current`].value-row.direct[`${f}:reset`].value;
      const KNsurv=row.N.probes[`${f}:current`].survivors-row.N.probes[`${f}:reset`].survivors;
      const KXsurv=row.direct[`${f}:current`].survivors-row.direct[`${f}:reset`].survivors;
      const KXNsurv=row.direct[`${f}:current`].survivors-row.N.probes[`${f}:current`].survivors;
      const Td=row.direct['transfer:current'].value-row.direct['transfer:reset'].value;
      const Tdsurv=row.direct['transfer:current'].survivors-row.direct['transfer:reset'].survivors;
      out.direct[f]={KN,KX,diff:KX-KN,KNsurv,KXsurv,KXNsurv};
      if(f==='A')out.direct.transfer={T:Td,surv:Tdsurv};
    }
    return out;
  });
  const col=(f)=>perHistory.map(h=>f(h));
  const g={};
  for(const body of ['N','P']){
    const L=col(h=>h.bodies[body].L),Ls=col(h=>h.bodies[body].Ls);
    const F=col(h=>h.bodies[body].F),Fs=col(h=>h.bodies[body].Fs);
    const Z=col(h=>h.bodies[body].Z),Zs=col(h=>h.bodies[body].Zs);
    const S=bodyKey=>col(h=>h.bodies[body][bodyKey]);
    g[body]={
      g1:{mean:mean(L),settledMean:mean(Ls),positive:L.filter(v=>v>0).length,survivors:S('survL').reduce((a,b)=>a+b,0),
        pass:mean(L)>0&&mean(Ls)>0&&L.filter(v=>v>0).length>=6&&S('survL').reduce((a,b)=>a+b,0)>=0},
      g2:{mean:mean(F),settledMean:mean(Fs),positive:F.filter(v=>v>0).length,survivors:S('survF').reduce((a,b)=>a+b,0),
        pass:mean(F)>0&&mean(Fs)>0&&F.filter(v=>v>0).length>=6&&S('survF').reduce((a,b)=>a+b,0)>=0},
      g3:{mean:mean(Z),settledMean:mean(Zs),count:Z.filter(v=>v>=-1).length,survivors:S('survZ').reduce((a,b)=>a+b,0),
        pass:mean(Z)>=-0.5&&mean(Zs)>=-0.5&&Z.filter(v=>v>=-1).length>=5&&S('survZ').reduce((a,b)=>a+b,0)>=-4},
      g4:{aSkill:mean(S('aSkill')),bSkill:mean(S('bSkill')),bAcquisition:mean(S('bAcquisition')),
        aCount:S('aSkill').filter(v=>v>0).length,bCount:S('bSkill').filter(v=>v>0).length,acqCount:S('bAcquisition').filter(v=>v>0).length,
        pass:mean(S('aSkill'))>0&&mean(S('bSkill'))>0&&mean(S('bAcquisition'))>0&&S('aSkill').filter(v=>v>0).length>=5&&S('bSkill').filter(v=>v>0).length>=6&&S('bAcquisition').filter(v=>v>0).length>=6},
      g5:{aRetention:mean(S('aRetention')),bRetention:mean(S('bRetention')),
        aCount:S('aRetention').filter(v=>v>0).length,bCount:S('bRetention').filter(v=>v>0).length,
        survA:S('survA').reduce((a,b)=>a+b,0),survB:S('survB').reduce((a,b)=>a+b,0),
        pass:mean(S('aRetention'))>0&&mean(S('bRetention'))>0&&S('aRetention').filter(v=>v>0).length>=4&&S('bRetention').filter(v=>v>0).length>=4&&mean(S('aSkill'))>0&&mean(S('bSkill'))>0&&S('survA').reduce((a,b)=>a+b,0)>=-2&&S('survB').reduce((a,b)=>a+b,0)>=-2},
      g6transfer:{mean:mean(S('transfer')),everyMin:Math.min(...S('transfer')),survivors:S('survTransfer').reduce((a,b)=>a+b,0),
        pass:mean(S('transfer'))>=-0.25&&S('transfer').every(v=>v>=-0.5)&&S('survTransfer').reduce((a,b)=>a+b,0)>=-2},
    };
  }
  const dT=col(h=>h.direct.transfer.T);
  const g6direct={mean:mean(dT),everyMin:Math.min(...dT),survivors:col(h=>h.direct.transfer.surv).reduce((a,b)=>a+b,0),
    pass:mean(dT)>=-0.25&&dT.every(v=>v>=-0.5)&&col(h=>h.direct.transfer.surv).reduce((a,b)=>a+b,0)>=-2};
  const g6skill={};
  for(const f of ['A','B']){
    const KX=col(h=>h.direct[f].KX),D=col(h=>h.direct[f].diff);
    g6skill[f]={meanKX:mean(KX),countKX:KX.filter(v=>v>0).length,meanDiff:mean(D),everyDiffMin:Math.min(...D),
      survKX:col(h=>h.direct[f].KXsurv).reduce((a,b)=>a+b,0),survKXN:col(h=>h.direct[f].KXNsurv).reduce((a,b)=>a+b,0),
      pass:mean(KX)>0&&KX.filter(v=>v>0).length>=(f==='A'?5:6)&&mean(D)>=-0.25&&D.every(v=>v>=-0.5)&&col(h=>h.direct[f].KXsurv).reduce((a,b)=>a+b,0)>=-2&&col(h=>h.direct[f].KXNsurv).reduce((a,b)=>a+b,0)>=-2};
  }
  const attenuation={meanLP:mean(col(h=>h.bodies.P.L)),meanLN:mean(col(h=>h.bodies.N.L))};
  attenuation.diff=attenuation.meanLP-attenuation.meanLN;
  const nPass=['g1','g2','g3','g4','g5'].every(k=>g.N[k].pass)&&g.N.g6transfer.pass;
  const pPass=['g1','g2','g3','g4','g5'].every(k=>g.P[k].pass)&&g.P.g6transfer.pass;
  const dPass=g6direct.pass&&g6skill.A.pass&&g6skill.B.pass;
  return {perHistory,g,g6direct,g6skill,attenuation,nPass,pPass,dPass};
}

export function runBodyTransfer({bankPath,output}){
  assert.ok(!existsSync(output),'Attempt output already exists; preserve it');
  const p=read(bankPath);
  assert.equal(p.schema,1);assert.equal(p.experiment,BODY_TRANSFER_EXPERIMENT);
  assert.equal(p.histories.length,BT_HISTORIES);
  for(const h of p.histories){
    assert.ok(Number.isInteger(h.seed)&&h.seed>0&&Number.isInteger(h.cueSeed)&&h.cueSeed>0);
    assert.equal(h.resourceSeeds.length,4);assert.ok(h.resourceSeeds.every(Number.isInteger));
    assert.ok(Number.isInteger(h.probeSeeds.A)&&Number.isInteger(h.probeSeeds.B)&&Number.isInteger(h.probeSeeds.transfer));
  }
  const sources=bodyTransferSources();
  for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
  write(join(output,'protocol.json'),p);
  const attempt={schema:1,kind:'body-transfer-attempt-v1',createdAt:new Date().toISOString(),
    bankSha256:digest(readFileSync(bankPath)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
    learnerOptions:{...BT_LEARNER_OPTIONS},pricing:{...BT_PRICING},cruiseSpeed:0,
    armsN:[...BT_ARMS],armsP:[...BT_ARMS],sharedArm:'nativeFullCruise',
    caps:{mainScalarOperations:BT_MAIN_OP_CAP,probeAdditionalScalarOperations:BT_PROBE_OP_CAP,
      bytesPerFounder:BT_BYTE_CAP,aggregateScalarOperations:BT_AGG_OP_CAP,
      rowWallSeconds:BT_ROW_WALL_SECONDS,rowCpuSeconds:BT_ROW_CPU_SECONDS,outputBytes:BT_OUTPUT_BYTES},
    scope:'Frozen Option A body-transfer single attempt. No tuning, no variants, no second attempt on these seeds.'};
  write(join(output,'attempt.json'),attempt);
  const ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0};
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;};
  const rows=[];
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const runtimes={};
  try{
    for(const [label,bodies] of [['row-N',['N']],['row-P',['P']]]){
      const {out,wall,cpuS}=timed(label,()=>{
        const made=[];
        for(const history of p.histories){
          const row=rows.find(r=>r.history.seed===history.seed)??{history,nondeg:{}};
          const arms={},body=bodies[0];
          let nondegCount=0;
          const emit=body==='P'?e=>{if(e.type==='decision'&&(e.action===0||e.action===1)&&e.outputs[1]===-1)nondegCount++;}:null;
          for(const arm of BT_ARMS){
            const {run,endpoint}=runMain(history,arm,body,arm==='candidate'?emit:null);
            arms[arm]={endpoint};
            if(arm==='candidate'){
              write(join(output,'anchors',body,`${history.seed}-A.json`),run.atA);
              write(join(output,'anchors',body,`${history.seed}-B.json`),run.atB);
              write(join(output,'anchors',body,`${history.seed}-C.json`),run.atC);
              row[body]={arms,probes:{},atCSurvivors:run.phaseRows.find(r=>r.phase==='C').survivors};
            }
            note(1,0,BT_TICKS,endpoint.scalarOperations);
            console.log(JSON.stringify({stage:'world',row:label,seed:history.seed,body,arm,
              energy:endpoint.budgetAdjustedEnergyPerFounder,survivors:endpoint.survivors}));
          }
          if(body==='P')row.nondeg.P=nondegCount;
          const atC=read(join(output,'anchors',body,`${history.seed}-C.json`));
          const pressure=runTastePressureBattery(atC,history,{founders:BT_FOUNDERS,ticks:256});
          for(const [k,probe] of Object.entries(pressure.probes)){row[body].probes[k]=probe;note(0,1,256,probe.endpoint.additionalScalarOperations);}
          note(0,1,256,pressure.sham.endpoint.additionalScalarOperations);
          for(const version of ['current','reset']){
            for(const [anchorName,family] of [['A','A'],['B','B']]){
              const anchorFile=read(join(output,'anchors',body,`${history.seed}-${anchorName}.json`));
              const probe=runProbe(anchorFile,{family,version,seed:history.probeSeeds[family]});
              row[body].probes[`early-${family}:${version}`]=probe;note(0,1,256,probe.endpoint.additionalScalarOperations);
            }
          }
          if(!rows.includes(row))rows.push(row);
          write(join(output,'rows',`${history.seed}.json`),row);
          made.push(row);
        }
        return made;
      });
      runtimes[label]={wall,cpuS};
    }
    const sharedDirect=timed('row-shared-direct',()=>{
      for(const history of p.histories){
        const row=rows.find(r=>r.history.seed===history.seed);
        const {endpoint}=runMain(history,'nativeFullCruise','N');
        row.shared={endpoint};note(1,0,BT_TICKS,endpoint.scalarOperations);
        const atC=read(join(output,'anchors','N',`${history.seed}-C.json`));
        const direct={};
        for(const {family,version} of BT_DIRECT_SPECS){
          const probe=runProbe(atC,{family,version,seed:history.probeSeeds[family],body:'P'});
          const key=`${family}:${version}`;direct[key]=probe;
          assert.equal(probe.startWorldSha256,row.N.probes[key].startWorldSha256,`${key}: native/direct start hash mismatch`);
          note(0,1,256,probe.endpoint.additionalScalarOperations);
        }
        row.direct=direct;
        write(join(output,'rows',`${history.seed}.json`),row);
        console.log(JSON.stringify({stage:'direct',seed:history.seed,energy:direct['transfer:current'].value}));
      }
    });
    runtimes['row-shared-direct']={wall:sharedDirect.wall,cpuS:sharedDirect.cpuS};
    assert.deepEqual(bodyTransferSources(),sources,'Sources changed during attempt');
    assert.ok(ledger.mains===104&&ledger.probes===336,`Execution count mismatch: ${ledger.mains} mains, ${ledger.probes} probes`);
    assert.ok(ledger.scalarOperations<=BT_AGG_OP_CAP,'Aggregate op ceiling breached');
  }catch(error){
    write(join(output,'failure.json'),{at:new Date().toISOString(),error:String(error&&error.stack||error),ledger,runtimes,completedRows:rows.length});
    throw error;
  }
  const score=scoreBodyTransfer(rows);
  const residuals=[];
  let revivalViolations=0;
  const nondegCounts=rows.map(r=>r.nondeg.P??0);
  for(const row of rows){
    for(const body of ['N','P']){
      for(const arm of BT_ARMS)residuals.push(Math.abs(row[body].arms[arm].endpoint.accountingResidual));
      for(const [k,probe] of Object.entries(row[body].probes)){
        residuals.push(Math.abs(probe.endpoint.accountingResidual));
        if(!probe.skippedAllDead&&probe.survivors>row[body].atCSurvivors)revivalViolations++;
      }
    }
    for(const [k,probe] of Object.entries(row.direct)){
      residuals.push(Math.abs(probe.endpoint.accountingResidual));
      if(!probe.skippedAllDead&&probe.survivors>row.N.atCSurvivors)revivalViolations++;
    }
  }
  let outputBytes=0;
  walk(output,file=>{outputBytes+=statSync(file).size;},Number.MAX_SAFE_INTEGER);
  const gate7={maxResidual:Math.max(...residuals),revivalViolations,nondegMin:Math.min(...nondegCounts),outputBytes,
    pass:Math.max(...residuals)<1e-7&&revivalViolations===0&&Math.min(...nondegCounts)>=1&&outputBytes<BT_OUTPUT_BYTES};
  let verdict='INVALID';
  if(gate7.pass){
    if(!score.nPass)verdict='FAIL-source';
    else if(!(score.pPass&&score.dPass))verdict='FAIL-body';
    else verdict='PASS';
  }
  const result={schema:1,kind:'body-transfer-result-v1',bankSha256:attempt.bankSha256,sourceSha256:sources,
    histories:rows.length,ticks:BT_TICKS,ledger,runtimes,verdict,gate7,score,scope:attempt.scope};
  write(join(output,'results.json'),result);
  console.log(JSON.stringify({verdict,attenuation:score.attenuation,gate7:{maxResidual:gate7.maxResidual,revivalViolations,nondegMin:gate7.nondegMin,outputBytes}}));
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  assert.ok(value('--bank'),'Supply --bank');assert.ok(value('--output'),'Supply a new --output directory');
  runBodyTransfer({bankPath:resolve(value('--bank')),output:resolve(value('--output'))});
}
