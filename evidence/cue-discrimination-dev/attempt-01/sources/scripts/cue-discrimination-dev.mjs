// CUE-DISCRIMINATION Phase-A dev instrument (FROZEN under
// docs/CUE_DISCRIMINATE_PLAN_V1.md). Choice, not retention. 4 arms
// (candidate/unlearned/frozen/reset) x 6 histories = 24 mains, ZERO probes.
// Collector joins per-tick decision {cue, action} + physical
// {beneficialEaten, harmfulEaten} on (tick, agentId) — all pre-existing
// emit fields, NO new engine code. G1 join rate; G2a harmful-share gap;
// G2b cue-conditioned pause rates; V1b gate (room/slow) vs ceiling.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const C_EXPERIMENT='cue-discrimination-dev';
export const C_HISTORIES=6;
export const C_ARMS=Object.freeze(['candidate','unlearned','frozen','reset']);
export const C_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>393001+j));
const C_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054]];
export const C_SPENT_SEEDS=Object.freeze([381001,...C_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const C_EXPECT_MAINS=24, C_EXPECT_PROBES=0;
export const C_OP_CAP=20_000_000_000, C_WALL_CAP_SECONDS=3600;
export const C_JOIN_MIN=0.99, C_GAP_MIN=0.15, C_GAP_HISTORIES=4;
export const C_ROOM=0.25, C_SLOW=0.35, C_FLOOR=0.10;
export const C_BLOCKS=Object.freeze([[0,512],[512,1024],[1024,1536],[1536,1792]]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function cueExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/cue-discrimination-dev.mjs','docs/CUE_DISCRIMINATE_PLAN_V1.md','tests/cue-discrimination-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function cueDiscDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/cue-discrimination-dev.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'tests/cue-discrimination-dev.test.mjs','docs/CUE_DISCRIMINATE_PLAN_V1.md'])visit(resolve(root,name));
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
export function cueDiscDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,C_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of cueExtraTokens())excluded.add(t);
  for(const s of C_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of C_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=C_FIXTURE_SEEDS.length/C_HISTORIES===9?Array.from({length:C_HISTORIES},(_,h)=>{
    const s=C_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,C_HISTORIES*9,'Dev bank must be 54 unique seeds');
  const p={schema:1,experiment:C_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'CUE-DISCRIMINATE Phase-A dev bank (deterministic fresh 393001-393054, 9/history). First use is the single Phase-A run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// Join collector: per-tick decision {cue,action} + physical {beneficial,harmful}
// keyed (tick, agentId). Cue key = sensed cue vector joined. Pause = action>=2
// (cruise iff action<2, per taste-energy choose). Turn = odd action.
export function collectCueChoice(){
  const pending=new Map(),perCue={},blocks=C_BLOCKS.map(()=>({harm:0,tot:0}));
  let decisions=0,joined=0,harmTot=0,intakeTot=0;
  const key=(o)=>`${o.tick}:${o.agentId}`;
  const emit=e=>{
    if(e.type==='decision'&&e.own){
      decisions++;
      pending.set(key(e.own),{cue:(e.own.cue??[]).join(','),action:e.action,contact:!!e.own.contactPresent,tick:e.own.tick});
    }else if(e.type==='physical'&&e.agentId!==undefined&&e.tick!==undefined){
      const d=pending.get(`${e.tick}:${e.agentId}`);
      if(!d)return;
      pending.delete(`${e.tick}:${e.agentId}`);joined++;
      const b=Number(e.beneficialEaten)||0,h=Number(e.harmfulEaten)||0;
      intakeTot+=b+h;harmTot+=h;
      for(let i=0;i<C_BLOCKS.length;i++)if(e.tick>=C_BLOCKS[i][0]&&e.tick<C_BLOCKS[i][1]){blocks[i].harm+=h;blocks[i].tot+=b+h;}
      if(d.contact){
        const s=perCue[d.cue]??={contact:0,pause:0,turn:0,beneficial:0,harmful:0};
        s.contact++;if(d.action>=2)s.pause++;if(d.action%2===1)s.turn++;
        s.beneficial+=b;s.harmful+=h;
      }
    }
  };
  return {emit,
    summarize:()=>{
      const cues={};
      for(const [cue,s] of Object.entries(perCue))
        cues[cue]={...s,label:s.harmful>s.beneficial?'harmful':(s.beneficial>s.harmful?'beneficial':'tied')};
      return {decisions,joined,joinRate:decisions?joined/decisions:0,
        harmShare:intakeTot?harmTot/intakeTot:0,
        blocks:blocks.map(b=>({harm:b.harm,tot:b.tot,share:b.tot?b.harm/b.tot:0})),cues};
    }};
}
// Pure scorer (exported for fixtures). rows: [{tag,history:{seed},summary}].
// G2a: per-history unlearned-minus-candidate harmful-share >=0.15 (need >=4/6).
// G2b: per-history candidate pause-rate harmful-labeled > beneficial-labeled (need >=4/6).
export function scoreCue(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.candidate&&byTag.unlearned,'scorer needs candidate + unlearned rows');
  const g1=Object.values(byTag).every(rs=>rs.every(r=>r.summary.joinRate>=C_JOIN_MIN));
  const un=Object.fromEntries(byTag.unlearned.map(r=>[r.history.seed,r.summary.harmShare]));
  const cond=r=>{
    let hP=0,hN=0,bP=0,bN=0;
    for(const s of Object.values(r.summary.cues)){
      if(s.label==='harmful'){hP+=s.pause;hN+=s.contact;}
      else if(s.label==='beneficial'){bP+=s.pause;bN+=s.contact;}
    }
    return {hRate:hN?hP/hN:NaN,bRate:bN?bP/bN:NaN};
  };
  const nHist=byTag.candidate.length;
  let gapCount=0,condCount=0,condEval=0;
  for(const r of byTag.candidate){
    const u=un[r.history.seed];
    if(u!==undefined&&u-r.summary.harmShare>=C_GAP_MIN)gapCount++;
    const c=cond(r);
    if(Number.isFinite(c.hRate)&&Number.isFinite(c.bRate)){condEval++;if(c.hRate>c.bRate)condCount++;}
  }
  const candMean=byTag.candidate.reduce((x,r)=>x+r.summary.harmShare,0)/byTag.candidate.length;
  const b1=candMeanBlock(byTag.candidate,0);
  const go=g1&&gapCount>=C_GAP_HISTORIES&&condCount>=C_GAP_HISTORIES;
  const room=candMean>=C_ROOM||b1>=C_SLOW;
  return {gapCount,condCount,condEval,nHist,go,g1,
    verdict:!g1?'INVALID-INSTRUMENT':!go?'PHASE-A-NOGO':(room?'V1B-GATED':'CEILING-PROOF'),
    room,ceiling:!room,b1share:b1,candMean};
}
function candMeanBlock(candRows,i){
  const bs=candRows.map(r=>r.summary.blocks[i]).filter(b=>b&&b.tot>0);
  return bs.length?bs.reduce((x,b)=>x+b.share,0)/bs.length:NaN;
}

export function runCueDiscDev({bankPath,output,resume=false}){
  const sources=cueDiscDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=cueDiscDevBank(bankPathAbs);
  assert.equal(p.histories.length,C_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...C_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'cue-discrimination-phaseA-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...C_ARMS],
      caps:{executions:300,aggregateScalarOperations:C_OP_CAP,wallSeconds:C_WALL_CAP_SECONDS},
      scope:'CUE-DISCRIMINATE Phase-A single run (V1). No tuning on qual seeds; conjunctive G1/G2 + V1b gate decide.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=C_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.cpu)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label} exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label} exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of C_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.tag===arm);
        if(row&&row.summary){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        const collector=collectCueChoice();
        const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:collector.emit});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        row={history:{seed:history.seed},tag:arm,endpoint,summary:collector.summarize()};
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder}));
      }
    });
    runtimes[arm]={wall,cpuS};checkpointLedger();
  }
  assert.deepEqual(cueDiscDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=C_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreCue(rows);
  assert.equal(ledger.mains,C_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,C_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return decision;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
