// GAIN-DOSE Phase-A dev instrument (FROZEN under docs/GAIN_DOSE_PLAN_V1.md).
// Coupled surprise-gain sweep d in {0,0.5,1,2,4} ({surpriseGain:d,
// replaySurpriseGain:3d}; d=1 V1g-identical deployed, d=0 uniform
// reference) x 3 pairs + train + unlearned = 21 mains (BT_TICKS=1792).
// V1i-identical transplant/snapshot/integrity/resume/ledger machinery.
// Per-cue per-third behavior + first-contact ticks (passive; secondary
// timing measurement, non-gating). Scorer: G1 + G0 + G2b +
// G-replication (d=1 beats d=0 by +0.1 on >=2/3 pairs, else INVALID) +
// pooled OLS quadratic HB ~ d with OPTIMAL/ESCALATE/DE-ESCALATE/
// OVERDOSE/FLAT/INDETERMINATE verdicts. Single attempt.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {scoreFlipSplit,agentWork} from './turn-gated-dev-v1i.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const GD_EXPERIMENT='gain-dose-dev';
export const GD_HISTORIES=6;
export const GD_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const GD_DOSES=Object.freeze([0,0.5,1,2,4]);
export const GD_ARMS=Object.freeze(['train','gain-0','gain-0.5','gain-1','gain-2','gain-4','unlearned']);
export const GD_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>422001+j));
const GD_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[421001,421054]];
export const GD_SPENT_SEEDS=Object.freeze([381001,...GD_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const GD_EXPECT_MAINS=21, GD_EXPECT_PROBES=0;
export const GD_OP_CAP=5_000_000_000, GD_WALL_CAP_SECONDS=3600;
export const GD_JOIN_MIN=0.99, GD_TRAIN_GAP=0.5, GD_FLAT_TOL=0.1;
export const GD_REP_GAP=0.1, GD_REP_MIN_PAIRS=2;
export const GD_OVERDOSE_DROP=0.1, GD_FLAT_RANGE=0.05;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

export function gainDoseOpts(d){
  assert.ok(GD_DOSES.includes(d),'unknown dose '+d);
  return Object.freeze({...BT_LEARNER_OPTIONS,surpriseGain:d,replaySurpriseGain:3*d});
}
function gainDoseExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/gain-dose-dev.mjs','docs/GAIN_DOSE_PLAN_V1.md','tests/gain-dose-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function gainDoseDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/gain-dose-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'scripts/turn-gated-dev-v1i.mjs','tests/gain-dose-dev.test.mjs','docs/GAIN_DOSE_PLAN_V1.md'])visit(resolve(root,name));
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
export function gainDoseDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,GD_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of gainDoseExtraTokens())excluded.add(t);
  for(const s of GD_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of GD_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=GD_FIXTURE_SEEDS.length/GD_HISTORIES===9?Array.from({length:GD_HISTORIES},(_,h)=>{
    const s=GD_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,GD_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:GD_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'GAIN-DOSE Phase-A dev bank (deterministic fresh 422001-422054, 9/history, 6 histories). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Transplant trio: V1i-identical.
export function snapshotWeights(learners){
  const out={};
  for(const id of Object.keys(learners)){
    const w=learners[id].weights;
    assert.ok(w&&typeof w==='object','missing weights for agent '+id);
    out[id]={};
    for(const k of Object.keys(w)){
      assert.ok(Array.isArray(w[k]),'non-array weights '+id+'/'+k);
      out[id][k]=[...w[k]];
    }
  }
  return out;
}
export function digestWeights(snapshot){
  const flat=Object.keys(snapshot).sort().map(id=>[id,...Object.keys(snapshot[id]).sort().map(k=>snapshot[id][k])]);
  return digest(JSON.stringify(flat));
}
export function copyWeights(srcSnapshot,dstLearners){
  const ids=Object.keys(srcSnapshot).sort();
  assert.deepEqual(Object.keys(dstLearners).sort(),ids,'founder id mismatch');
  for(const id of ids){
    const dst=dstLearners[id],w=srcSnapshot[id];
    assert.ok(dst&&w&&typeof w==='object','missing agent snapshot '+id);
    for(const k of Object.keys(w)){
      assert.ok(Array.isArray(dst.weights?.[k])&&dst.weights[k].length===w[k].length,'weights shape mismatch '+id+'/'+k);
      dst.weights[k]=[...w[k]];
    }
  }
  return {transferred:ids.length};
}
export function assertFreshTarget(agent,id){
  assert.equal(agent.lastObservedTick,0,'target not fresh (lastObservedTick) '+id);
  assert.equal(agent.lastDecisionTick,0,'target not fresh (lastDecisionTick) '+id);
  assert.ok(Array.isArray(agent.recent)&&agent.recent.length===0&&Array.isArray(agent.older)&&agent.older.length===0,'target not fresh (buffers) '+id);
  assert.ok(agent.motorPending===null,'target not fresh (motorPending) '+id);
}
export function checkTransplantIntegrity(srcSnapshot,dstLearners){
  const violations=[];
  const a=Object.keys(srcSnapshot).sort(),b=Object.keys(dstLearners).sort();
  if(JSON.stringify(a)!==JSON.stringify(b))violations.push('agent-id-set mismatch');
  for(const id of a){
    const s=srcSnapshot[id],d=dstLearners[id];
    if(!d){violations.push('missing agent '+id);continue;}
    if(!s||typeof s!=='object'){violations.push('missing source snapshot '+id);continue;}
    for(const k of Object.keys(s)){
      if(!Array.isArray(d.weights?.[k])||d.weights[k].length!==s[k].length){violations.push('shape mismatch '+id+'/'+k);continue;}
      if(JSON.stringify(d.weights[k])!==JSON.stringify(s[k]))violations.push('value mismatch '+id+'/'+k);
    }
  }
  return {ok:violations.length===0,violations};
}
// Collector: turn-choice thirds + first-contact tick per cue (passive;
// secondary timing measurement, non-gating).
export function collectGainDose(){
  const pending=new Map(),perCue={};
  let decisions=0,joined=0;
  const third=t=>t<BT_TICKS/3?0:t<2*BT_TICKS/3?1:2;
  const emit=e=>{
    if(e.type==='decision'&&e.own){
      decisions++;
      pending.set(`${e.own.tick}:${e.own.agentId}`,{cue:(e.own.cue??[]).join(','),action:e.action,contact:!!e.own.contactPresent,tick:e.own.tick});
    }else if(e.type==='physical'&&e.agentId!==undefined&&e.tick!==undefined){
      const d=pending.get(`${e.tick}:${e.agentId}`);
      if(!d)return;
      pending.delete(`${e.tick}:${e.agentId}`);joined++;
      const b=Number(e.beneficialEaten)||0,h=Number(e.harmfulEaten)||0;
      if(d.contact){
        const s=perCue[d.cue]??={contact:0,pause:0,turn:0,beneficial:0,harmful:0,firstTick:null,
          thirds:[{turn:0,contact:0},{turn:0,contact:0},{turn:0,contact:0}]};
        s.contact++;if(d.action>=2)s.pause++;if(d.action%2===1)s.turn++;
        s.beneficial+=b;s.harmful+=h;
        if(s.firstTick===null||d.tick<s.firstTick)s.firstTick=d.tick;
        const th=s.thirds[third(d.tick)];th.contact++;if(d.action%2===1)th.turn++;
      }
    }
  };
  return {emit,
    summarize:()=>{
      const cues={};
      for(const [cue,s] of Object.entries(perCue))
        cues[cue]={contact:s.contact,pause:s.pause,turn:s.turn,beneficial:s.beneficial,harmful:s.harmful,
          firstTick:s.firstTick,thirds:s.thirds,
          label:s.harmful>s.beneficial?'harmful':(s.beneficial>s.harmful?'beneficial':'tied')};
      return {decisions,joined,joinRate:decisions?joined/decisions:0,cues};
    }};
}
// OLS quadratic fit (pooled dose-response). Returns {a,b,c,peak,r2quad,r2lin}
// or null when degenerate (caller maps to FLAT/INVALID per plan).
export function quadFit(pts){
  const n=pts.length;
  if(n<3)return null;
  let Sx=0,Sx2=0,Sx3=0,Sx4=0,Sy=0,Sxy=0,Sx2y=0;
  for(const [x,y] of pts){Sx+=x;Sx2+=x*x;Sx3+=x*x*x;Sx4+=x*x*x*x;Sy+=y;Sxy+=x*y;Sx2y+=x*x*y;}
  // Normal equations M*[c,b,a]' = [Sy,Sxy,Sx2y]; Cramer on det.
  const M=[[n,Sx,Sx2],[Sx,Sx2,Sx3],[Sx2,Sx3,Sx4]],Y=[Sy,Sxy,Sx2y];
  const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  const D=det(M);
  if(!Number.isFinite(D)||Math.abs(D)<1e-12)return null;
  const rep=(M2,j)=>M2.map((row,i)=>row.map((v,k)=>k===j?Y[i]:v));
  const c=det(rep(M,0))/D,b=det(rep(M,1))/D,a=det(rep(M,2))/D;
  const mean=Sy/n;
  let ss=0,sr=0,srL=0;
  const bx=(Sx2*n-Sx*Sx);const bl=bx!==0?(n*Sxy-Sx*Sy)/ (n*0+bx):0;
  const cl=bx!==0?(Sy-bl*Sx)/n:mean;
  for(const [x,y] of pts){ss+=(y-mean)*(y-mean);const f=a*x*x+b*x+c;sr+=(y-f)*(y-f);const fl=bl*x+cl;srL+=(y-fl)*(y-fl);}
  const r2quad=ss>0?1-sr/ss:null, r2lin=ss>0?1-srL/ss:null;
  return {a:+a.toFixed(6),b:+b.toFixed(6),c:+c.toFixed(6),
    peak:a!==0?+((-b/(2*a)).toFixed(4)):null,r2quad:r2quad===null?null:+r2quad.toFixed(4),r2lin:r2lin===null?null:+r2lin.toFixed(4)};
}
// Pure scorer (exported for fixtures). Rows carry summary (thirds).
// G1 join; G0 train (INCOMPLETE-UNTRAINED); G2b unlearned flat + replication
// (d=1 beats d=0 by +0.1 on >=2/3 pairs) else INVALID; dose verdicts:
// OVERDOSE / ESCALATE / OPTIMAL / DE-ESCALATE / FLAT / INDETERMINATE.
export function scoreGainDose(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  for(const t of GD_ARMS)assert.ok((byTag[t]||[]).length===3,'scorer needs 3 rows per arm, missing '+t);
  const g1=Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=GD_JOIN_MIN));
  const gapOf=r=>{let hT=0,hN=0,bT=0,bN=0;for(const s of Object.values(r.summary.cues)){if(s.label==='harmful'){hT+=s.turn||0;hN+=s.contact;}else if(s.label==='beneficial'){bT+=s.turn||0;bN+=s.contact;}}if(!hN||!bN)return null;return +((hT/hN)-(bT/bN)).toFixed(4);};
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=GD_TRAIN_GAP);
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g2b=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=GD_FLAT_TOL);
  // Per-pair HB per dose via flip-split (V1c metric, V1i-identical import).
  const trSeeds=(byTag.train||[]).map(r=>r.history.seed).sort((a,b)=>a-b);
  const doseOf=tag=>({'gain-0':0,'gain-0.5':0.5,'gain-1':1,'gain-2':2,'gain-4':4}[tag]);
  const hb={};
  for(const tag of GD_ARMS.filter(t=>t.startsWith('gain-'))){
    const teSeeds=(byTag[tag]||[]).map(r=>r.history.seed).sort((a,b)=>a-b);
    hb[tag]=[0,1,2].map(i=>{
      const tr=(byTag.train||[]).find(r=>r.history.seed===trSeeds[i]);
      const te=(byTag[tag]||[]).find(r=>r.history.seed===teSeeds[i]);
      return scoreFlipSplit(tr,te).flippedHB.correctness;
    });
  }
  const repWins=[0,1,2].filter(i=>hb['gain-1'][i]!==null&&hb['gain-0'][i]!==null&&hb['gain-1'][i]-hb['gain-0'][i]>=GD_REP_GAP).length;
  const gRep=repWins>=GD_REP_MIN_PAIRS;
  const pts=[];
  for(const tag of GD_ARMS.filter(t=>t.startsWith('gain-'))){
    const d=doseOf(tag);
    for(const v of hb[tag]){if(v===null)return {g1,g0,g2b,gRep,verdict:'INVALID',reason:'null HB cell',hb,trainGaps,unlearnGaps,repWins,go:false};pts.push([d,v]);}
  }
  const vals=pts.map(p=>p[1]);
  const range=Math.max(...vals)-Math.min(...vals);
  const fit=quadFit(pts);
  const meanDose=d=>{const vs=hb['gain-'+d].filter(v=>v!==null);return vs.reduce((a,b)=>a+b,0)/vs.length;};
  const m0=meanDose(0),m05=meanDose(0.5),m1=meanDose(1),m2=meanDose(2),m4=meanDose(4);
  let verdict,go=false;
  if(!g1)verdict='INVALID';
  else if(!g0)verdict='INCOMPLETE-UNTRAINED';
  else if(!g2b||!gRep)verdict='INVALID';
  else if(fit===null)verdict='INVALID';
  else if(m4<m1-GD_OVERDOSE_DROP)verdict='GAIN-DOSE-OVERDOSE';
  else if(m4-m1>GD_REP_GAP)verdict='GAIN-DOSE-ESCALATE';
  else if(fit.a<0&&fit.peak!==null&&fit.peak>=0.5&&fit.peak<=2.0){verdict='GAIN-DOSE-OPTIMAL';go=true;}
  else if(fit.a<0&&fit.peak!==null&&fit.peak>2.0&&m4>=m2)verdict='GAIN-DOSE-ESCALATE';
  else if((fit.a<0&&fit.peak!==null&&fit.peak<0.5)||m0>=Math.max(m05,m1,m2,m4)-0.05)verdict='GAIN-DOSE-DE-ESCALATE';
  else if(range<GD_FLAT_RANGE)verdict='GAIN-DOSE-FLAT';
  else verdict='GAIN-DOSE-INDETERMINATE';
  return {g1,g0,g2b,gRep,repWins,verdict,go,hb,trainGaps,unlearnGaps,
    means:{0:m0,0.5:m05,1:m1,2:m2,4:m4},range:+range.toFixed(4),fit};
}
export function runGainDoseDev({bankPath,output,resume=false}){
  const sources=gainDoseDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=gainDoseDevBank(bankPathAbs);
  assert.equal(p.histories.length,GD_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...GD_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'gain-dose-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...GD_ARMS],pairs:GD_PAIRS,doses:[...GD_DOSES],
      caps:{executions:300,aggregateScalarOperations:GD_OP_CAP,wallSeconds:GD_WALL_CAP_SECONDS},
      scope:'GAIN-DOSE Phase-A single run (coupled surprise-gain sweep d in {0,.5,1,2,4} x 3 pairs = 21 mains; d=1 V1g-identical replication anchor; d=0 uniform reference; per-cue per-third + first-contact ticks; quadratic dose-response with replication-gated OPTIMAL/ESCALATE/DE-ESCALATE/OVERDOSE/FLAT verdicts).'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=GD_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  const checkMainIntegrity=(endpoint,label)=>{
    assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
    assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op cap breached`);
  };
  const runOne=(tag,history,options)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectGainDose();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...(options??BT_LEARNER_OPTIONS)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary,
        weights:snapshotWeights(run.learners),manipulation:agentWork(run.learners)};
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const pairWall={};
  for(let pi=0;pi<GD_PAIRS.length;pi++){
    const [hiTr,hiTe]=GD_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    const t0r=runOne('train',hTr);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    for(const d of GD_DOSES){
      const tag='gain-'+d;
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag===tag&&r.summary);
      if(found){console.log(JSON.stringify({stage:'skip',tag,seed:hTe.seed,reason:'complete on disk'}));continue;}
      if(resume)redone.push(`${hTe.seed}:${tag}`);
      const collector=collectGainDose();
      const {wall:w2,cpuS:c2}=timed(`${tag}/${hTe.seed}`,()=>{
        const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...gainDoseOpts(d)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
        for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
        const cp=copyWeights(trainRow.weights,run.learners);
        const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
        assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
        const row={history:{seed:hTe.seed},tag,endpoint:null,summary:null,
          transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
            sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
        assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'transplant digest mismatch');
        run.advance(BT_TICKS);
        row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`${tag}/${hTe.seed}`);
        row.summary=collector.summarize();
        row.weights=snapshotWeights(run.learners);
        row.manipulation=agentWork(run.learners);
        note(1,0,BT_TICKS,row.endpoint.scalarOperations);
        rows.push(row);
        writeOver(join(outputAbs,'rows',`${hTe.seed}-${tag}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm:tag,seed:hTe.seed,energy:row.endpoint.budgetAdjustedEnergyPerFounder}));
      });
      wall+=w2;cpuS+=c2;
    }
    const uRes=runOne('unlearned',hTe);wall+=uRes.wall;cpuS+=uRes.cpuS;
    pairWall[`pair${pi}`]={wall,cpuS};
  }
  runtimes.pairs=pairWall;checkpointLedger();
  assert.deepEqual(gainDoseDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=GD_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreGainDose(rows);
  assert.equal(ledger.mains,GD_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,GD_EXPECT_PROBES,'Dev probes count mismatch');
  const manipulation={};
  for(const tag of GD_ARMS){const m={surpriseBoosts:0,replaySurpriseBoosts:0,replaySkips:0};
    for(const r of rows.filter(x=>x.tag===tag)){const w=r.manipulation||{};
      m.surpriseBoosts+=(w.surpriseBoosts??0);m.replaySurpriseBoosts+=(w.replaySurpriseBoosts??0);m.replaySkips+=(w.replaySkips??0);}
    manipulation[tag]=m;}
  const nullClean=['train','gain-0','unlearned'].every(t=>(manipulation[t].surpriseBoosts??0)===0&&(manipulation[t].replaySurpriseBoosts??0)===0);
  const doseFired=['gain-0.5','gain-1','gain-2','gain-4'].every(t=>(manipulation[t].replaySurpriseBoosts??0)>0);
  let verdict=decision;
  if(!nullClean)verdict={...decision,go:false,verdict:'INVALID',nullHygieneViolated:true};
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,manipulation,nullClean,doseFired,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,manipulation,nullClean,doseFired};
}
