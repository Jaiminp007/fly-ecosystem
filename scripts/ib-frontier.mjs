// IB-FRONTIER V1 instrument (FROZEN under docs/IB_FRONTIER_PLAN_V1.md).
// Pure functions only: identity-vs-valence gap + agglomerative rate curve + k95/k99.
// ZERO new worlds; reads frozen artifacts deterministically.
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {mutualInformationBits} from './maxent-baseline.mjs';

export const IB_ALPHA=1; // Laplace smoothing per cell (same prior as MAXENT-V1).

// Per-cue {contact, turn, label} keyed by cue-bits -> {keys, contact[], turn[], label[]}.
export function cueArrays(cues){
  const keys=[],contact=[],turn=[],label=[];
  for(const k of Object.keys(cues).sort()){
    const c=cues[k];
    if(!Number.isInteger(c.contact)||c.contact<0||!Number.isInteger(c.turn)||c.turn<0||c.turn>c.contact)throw new Error('Malformed cue cell '+k);
    if(c.contact===0)continue;
    if(c.label!=='harmful'&&c.label!=='beneficial')throw new Error('Unknown cue label '+k);
    keys.push(k);contact.push(c.contact);turn.push(c.turn);label.push(c.label);
  }
  return {keys,contact,turn,label};
}

// I(action; partition) in bits for a partition given as array of cell-index lists.
function partitionBits(contact,turn,cells,alpha=IB_ALPHA){
  let tT=0,tC=0;
  const agg=cells.map(ix=>{let c=0,t=0;for(const i of ix){c+=contact[i];t+=turn[i];}tT+=t;tC+=c-t;return [t,c-t];});
  void tT;void tC;
  const tot=agg.flat().reduce((a,x)=>a+x,0)+2*cells.length*alpha;
  const p=agg.map(([t,c])=>[(t+alpha)/tot,(c+alpha)/tot]);
  const pA=[0,0];
  for(const row of p){pA[0]+=row[0];pA[1]+=row[1];}
  let I=0;
  for(let g=0;g<cells.length;g++){
    const pg=p[g][0]+p[g][1];
    for(let a=0;a<2;a++){if(p[g][a]>0)I+=p[g][a]*Math.log2(p[g][a]/(pg*pA[a]));}
  }
  return I;
}

// Identity bits: each cue its own cell. Valence bits: two cells by label.
export function identityValenceBits(contact,turn,label,alpha=IB_ALPHA){
  const n=contact.length;
  const ident=partitionBits(contact,turn,contact.map((_,i)=>[i]),alpha);
  const harm=contact.map((_,i)=>i).filter(i=>label[i]==='harmful');
  const ben=contact.map((_,i)=>i).filter(i=>label[i]==='beneficial');
  if(harm.length===0||ben.length===0)throw new Error('Both valences need cues');
  const val=partitionBits(contact,turn,[harm,ben],alpha);
  return {identity:ident,valence:val,gap:ident-val};
}

// Greedy agglomerative rate curve: merge adjacent (by turn-rate) pair minimizing
// size-weighted combined-rate distance; record I at each k=N..1.
export function rateCurve(contact,turn,alpha=IB_ALPHA){
  const n=contact.length;
  let groups=contact.map((_,i)=>[i]);
  const rate=ix=>{let c=0,t=0;for(const i of ix){c+=contact[i];t+=turn[i];}return c>0?t/c:0;};
  const size=ix=>ix.reduce((a,i)=>a+contact[i],0);
  const curve=[{k:n,bits:partitionBits(contact,turn,groups,alpha)}];
  while(groups.length>1){
    const order=groups.map((g,i)=>i).sort((a,b)=>rate(groups[a])-rate(groups[b]));
    let bi=0,bd=Infinity;
    for(let j=0;j<order.length-1;j++){
      const A=groups[order[j]],B=groups[order[j+1]];
      const d=Math.abs(rate(A)-rate(B))*(size(A)+size(B));
      if(d<bd){bd=d;bi=j;}
    }
    const merged=[...groups[order[bi]],...groups[order[bi+1]]];
    groups=groups.filter((_,i)=>i!==order[bi]&&i!==order[bi+1]);
    groups.push(merged);
    curve.push({k:groups.length,bits:partitionBits(contact,turn,groups,alpha)});
  }
  return curve;
}

// Smallest k with bits >= frac * full (full = bits at k=N).
export function effectiveK(curve,frac){
  const full=curve[0].bits;
  if(!(full>0))return 1;
  for(let i=curve.length-1;i>=0;i--)if(curve[i].bits>=frac*full)return curve[i].k;
  return curve[0].k;
}

// Read-only driver over frozen rows. Deterministic; mutates nothing.
export function ibFrontierOnFrozenRows(rowsDir){
  const files=readdirSync(rowsDir).filter(f=>f.endsWith('.json')).sort();
  const pooled={candidate:new Map(),unlearned:new Map()};
  for(const f of files){
    const row=JSON.parse(readFileSync(join(rowsDir,f),'utf8'));
    const tag=row.tag;
    if(!(tag in pooled))throw new Error('Unexpected arm tag '+tag);
    const hseed=row.history&&Number.isInteger(row.history.seed)?row.history.seed:null;
    if(hseed===null)throw new Error('Row missing history.seed');
    for(const key of Object.keys(row.summary.cues)){
      const c=row.summary.cues[key];
      if(!Number.isInteger(c.contact)||c.contact<0||!Number.isInteger(c.turn)||c.turn<0||c.turn>c.contact)throw new Error('Malformed cue cell '+key);
      if(c.contact===0)continue;
      if(c.label!=='harmful'&&c.label!=='beneficial')throw new Error('Unknown cue label '+key);
      // Identity unit is (history, bits): per-history codebooks remap bits->valence,
      // and each run learns fresh weights — pools must not conflate across histories.
      const uk=hseed+'|'+key;
      const e=pooled[tag].get(uk)||{contact:0,turn:0,label:c.label};
      e.contact+=c.contact;e.turn+=c.turn;
      pooled[tag].set(uk,e);
    }
  }
  const out={};
  for(const tag of ['candidate','unlearned']){
    const keys=[...pooled[tag].keys()].sort();
    const contact=keys.map(k=>pooled[tag].get(k).contact);
    const turn=keys.map(k=>pooled[tag].get(k).turn);
    const label=keys.map(k=>pooled[tag].get(k).label);
    const iv=identityValenceBits(contact,turn,label);
    const curve=rateCurve(contact,turn);
    // Curve property: I non-decreasing in k up to smoothing scale. Per-cell Laplace
    // changes total pseudocount as k shrinks, so DPI monotonicity can break by ~2a/n
    // (~1.5e-5 here); tolerance 1e-3 is 60x that scale — catches code bugs, not artifacts.
    for(let i=1;i<curve.length;i++)if(curve[i].bits>curve[i-1].bits+1e-3)throw new Error('Rate curve not monotone for '+tag);
    // k95/k99 degenerate when total information ~= Laplace floor (fractions of ~zero
    // partition noise, not alphabet structure) — flagged, not hidden.
    const degenerate=iv.identity<0.01;
    out[tag]={nCues:keys.length,identityBits:iv.identity,valenceBits:iv.valence,gap:iv.gap,
      k95:effectiveK(curve,0.95),k99:effectiveK(curve,0.99),degenerate,
      curve:curve.map(p=>({k:p.k,bits:p.bits}))};
  }
  return out;
}
