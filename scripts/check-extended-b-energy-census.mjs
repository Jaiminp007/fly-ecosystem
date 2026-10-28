import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/extended-b-energy-census/20261026-v1'),source=join(root,'evidence/extended-b-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-7+1e-10*Math.max(Math.abs(left),Math.abs(right))),report=read(join(base,'results.json'));
assert.equal(hash(readFileSync(join(source,'protocol.json'))),report.sourceProtocolSha256);assert.equal(hash(readFileSync(join(root,'scripts/census-extended-b-energy.mjs'))),report.scriptSha256);assert.equal(hash(readFileSync(join(root,'docs/EXTENDED_B_ENERGY_CENSUS_PLAN.md'))),report.planSha256);
for(const record of report.records){const label=record.seed+'-'+record.arm+'-acquire-'+record.phase,startPath=join(source,'starts',label+'.json'),finalPath=join(source,'finals',label+'.json');
  assert.equal(hash(readFileSync(startPath)),record.startSha256);assert.equal(hash(readFileSync(finalPath)),record.finalSha256);const first=read(startPath),last=read(finalPath),before=first.world.world,after=last.world.world;
  assert.equal(record.ticks,after.tick-before.tick);assert.equal(record.startBodies,before.flies.length);assert.equal(record.endBodies,after.flies.length);
  close(record.energyStart,before.flies.reduce((sum,fly)=>sum+fly.energy,0));close(record.energyEnd,after.flies.reduce((sum,fly)=>sum+fly.energy,0));
  assert.equal(record.deaths.energy,after.totals.deathCauses.energy-before.totals.deathCauses.energy);assert.equal(record.deaths.age,after.totals.deathCauses.age-before.totals.deathCauses.age);
  close(record.energyEnd,record.energyStart+record.totals.beneficial-record.totals.toxin-record.totals.cost-record.totals.discarded);
  const startStats=first.state.statistics[record.phase]??{intake:0,toxin:0,cost:0},endStats=last.state.statistics[record.phase];close(record.totals.beneficial,endStats.intake-startStats.intake);close(record.totals.toxin,endStats.toxin-startStats.toxin);close(record.totals.cost,endStats.cost-startStats.cost);
}
for(const arm of ['observe','filter'])for(const phase of ['B','C']){const subset=report.records.filter(record=>record.arm===arm&&record.phase===phase),summary=report.summary[arm][phase],sum=fn=>subset.reduce((total,record)=>total+fn(record),0);assert.equal(summary.histories,subset.length);
  for(const [name,fn]of Object.entries({startBodies:record=>record.startBodies,endBodies:record=>record.endBodies,energyStart:record=>record.energyStart,energyEnd:record=>record.energyEnd,energyDeaths:record=>record.deaths.energy,ageDeaths:record=>record.deaths.age,beneficial:record=>record.totals.beneficial,toxin:record=>record.totals.toxin,cost:record=>record.totals.cost,paidExtra:record=>record.totals.paidExtra,discarded:record=>record.totals.discarded,receipts:record=>record.receipts}))close(summary[name],sum(fn));}
const result={schema:1,passed:true,phaseRecords:report.records.length,scope:'Independent checkpoint hash, phase-energy arithmetic and aggregation check; receipt-level scan was performed by the original census.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
