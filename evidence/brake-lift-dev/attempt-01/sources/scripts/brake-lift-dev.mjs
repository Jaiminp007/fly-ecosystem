// BRAKE-LIFT Phase-A dev instrument (FROZEN under docs/BRAKE_LIFT_PLAN_V1.md).
// LI-brake formalization: per-cue brake from train contacts, release-speed
// sweep {nolift:0, slow:0.0007, fast:0.0035} x 3 pairs + train + uniform
// + unlearned = 18 mains (BT_TICKS=1792). V1i transplant/collector/ledger
// machinery. Per-cue per-third behavior + first-contact ticks (standard).
// Scorer: G1 + G0 + G2b + G-manipulation (nolift < uniform by 0.05, else
// INVALID) + G-lift (fast beats uniform by +0.1 on >=2/3 pairs -> BRAKE-GO,
// else BRAKE-NOGO); LI gradient descriptive. Single attempt.
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

export const BL_EXPERIMENT='brake-lift-dev';
export const BL_HISTORIES=6;
export const BL_PAIRS=Object.freeze([[0,1],[2,3],[4,5]]);
export const BL_DOSES=Object.freeze(['uniform','brake-nolift','brake-slow','brake-fast']);
export const BL_DECAYS=Object.freeze({'brake-nolift':0,'brake-slow':0.0007,'brake-fast':0.0035});
export const BL_ARMS=Object.freeze(['train','uniform','brake-nolift','brake-slow','brake-fast','unlearned']);
export const BL_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>423001+j));
const BL_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[421001,421054],[422001,422054]];
export const BL_SPENT_SEEDS=Object.freeze([381001,...BL_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const BL_EXPECT_MAINS=18, BL_EXPECT_PROBES=0;
export const BL_OP_CAP=5_000_000_000, BL_WALL_CAP_SECONDS=3600;
export const BL_JOIN_MIN=0.99, BL_TRAIN_GAP=0.5, BL_FLAT_TOL=0.1;
export const BL_REP_GAP=0.1, BL_REP_MIN_PAIRS=2, BL_MANIP_GAP=0.05;
export const BL_C0=2000, BL_BRAKE_MAX=0.8;
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

export function brakeDoseOpts(tag){
  assert.ok(BL_DOSES.includes(tag),'unknown brake arm '+tag);
  if(tag==='uniform')return {...BT_LEARNER_OPTIONS};
  return Object.freeze({...BT_LEARNER_OPTIONS,assocBrake:true,assocC0:BL_C0,assocDecay:BL_DECAYS[tag]});
}
function brakeLiftExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/brake-lift-dev.mjs','docs/BRAKE_LIFT_PLAN_V1.md','tests/brake-lift-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function brakeLiftDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/brake-lift-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'scripts/turn-gated-dev-v1i.mjs','tests/brake-lift-dev.test.mjs','docs/BRAKE_LIFT_PLAN_V1.md'])visit(resolve(root,name));
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
export function brakeLiftDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,BL_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of brakeLiftExtraTokens())excluded.add(t);
  for(const s of BL_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of BL_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=BL_FIXTURE_SEEDS.length/BL_HISTORIES===9?Array.from({length:BL_HISTORIES},(_,h)=>{
    const s=BL_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,BL_HISTORIES*9,'Dev bank draws must be 54 unique seeds');
  const p={schema:1,experiment:BL_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'BRAKE-LIFT Phase-A dev bank (deterministic fresh 423001-423054, 9/history, 6 histories). First use is the single V1 run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Transplant trio + collector: V1i/gain-dose-identical (collector adds
// first-contact ticks; standard since gain-dose).
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
export function collectBrakeLift(){
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
// Brake init from train-row contacts (instrument-side; engine trusts the
// values — fixtures assert the cap). Missing cues default 0 (unbraked).
export function brakeInitFromTrain(trainCues){
  const out={};
  for(const [cue,s] of Object.entries(trainCues)){
    if(!s.contact)continue;
    out[cue]=+(Math.min(BL_BRAKE_MAX,s.contact/BL_C0).toFixed(6));
  }
  return out;
}
// Partial correlation (LI gradient): train-contact vs correctness | test-contact.
export function liPartial(pairs){
  const R=(a,b)=>{const n=a.length,ma=a.reduce((x,y)=>x+y,0)/n,mb=b.reduce((x,y)=>x+y,0)/n;let s=0,sa=0,sb=0;for(let i=0;i<n;i++){s+=(a[i]-ma)*(b[i]-mb);sa+=(a[i]-ma)**2;sb+=(b[i]-mb)**2;}return (sa===0||sb===0)?null:s/Math.sqrt(sa*sb);};
  const c=pairs.map(p=>p.corr),tc=pairs.map(p=>p.tc),ec=pairs.map(p=>p.ec);
  const r_ct=R(c,tc),r_ce=R(c,ec),r_te=R(tc,ec);
  if(r_ct===null||r_ce===null||r_te===null)return null;
  const den=Math.sqrt((1-r_ce*r_ce)*(1-r_te*r_te));
  if(!(den>0))return null;
  return +((r_ct-r_ce*r_te)/den).toFixed(3);
}
// Pure scorer (exported for fixtures). HB flipped-extinction primary.
export function scoreBrakeLift(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  for(const t of BL_ARMS)assert.ok((byTag[t]||[]).length===3,'scorer needs 3 rows per arm, missing '+t);
  const g1=Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=BL_JOIN_MIN));
  const gapOf=r=>{let hT=0,hN=0,bT=0,bN=0;for(const s of Object.values(r.summary.cues)){if(s.label==='harmful'){hT+=s.turn||0;hN+=s.contact;}else if(s.label==='beneficial'){bT+=s.turn||0;bN+=s.contact;}}if(!hN||!bN)return null;return +((hT/hN)-(bT/bN)).toFixed(4);};
  const trainGaps=(byTag.train||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=trainGaps.length===3&&trainGaps.every(g=>g.gap!==null&&g.gap>=BL_TRAIN_GAP);
  const unlearnGaps=(byTag.unlearned||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g2b=unlearnGaps.length===3&&unlearnGaps.every(g=>g.gap!==null&&Math.abs(g.gap)<=BL_FLAT_TOL);
  const trSeeds=(byTag.train||[]).map(r=>r.history.seed).sort((a,b)=>a-b);
  const hb={};
  for(const tag of BL_DOSES){
    const teSeeds=(byTag[tag]||[]).map(r=>r.history.seed).sort((a,b)=>a-b);
    hb[tag]=[0,1,2].map(i=>{
      const tr=(byTag.train||[]).find(r=>r.history.seed===trSeeds[i]);
      const te=(byTag[tag]||[]).find(r=>r.history.seed===teSeeds[i]);
      return scoreFlipSplit(tr,te).flippedHB.correctness;
    });
  }
  const mean=t=>{const vs=hb[t].filter(v=>v!==null);return vs.length?vs.reduce((a,b)=>a+b,0)/vs.length:null;};
  if(Object.values(hb).some(v=>v.some(x=>x===null)))return {g1,g0,g2b,verdict:'INVALID',reason:'null HB cell',hb,trainGaps,unlearnGaps,go:false};
  const mU=mean('uniform'),mN=mean('brake-nolift'),mF=mean('brake-fast');
  const manipOk=mU!==null&&mN!==null&&(mU-mN)>=BL_MANIP_GAP;
  const repWins=[0,1,2].filter(i=>hb['brake-fast'][i]!==null&&hb['uniform'][i]!==null&&hb['brake-fast'][i]-hb['uniform'][i]>=BL_REP_GAP).length;
  const gLift=repWins>=BL_REP_MIN_PAIRS;
  const li={};
  for(const tag of BL_DOSES){
    const teSeedsLi=(byTag[tag]||[]).map(r=>r.history.seed).sort((a,b)=>a-b);
    const pts=[];
    for(let i=0;i<3;i++){
      const tr=(byTag.train||[]).find(r=>r.history.seed===trSeeds[i]);
      const te=(byTag[tag]||[]).find(r=>r.history.seed===teSeedsLi[i]);
      for(const cue of Object.keys(te.summary.cues)){
        if(!(cue in tr.summary.cues))continue;
        if(!(tr.summary.cues[cue].label==='harmful'&&te.summary.cues[cue].label==='beneficial'))continue;
        const t=te.summary.cues[cue].turn,c=te.summary.cues[cue].contact;
        if(!c||!tr.summary.cues[cue].contact)continue;
        pts.push({corr:1-t/c,tc:Math.log(tr.summary.cues[cue].contact),ec:Math.log(c)});
      }
    }
    li[tag]=liPartial(pts);
  }
  let verdict,go=false;
  if(!g1)verdict='INVALID';
  else if(!g0)verdict='INCOMPLETE-UNTRAINED';
  else if(!g2b||!manipOk)verdict='INVALID';
  else if(mF===null||mU===null)verdict='INVALID';
  else if(mF-mU>=BL_REP_GAP&&repWins>=BL_REP_MIN_PAIRS){verdict='BRAKE-GO';go=true;}
  else verdict='BRAKE-NOGO';
  return {g1,g0,g2b,manipOk,repWins,gLift,li,verdict,go,hb,trainGaps,unlearnGaps,
    means:{uniform:mU,nolift:mN,slow:mean('brake-slow'),fast:mF}};
}
export function runBrakeLiftDev({bankPath,output,resume=false}){
  const sources=brakeLiftDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=brakeLiftDevBank(bankPathAbs);
  assert.equal(p.histories.length,BL_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...BL_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'brake-lift-v1-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...BL_ARMS],pairs:BL_PAIRS,decays:{...BL_DECAYS},
      caps:{executions:300,aggregateScalarOperations:BL_OP_CAP,wallSeconds:BL_WALL_CAP_SECONDS},
      scope:'BRAKE-LIFT Phase-A single run (LI-brake formalization + release sweep nolift/slow/fast x 3 pairs = 18 mains; brake init from train contacts; manipulation gate (nolift<uniform) + lift gate (fast>uniform +0.1); LI-gradient descriptive; per-cue thirds + first-contact ticks).'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=BL_OP_CAP,'Dev aggregate op cap breached');};
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
  const brakeWorkOf=learners=>{let n=0;for(const id of Object.keys(learners))n+=(learners[id].work?.brakeUpdates??0);return n;};
  const runOne=(tag,history,options)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectBrakeLift();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const armForTag=tag==='unlearned'?'unlearned':'candidate';
      const run=new TasteExperiment({history,arm:armForTag,learnerOptions:{...(options??BT_LEARNER_OPTIONS)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
      run.advance(BT_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary,brakeInit:null,
        weights:snapshotWeights(run.learners),manipulation:{...agentWork(run.learners),brakeUpdates:brakeWorkOf(run.learners)}};
      note(1,0,BT_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const pairWall={};
  for(let pi=0;pi<BL_PAIRS.length;pi++){
    const [hiTr,hiTe]=BL_PAIRS[pi];
    const hTr=p.histories[hiTr],hTe=p.histories[hiTe];
    let wall=0,cpuS=0;
    const t0r=runOne('train',hTr);wall+=t0r.wall;cpuS+=t0r.cpuS;
    const trainRow=rows.find(r=>r.history.seed===hTr.seed&&r.tag==='train');
    assert.ok(trainRow&&trainRow.summary&&trainRow.weights,'train row missing weights for transplant');
    const initMap=brakeInitFromTrain(trainRow.summary.cues);
    for(const tag of BL_DOSES){
      const found=rows.find(r=>r.history.seed===hTe.seed&&r.tag===tag&&r.summary);
      if(found){console.log(JSON.stringify({stage:'skip',tag,seed:hTe.seed,reason:'complete on disk'}));continue;}
      if(resume)redone.push(`${hTe.seed}:${tag}`);
      const collector=collectBrakeLift();
      const {wall:w2,cpuS:c2}=timed(`${tag}/${hTe.seed}`,()=>{
        const run=new TasteExperiment({history:hTe,arm:'candidate',learnerOptions:{...brakeDoseOpts(tag)},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
        for(const id of Object.keys(trainRow.weights))assertFreshTarget(run.learners[id],id);
        const cp=copyWeights(trainRow.weights,run.learners);
        const chk=checkTransplantIntegrity(trainRow.weights,run.learners);
        assert.ok(chk.ok,'transplant integrity failed: '+chk.violations.join(';'));
        if(tag!=='uniform')for(const id of Object.keys(run.learners))run.learners[id].brakes={...initMap};
        const row={history:{seed:hTe.seed},tag,endpoint:null,summary:null,brakeInit:tag==='uniform'?null:{...initMap},
          transfer:{transferred:cp.transferred,total:Object.keys(trainRow.weights).length,
            sourceDigest:digestWeights(trainRow.weights),appliedDigest:digestWeights(snapshotWeights(run.learners))}};
        assert.equal(row.transfer.sourceDigest,row.transfer.appliedDigest,'transplant digest mismatch');
        run.advance(BT_TICKS);
        row.endpoint=run.endpoint();checkMainIntegrity(row.endpoint,`${tag}/${hTe.seed}`);
        row.summary=collector.summarize();
        row.weights=snapshotWeights(run.learners);
        row.manipulation={...agentWork(run.learners),brakeUpdates:brakeWorkOf(run.learners)};
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
  assert.deepEqual(brakeLiftDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=BL_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreBrakeLift(rows);
  assert.equal(ledger.mains,BL_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,BL_EXPECT_PROBES,'Dev probes count mismatch');
  const manipulation={};
  for(const tag of BL_ARMS){const m={surpriseBoosts:0,replaySurpriseBoosts:0,replaySkips:0,brakeUpdates:0};
    for(const r of rows.filter(x=>x.tag===tag)){const w=r.manipulation||{};
      m.surpriseBoosts+=(w.surpriseBoosts??0);m.replaySurpriseBoosts+=(w.replaySurpriseBoosts??0);m.replaySkips+=(w.replaySkips??0);m.brakeUpdates+=(w.brakeUpdates??0);}
    manipulation[tag]=m;}
  const nullClean=['train','uniform','unlearned'].every(t=>(manipulation[t].surpriseBoosts??0)===0&&(manipulation[t].replaySurpriseBoosts??0)===0&&(manipulation[t].brakeUpdates??0)===0);
  const brakeFired=['brake-nolift','brake-slow','brake-fast'].every(t=>(manipulation[t].brakeUpdates??0)>0);
  let verdict=decision;
  if(!nullClean)verdict={...decision,go:false,verdict:'INVALID',nullHygieneViolated:true};
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,manipulation,nullClean,brakeFired,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return {...verdict,manipulation,nullClean,brakeFired};
}
