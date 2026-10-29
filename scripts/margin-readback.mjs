// EXPLORATORY fixed-input readout readback (zero worlds, zero seeds, zero bank
// contact beyond reading frozen artifacts). NOT an instrument, NOT evidence for
// gates. Reconstructs each history's cue codebook (pure function of the bank's
// recorded cueSeed), builds A/B cue phis, and evaluates stored readout weights
// from atA/atB/atC anchors as margins: m = (2t-1)*logit. Separates readout
// forgetting (fixed-input) from embodied behavior (probes).
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const read=p=>JSON.parse(readFileSync(p,'utf8'));

function phiOf(cue,scale){
  const t=[1,...cue];
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)t.push(cue[a]*cue[b]);
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++)t.push(cue[a]*cue[b]*cue[c]);
  t.push(cue[0]*cue[1]*cue[2]*cue[3]);
  return t.map(v=>v*scale);
}
const logitOf=(w,phi,prior)=>w.reduce((s,v,j)=>s+v*phi[j],0)+prior;

function marginsFor(anchorPath){
  const anchor=read(anchorPath),codebook=anchor.state.codebook;
  const learners=Object.values(anchor.state.learners).filter(l=>!l.dead);
  const out={n:learners.length,A:{},B:{}};
  for(const fam of ['A','B']){
    const ms=learners.map(l=>codebook[fam].map(item=>
      (2*(item.valence<0?0:1)-1)*logitOf(l.weights.taste,phiOf(item.bits,l.tasteScale),l.priorLogit)));
    const flat=ms.flat();
    out[fam]={mean:flat.reduce((s,v)=>s+v,0)/flat.length,
      min:Math.min(...flat),fracPos:flat.filter(v=>v>0).length/flat.length};
  }
  return out;
}

const [,,bankPath,anchorsRoot]=process.argv;
assert.ok(bankPath&&anchorsRoot,'usage: margin-readback.mjs <bank.json> <anchorsDir>');
const bank=read(resolve(bankPath));
const rows=bank.histories.map(h=>({seed:h.seed,cells:{}}));
// Generic walk: anchorsRoot/<group>/<seed>-<ckpt>.json
for(const group of readdirSync(resolve(anchorsRoot),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name)){
  for(const file of readdirSync(join(resolve(anchorsRoot),group))){
    const m=file.match(/^(\d+)-([ABC])\.json$/);if(!m)continue;
    const hist=bank.histories.find(x=>String(x.seed)===m[1]);if(!hist)continue;
    rows.find(r=>r.seed===hist.seed).cells[`${group}/${m[2]}`]=marginsFor(join(resolve(anchorsRoot),group,file));
  }
}
console.log(JSON.stringify(rows));
