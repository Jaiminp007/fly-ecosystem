// Retention-mechanism R1: taste-vs-motor saved-weight reinstatement probes.
// Frozen instrument for docs/RETENTION_MECHANISM_PLAN_V1.md (as corrected
// pre-execution: +8 atA-baseline probes, total 76). Factual saved weights
// only; no synthetic damage. atC baselines reused from frozen V2 artifacts.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {runTasteProbe} from '../learning/taste-experiment.mjs';

const read=p=>JSON.parse(readFileSync(p,'utf8'));

// Pure: clone a checkpoint anchor with one subsystem taken from the donor.
export function buildReinstateClone(atAnchor,atDonor,subsystem){
  assert.ok(['taste','motor'].includes(subsystem));
  const clone=structuredClone(atAnchor);
  for(const [id,donor] of Object.entries(atDonor.state.learners)){
    const target=clone.state.learners[id];
    assert.ok(target&&donor,`reinstatement: founder ${id} present in both`);
    if(subsystem==='taste'){
      target.weights.taste=structuredClone(donor.weights.taste);
      target.tasteScale=donor.tasteScale;target.priorLogit=donor.priorLogit;
    }else{
      target.weights.actor=structuredClone(donor.weights.actor);
      target.weights.critic=structuredClone(donor.weights.critic);
      target.eligibility.actor=structuredClone(donor.eligibility.actor);
      target.eligibility.critic=structuredClone(donor.eligibility.critic);
      target.tdRms=donor.tdRms;
    }
  }
  return clone;
}

export function runAProbes(anchor,probeSeedA,founders=24,ticks=256){
  const out={};
  for(const key of ['A:current','A:A','A:reset']){
    const [family,version]=key.split(':');
    out[key]=runTasteProbe(anchor,{family,version,seed:probeSeedA,founders,ticks});
  }
  const sham=runTasteProbe(structuredClone(anchor),{family:'A',version:'A',seed:probeSeedA,founders,ticks});
  assert.deepEqual(sham,out['A:A'],'sham identity');
  return out;
}

// Fixed-input readout margins on a (possibly modified) anchor, free.
function phiOf(cue,scale){
  const t=[1,...cue];
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)t.push(cue[a]*cue[b]);
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++)t.push(cue[a]*cue[b]*cue[c]);
  t.push(cue[0]*cue[1]*cue[2]*cue[3]);
  return t.map(v=>v*scale);
}
export function aMarginsOf(anchor){
  const learners=Object.values(anchor.state.learners).filter(l=>!l.dead);
  const ms=learners.flatMap(l=>anchor.state.codebook.A.map(item=>{
    const phi=phiOf(item.bits,l.tasteScale);
    const logit=phi.reduce((s,v,j)=>s+v*l.weights.taste[j],0)+l.priorLogit;
    return (2*(item.valence<0?0:1)-1)*logit;
  }));
  return {mean:ms.reduce((s,v)=>s+v,0)/ms.length,fracPos:ms.filter(v=>v>0).length/ms.length};
}

import {fileURLToPath} from 'node:url';
const isMain=process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1];
const [,,bankPath,anchorsDir,v2rowsDir,outDir]=process.argv;
if(isMain)assert.ok(bankPath&&anchorsDir&&v2rowsDir&&outDir,'usage: reinstate-probes.mjs <bank> <anchors> <v2rows> <out>');
if(isMain)main();
function main(){
const bank=read(bankPath),histories=bank.histories; // ALL, bank order
mkdirSync(`${outDir}/rows`,{recursive:true});
let probes=0;
const val=(o,k)=>{const p=o[k];assert.ok(p&&Number.isFinite(p.value),`probe value ${k}`);return p.value;};
for(const h of histories){
  const atC=read(`${anchorsDir}/N/${h.seed}-C.json`),atA=read(`${anchorsDir}/N/${h.seed}-A.json`);
  const v2=read(`${v2rowsDir}/${h.seed}.json`).N.probes;
  if(h.seed===histories[0].seed){
    // Identity control (tolerance per plan Correction 2): unmodified atC
    // clone reproduces the filed battery (same survivors + same billed ops +
    // |Δvalue| ≤ 1e-3). Same-process determinism is proven by the sham assert.
    const got=runAProbes(structuredClone(atC),h.probeSeeds.A);probes+=4;
    for(const k of ['A:current','A:A','A:reset']){
      assert.equal(got[k].survivors,v2[k].survivors,`identity survivors ${k}`);
      assert.equal(got[k].endpoint.operationsBilled,v2[k].endpoint.operationsBilled,`identity ops ${k}`);
      assert.ok(Math.abs(got[k].value-v2[k].value)<=1e-3,`identity value ${k}`);
    }
  }
  // atA baseline completion: the V2 early battery lacks A:A; run it on the
  // unmodified atA anchor (same frozen probe path, recorded seeds).
  const atAbase=runAProbes(structuredClone(atA),h.probeSeeds.A);probes+=4;
  assert.equal(atAbase['A:current'].survivors,v2['early-A:current'].survivors,'atA current survivors');
  assert.ok(Math.abs(atAbase['A:current'].value-v2['early-A:current'].value)<=1e-3,'atA current value');
  assert.equal(atAbase['A:reset'].survivors,v2['early-A:reset'].survivors,'atA reset survivors');
  assert.ok(Math.abs(atAbase['A:reset'].value-v2['early-A:reset'].value)<=1e-3,'atA reset value');
  const taste=buildReinstateClone(atC,atA,'taste'),motor=buildReinstateClone(atC,atA,'motor');
  const pt=runAProbes(taste,h.probeSeeds.A);probes+=4;
  const pm=runAProbes(motor,h.probeSeeds.A);probes+=4;
  const row={seed:h.seed,
    aRetA:val(atAbase,'A:current')-.95*val(atAbase,'A:A')-.05*val(atAbase,'A:reset'),
    aRetC:v2['A:current'].value-.95*v2['A:A'].value-.05*v2['A:reset'].value,
    aRetTaste:val(pt,'A:current')-.95*val(pt,'A:A')-.05*val(pt,'A:reset'),
    aRetMotor:val(pm,'A:current')-.95*val(pm,'A:A')-.05*val(pm,'A:reset'),
    margins:{atA:aMarginsOf(atA).mean,taste:aMarginsOf(taste).mean,motor:aMarginsOf(motor).mean}};
  writeFileSync(`${outDir}/rows/${h.seed}.json`,JSON.stringify(row));
}
writeFileSync(`${outDir}/ledger.json`,JSON.stringify({probes,worldTicks:probes*256,founderSlots:probes*256*24}));
console.log(JSON.stringify({probes}));
}
