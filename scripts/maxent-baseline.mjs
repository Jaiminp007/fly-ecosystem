// MAXENT-BASELINE V1 instrument (FROZEN under docs/MAXENT_BASELINE_PLAN_V1.md).
// Pure functions only: cue tables -> rates, mutual information (bits, Laplace a=1),
// marginal-matched MaxEnt null. ZERO new worlds; reads frozen artifacts deterministically.
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

export const MAXENT_ALPHA=1; // Laplace smoothing per cell, pre-registered (uninformative prior, not tuned).

// Aggregate a row's summary.cues into {H,Th,B,Tb} contact/turn counts by valence label.
export function aggregateCueTable(cues){
  let H=0,Th=0,B=0,Tb=0;
  for(const key of Object.keys(cues)){
    const c=cues[key];
    if(!Number.isInteger(c.contact)||c.contact<0||!Number.isInteger(c.turn)||c.turn<0||c.turn>c.contact)throw new Error('Malformed cue cell '+key);
    if(c.contact===0)continue;
    if(c.label==='harmful'){H+=c.contact;Th+=c.turn;}
    else if(c.label==='beneficial'){B+=c.contact;Tb+=c.turn;}
    else throw new Error('Unknown cue label '+key);
  }
  return {H,Th,B,Tb};
}

// Mutual information I(action; valence) in bits over the 2x2 table, Laplace a per cell.
export function mutualInformationBits(H,Th,B,Tb,alpha=MAXENT_ALPHA){
  const cells=[[Th,H-Th],[Tb,B-Tb]]; // rows: [harmful, beneficial]; cols: [turn, cruise]
  for(const row of cells)for(const x of row)if(!Number.isInteger(x)||x<0)throw new Error('Counts must be nonnegative integers');
  const tot=cells.flat().reduce((a,x)=>a+x,0)+4*alpha;
  const p=cells.map(row=>row.map(x=>(x+alpha)/tot));
  const pA=[p[0][0]+p[1][0],p[0][1]+p[1][1]], pV=[p[0][0]+p[0][1],p[1][0]+p[1][1]];
  let I=0;
  for(let v=0;v<2;v++)for(let a=0;a<2;a++){if(p[v][a]>0)I+=p[v][a]*Math.log2(p[v][a]/(pA[a]*pV[v]));}
  return I;
}

// Full per-arm summary: rates + bits + MaxEnt-null (marginal-matched, I=0) + coin-flip null.
export function scoreArmBits(H,Th,B,Tb){
  if(H<=0||B<=0)throw new Error('Both valences need contacts');
  const pTurnHarm=Th/H, pTurnBen=Tb/B, pTurn=(Th+Tb)/(H+B);
  return {H,Th,B,Tb,pTurnHarm,pTurnBen,pTurn,
    bits:mutualInformationBits(H,Th,B,Tb),
    maxEntNull:{pTurnHarm:pTurn,pTurnBen:pTurn,bits:0},
    coinFlip:{pTurnHarm:0.5,pTurnBen:0.5,bits:0}};
}

// Read-only driver over frozen TURN-GATE V1 attempt rows. Deterministic; mutates nothing.
export function maxentBaselineOnFrozenRows(rowsDir){
  const files=readdirSync(rowsDir).filter(f=>f.endsWith('.json')).sort();
  const arms={candidate:{H:0,Th:0,B:0,Tb:0},unlearned:{H:0,Th:0,B:0,Tb:0}};
  for(const f of files){
    const row=JSON.parse(readFileSync(join(rowsDir,f),'utf8'));
    const tag=row.tag;
    if(!(tag in arms))throw new Error('Unexpected arm tag '+tag);
    const a=aggregateCueTable(row.summary.cues);
    arms[tag].H+=a.H;arms[tag].Th+=a.Th;arms[tag].B+=a.B;arms[tag].Tb+=a.Tb;
  }
  const out={};
  for(const tag of Object.keys(arms))out[tag]=scoreArmBits(arms[tag].H,arms[tag].Th,arms[tag].B,arms[tag].Tb);
  return out;
}
