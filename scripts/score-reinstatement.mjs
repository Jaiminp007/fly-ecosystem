// R1 scorer (analytic, zero worlds): reads R1 rows + frozen V2 rows,
// applies the frozen decision rule, writes scored.json. No bank contact.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const [,,r1dir,v2rowsDir]=process.argv;
assert.ok(r1dir&&v2rowsDir,'usage: score-reinstatement.mjs <r1attempt> <v2rows>');
const bank=read('./evidence/body-transfer/v2/fresh-01/protocol.json');
const perHistory=bank.histories.map(h=>{
  const r=read(`${r1dir}/rows/${h.seed}.json`);
  const v2=read(`${v2rowsDir}/${h.seed}.json`).N.probes;
  const aRetC=v2['A:current'].value-.95*v2['A:A'].value-.05*v2['A:reset'].value;
  assert.ok(Math.abs(aRetC-r.aRetC)<1e-9,'aRetC reproduces V2 rows');
  const denom=r.aRetA-aRetC,useAbs=Math.abs(denom)<0.05;
  const f=x=>useAbs?{absolute:x-aRetC}:{fraction:(x-aRetC)/denom};
  const ft=f(r.aRetTaste),fm=f(r.aRetMotor);
  return {seed:h.seed,aRetA:r.aRetA,aRetC,aRetTaste:r.aRetTaste,aRetMotor:r.aRetMotor,
    useAbsolute:useAbs,fTaste:ft.fraction??null,fMotor:fm.fraction??null,
    absTaste:ft.absolute??null,absMotor:fm.absolute??null,
    margins:r.margins,severe:aRetC<-0.50};
});
const frac=perHistory.filter(h=>!h.useAbsolute);
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const mT=mean(frac.map(h=>h.fTaste)),mM=mean(frac.map(h=>h.fMotor));
const winM=frac.filter(h=>h.fMotor>h.fTaste).length,winT=frac.filter(h=>h.fTaste>h.fMotor).length;
let verdict;
if(mM>=0.50&&mT<=0.25&&(mM-mT)>=0.30&&winM>=6)verdict='SUPPORT-H1-motor';
else if(mT>=0.50&&mM<=0.25&&(mT-mM)>=0.30&&winT>=6)verdict='SUPPORT-H1-taste';
else if(mM>=0.50&&mT>=0.50)verdict='DISTRIBUTED';
else if(mM<0.25&&mT<0.25)verdict='ELSEWHERE';
else verdict='INCONCLUSIVE';
const out={verdict,meanFTaste:mT,meanFMotor:mM,motorWins:winM,tasteWins:winT,nFrac:frac.length,
  nAbsolute:perHistory.length-frac.length,severeCount:perHistory.filter(h=>h.severe).length,perHistory};
writeFileSync(`${r1dir}/scored.json`,JSON.stringify(out,null,1));
console.log(JSON.stringify({verdict,meanFTaste:+mT.toFixed(3),meanFMotor:+mM.toFixed(3),motorWins:winM,tasteWins:winT,nFrac:frac.length,severe:perHistory.filter(h=>h.severe).length}));
for(const h of perHistory)console.log(h.seed,'A',h.aRetA.toFixed(3),'C',h.aRetC.toFixed(3),'T',h.aRetTaste.toFixed(3),'M',h.aRetMotor.toFixed(3),
  h.useAbsolute?`absT${h.absTaste.toFixed(3)} absM${h.absMotor.toFixed(3)}`:`fT${h.fTaste.toFixed(2)} fM${h.fMotor.toFixed(2)}`,h.severe?'SEVERE':'');
