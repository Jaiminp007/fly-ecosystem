// ODOR DEV R8 crash-resume (analytic only — ZERO worlds; imports no
// experiment code, runs no ticks). Recomputes the post-row section of
// scripts/odor-routed-r8.mjs after the aborted launch-02 ended on the
// r1plain bytes-vs-parse hash mismatch (runner packaging, repaired).
// Dual provenance: all inputs are the launch-02 written artifacts;
// redone: [] (no row re-executed, no world re-run).
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'evidence/odor-routed-development-r8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{if(existsSync(path))assert.fail('resume refuses to overwrite: '+path);writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const protocol=JSON.parse(readFileSync(join(output,'protocol.json'),'utf8'));
assert.equal(protocol.kind,'odor-routed-development-r8');
const bank=join(output,'bank-protocol.json');
assert.equal(hash(readFileSync(bank)),protocol.bankSha256);
const histories=protocol.histories;assert.equal(histories.length,8);
const rows=histories.map(h=>{
  const row=JSON.parse(readFileSync(join(output,'rows',h.seed+'.json'),'utf8'));
  assert.equal(row.history.seed,h.seed);assert.ok(row.signAudit&&row.probes['transfer-current']);
  return row;
});
assert.ok(!existsSync(join(output,'verdict.json')),'resume refuses: verdict already exists');
const r1Dir=join(output,'r1plain');
const r1Rows=histories.map(h=>{
  const raw=readFileSync(join(r1Dir,h.seed+'.json'),'utf8');
  const row=JSON.parse(raw);assert.equal(row.history.seed,h.seed);return row;
});
const r1Sha=Object.fromEntries(r1Rows.map(row=>[row.history.seed,hash(JSON.stringify(row))]));
const r1ShaPath=join(output,'r1plain-sha256.json');
if(existsSync(r1ShaPath))assert.deepEqual(JSON.parse(readFileSync(r1ShaPath,'utf8')),r1Sha,'launch-02 r1plain-sha256 mismatch');
else write(r1ShaPath,r1Sha);
for(const [seed,expected]of Object.entries(r1Sha)){
  const raw=readFileSync(join(r1Dir,seed+'.json'),'utf8');
  assert.equal(hash(JSON.stringify(JSON.parse(raw))),expected);
}
const transferLift=rows.map((row,i)=>{
  const candidate=row.probes['transfer-current']?.endpoint,b=r1Rows[i].probes['transfer-current']?.endpoint;
  assert.ok(candidate&&b,'R8 missing transfer-current for '+row.history.seed);
  return {seed:row.history.seed,energy:candidate.budgetAdjustedEnergyPerFounder-b.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-b.survivors};
});
const transferWins=transferLift.filter(v=>v.energy>0).length;
const acquireOK=rows.map((row,i)=>{
  const candidate=row.probes['A-current']?.endpoint,b=r1Rows[i].probes['A-current']?.endpoint;
  assert.ok(candidate&&b,'R8 missing A-current for '+row.history.seed);
  return {seed:row.history.seed,ratio:b.budgetAdjustedEnergyPerFounder>0?candidate.budgetAdjustedEnergyPerFounder/b.budgetAdjustedEnergyPerFounder:null};
});
const acquirePass=acquireOK.filter(v=>v.ratio!==null&&v.ratio>=0.8).length;
const signPass=rows.map(row=>({seed:row.history.seed,posfrac:row.signAudit.posfrac,pass:row.signAudit.posfrac>=0.4}));
const signWins=signPass.filter(v=>v.pass).length;
const verdict=transferWins>=5&&signWins>=6&&acquirePass>=6?'R8-GO':transferWins>=5?'R8-PARTIAL':'R8-NO-GO';
write(join(output,'verdict.json'),{verdict,transferLift,transferWins,acquireOK,acquirePass,signPass,signWins,
  provenance:{resumed:true,reason:'launch-02 aborted on r1plain bytes-vs-parse hash mismatch (runner packaging, repaired 1-line, zero mechanism change); comparisons+verdict recomputed from launch-02 written rows, zero worlds re-run',redone:[]},
  scope:'descriptive dev verdict, not qualification'});
console.log(JSON.stringify({verdict,transferWins,acquirePass,signWins}));
console.log(JSON.stringify(transferLift));
console.log(JSON.stringify(acquireOK));
console.log(JSON.stringify(signPass.map(s=>({seed:s.seed,posfrac:Math.round(s.posfrac*1000)/1000}))));
