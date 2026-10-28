// D1-FIX validation instrument (frozen plan docs/MARGIN_READBACK_PLAN_V1.md).
// Synthetic-anchor emission checks + one-history spent-bank MEASUREMENT.
// Single authorized attempt. Usage:
//   node scripts/margin-readback-check.mjs --output evidence/margin-readback/attempt-01
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {TasteExperiment,runTasteProbe} from '../learning/taste-experiment.mjs';
import {runTastePressureBattery} from '../learning/taste-pressure.mjs';
import {digest} from '../learning/intervention-study.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';
import {BT_LEARNER_OPTIONS,BT_PRICING} from './body-transfer.mjs';
import {blockOf} from './motor-anchor-dev.mjs';

export const MR_SYNTH_SEEDS=[380001,380002,380003,380004,380005,380006,380007,380008,380009];
export const MR_SPENT_HISTORY=2789221780; // bank-order-first V2 history (spent bank 47b44c62…).
export const MR_WALL_MS=1800e3;

// Collector for decision-path motor-margin records (wrapped or raw).
export function collectMarginReadback(){
  const perProbe={};
  const emit=wrapped=>{
    const tag=wrapped.probe!==undefined?wrapped:null;
    const e=tag?tag.event:wrapped;
    if(e.type!=='update'||!e.event||e.event.type!=='motor-margin')return;
    const r=e.event.record;if(!r||typeof r.baseProbability!=='number'||!Array.isArray(r.phi))return;
    const key=tag?tag.probe:'main';
    (perProbe[key]??={n:0,marginSum:0,near:0,blocks:{},bad:0,events:0});const s=perProbe[key];
    s.events++;
    if(!(r.baseProbability>=0&&r.baseProbability<=1)||r.phi.length!==16||typeof r.cruise!=='boolean'){s.bad++;return;}
    s.n++;s.marginSum+=Math.abs(r.baseProbability-0.5);if(Math.abs(r.baseProbability-0.5)<0.1)s.near++;
    const b=blockOf(r.phi);if(b>=0)s.blocks[b]=(s.blocks[b]??0)+1;
  };
  const summarize=s=>s?{n:s.n,events:s.events,bad:s.bad,meanMargin:s.n?s.marginSum/s.n:NaN,nearFrac:s.n?s.near/s.n:NaN,blocks:s.blocks}:{n:0};
  return {emit,perProbe,summarize};
}

export function buildSyntheticAnchor(){
  const [seed,cueSeed,...rest]=MR_SYNTH_SEEDS;
  const history={seed,cueSeed,resourceSeeds:rest.slice(0,4),probeSeeds:{A:rest[4],B:rest[5],transfer:rest[6]}};
  const run=new TasteExperiment({history,arm:'candidate',reference:{...VALUE_REFERENCE,founders:4},
    learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING}});
  run.advance(512);
  assert.ok(run.world.flies.length>0,'synthetic main went extinct — INCOMPLETE, no retry');
  return {anchor:run.checkpoint(),history};
}

export function runMarginReadbackCheck({output}){
  const t0=Date.now();
  assert.ok(output,'Supply --output');
  mkdirSync(output,{recursive:true});
  const fixturePath=resolve('evidence/margin-readback/fixture-seeds-01.json');
  mkdirSync(dirname(fixturePath),{recursive:true});
  writeFileSync(fixturePath,JSON.stringify({scope:'D1-FIX synthetic fixture seeds. Zero bank contact; union-excluded via evidence-JSON scan. Spent on first use; never a qual/dev bank.',spentFixtureSeeds:MR_SYNTH_SEEDS},null,2)+'\n');
  const ledger={kind:'margin-readback-ledger',executions:0,worldTicks:0,founderSlots:0,scalarOperations:0,spentFixtureSeeds:MR_SYNTH_SEEDS,spentBankReuse:[MR_SPENT_HISTORY]};
  // --- Synthetic anchor ---
  const {anchor,history}=buildSyntheticAnchor();
  ledger.executions+=1;ledger.worldTicks+=512;ledger.founderSlots+=512*4;
  const anchorDigest=digest(anchor);
  // A:current with emit (expect margins) vs emit=null (behavior identical, ops less).
  const colE=collectMarginReadback();
  const withEmit=runTasteProbe(structuredClone(anchor),{family:'A',version:'current',seed:history.probeSeeds.A,founders:4,ticks:256,emit:colE.emit});
  const noEmit=runTasteProbe(structuredClone(anchor),{family:'A',version:'current',seed:history.probeSeeds.A,founders:4,ticks:256,emit:null});
  const colR=collectMarginReadback();
  const resetProbe=runTasteProbe(structuredClone(anchor),{family:'A',version:'reset',seed:history.probeSeeds.A,founders:4,ticks:256,emit:colR.emit});
  ledger.executions+=3;ledger.worldTicks+=3*256;ledger.founderSlots+=3*256*4;
  ledger.scalarOperations+=withEmit.endpoint.additionalScalarOperations+noEmit.endpoint.additionalScalarOperations+resetProbe.endpoint.additionalScalarOperations;
  const synthetic={anchorDigest,survivorsAnchor:anchor.state.learners?Object.keys(anchor.state.learners).length:0,
    withEmit:{survivors:withEmit.survivors,value:withEmit.value,ops:withEmit.endpoint.additionalScalarOperations,
      perProbe:Object.fromEntries(Object.entries(colE.perProbe).map(([k,s])=>[k,colE.summarize(s)]))},
    noEmit:{survivors:noEmit.survivors,value:noEmit.value,ops:noEmit.endpoint.additionalScalarOperations},
    reset:{survivors:resetProbe.survivors,perProbe:Object.fromEntries(Object.entries(colR.perProbe).map(([k,s])=>[k,colR.summarize(s)]))}};
  writeFileSync(resolve(output,'synthetic.json'),JSON.stringify(synthetic,null,2)+'\n');
  // --- Spent-bank measurement (ONE V2 history, MEASUREMENT, non-qualifying) ---
  const spentDir=resolve('evidence/body-transfer/v2/attempt-01/anchors/N');
  const anchorPath=resolve(spentDir,`${MR_SPENT_HISTORY}-C.json`);
  assert.ok(existsSync(anchorPath),'spent anchor missing');
  const beforeDigest=digest(readFileSync(anchorPath,'utf8'));
  const spentAnchor=JSON.parse(readFileSync(anchorPath,'utf8'));
  const protocol=JSON.parse(readFileSync(resolve('evidence/body-transfer/v2/fresh-01/protocol.json'),'utf8'));
  const spentHistory=protocol.histories.find(h=>h.seed===MR_SPENT_HISTORY);
  assert.ok(spentHistory,'spent history missing from protocol');
  const colS=collectMarginReadback();
  const battery=runTastePressureBattery(spentAnchor,spentHistory,{founders:24,ticks:256,emit:colS.emit});
  ledger.executions+=13;ledger.worldTicks+=13*256;ledger.founderSlots+=13*256*24;
  ledger.scalarOperations+=Object.values(battery.probes).reduce((n,p)=>n+(p.endpoint?p.endpoint.additionalScalarOperations:0),0);
  const afterDigest=digest(readFileSync(anchorPath,'utf8'));
  const spent={history:MR_SPENT_HISTORY,anchorDigestBefore:beforeDigest,anchorDigestAfter:afterDigest,
    survivors:Object.fromEntries(Object.entries(battery.probes).map(([k,p])=>[k,p.survivors])),
    perProbe:Object.fromEntries(Object.entries(colS.perProbe).map(([k,s])=>[k,colS.summarize(s)]))};
  writeFileSync(resolve(output,'spent-bank.json'),JSON.stringify(spent,null,2)+'\n');
  // --- Accept bar (conjunctive G1-G4; G5 scored at triage) ---
  const we=colE.perProbe['A:current'],re=colR.perProbe['A:current'];
  const spentKeys=['A:A','A:B','A:current','A:reset','sham'];
  const verdict={G1_synthEmit:!!we&&we.n>0&&we.bad===0,
    G2_synthNegative:!re||re.events===0,
    G3_synthBilling:withEmit.survivors===noEmit.survivors&&withEmit.value===noEmit.value&&withEmit.endpoint.additionalScalarOperations>noEmit.endpoint.additionalScalarOperations,
    G4_spentEmit:spentKeys.every(k=>colS.perProbe[k]&&colS.perProbe[k].n>0&&colS.perProbe[k].bad===0)&&beforeDigest===afterDigest};
  verdict.go=verdict.G1_synthEmit&&verdict.G2_synthNegative&&verdict.G3_synthBilling&&verdict.G4_spentEmit;
  assert.ok(Date.now()-t0<=MR_WALL_MS,'wall cap breach');
  assert.ok(ledger.executions<=32&&ledger.worldTicks<=100e3&&ledger.founderSlots<=1e6,'budget cap breach');
  writeFileSync(resolve(output,'ledger.json'),JSON.stringify(ledger,null,2)+'\n');
  const attempt={kind:'margin-readback-attempt',plan:'docs/MARGIN_READBACK_PLAN_V1.md',singleAttempt:true,
    sources:{'learning/taste-energy.mjs':digest(readFileSync(resolve('learning/taste-energy.mjs'),'utf8')),
      'learning/taste-experiment.mjs':digest(readFileSync(resolve('learning/taste-experiment.mjs'),'utf8')),
      'scripts/margin-readback-check.mjs':digest(readFileSync(resolve('scripts/margin-readback-check.mjs'),'utf8'))},
    fixtureSeeds:MR_SYNTH_SEEDS,spentBank:{protocol:'evidence/body-transfer/v2/fresh-01/protocol.json',history:MR_SPENT_HISTORY,label:'MEASUREMENT'},
    verdict,wallMs:Date.now()-t0};
  writeFileSync(resolve(output,'attempt.json'),JSON.stringify(attempt,null,2)+'\n');
  return {synthetic,survivors:synthetic,spent,verdict,ledger};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  assert.ok(value('--output'),'Usage: node scripts/margin-readback-check.mjs --output <attempt-dir>');
  const r=runMarginReadbackCheck({output:resolve(value('--output'))});
  console.log(JSON.stringify(r.verdict));
}
