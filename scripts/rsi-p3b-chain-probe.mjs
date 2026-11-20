// RSI P3-B chain probe (exploratory, no learner). From the program greedy search reached in the P3
// headroom check (one keepOnly/evid jump), measure the dev gain of second moves on knobs the P2
// grammar never touched (prior, memory) plus step/replays. Reuses spent P3 banks 997001-997012.
// Usage: node scripts/rsi-p3b-chain-probe.mjs <out.json>
import {writeFileSync,readFileSync} from 'node:fs';
import {Pool,makeHistories} from '../learning/taste-program-eval.mjs';
const OUT=process.argv[2],mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const ck=JSON.parse(readFileSync('evidence/rsi-p3-headroom/run.json.ckpt.json','utf8')),H=JSON.parse(readFileSync('evidence/rsi-p3-headroom/run.json','utf8'));
const single=(mask,sign)=>({mask,sign}),gate=(kind,[a,b])=>({terms:[[1<<a,1],[1<<b,1]],bias:(kind==='AND'?-1:1)*1.5,sign:kind==='AND'?-1:1});
const RULES={'s1+':single(1,1),'s2-':single(2,-1),'s4+':single(4,1),'s5-':single(5,-1),'s7+':single(7,1),'s10-':single(10,-1),'s11+':single(11,1),'s12-':single(12,-1),'s15+':single(15,1),'AND(1,2)-':gate('AND',[1,2]),'OR(0,1)+':gate('OR',[0,1]),'AND(2,3)-':gate('AND',[2,3])};
const MOVES=[['prior',0],['prior',.5],['prior',2],['prior',3],['memory',8],['memory',16],['memory',64],['memory',128],['step',2],['step',8],['replays',0],['replays',2]];
const pool=new Pool(4),rows=[];
for(const [i,r] of H.rows.entries()){
  const base=ck[`greedy:1:${r.problem}`].final,dev=makeHistories(997001+i,6),world={valenceRule:RULES[r.problem],tasteDecisionMode:'threshold'};
  const ev=async p=>mean((await Promise.all(dev.map(h=>pool.run({code:'masks',...p},h,world)))).map(x=>x.energy));
  const b=await ev(base),gains={};
  for(const [k,v] of MOVES)if(base[k]!==v)gains[`${k}=${v}`]=await ev({...base,[k]:v})-b;
  rows.push({problem:r.problem,base,baseEnergy:b,gains});
  console.log(JSON.stringify({problem:r.problem,base:b.toFixed(2),gains:Object.fromEntries(Object.entries(gains).map(([k,v])=>[k,+v.toFixed(2)]))}));
}
const ids=Object.keys(rows[0].gains),avg=Object.fromEntries(ids.map(k=>[k,+mean(rows.map(r=>r.gains[k]??0)).toFixed(2)]));
console.log(JSON.stringify({phase:'result',meanGain:avg,problemsWithSecondMoveOver1:rows.filter(r=>Math.max(...Object.values(r.gains))>1).length}));
writeFileSync(OUT,JSON.stringify({kind:'rsi-p3b-chain-probe',rows,meanGain:avg},null,2)+'\n');pool.close();
