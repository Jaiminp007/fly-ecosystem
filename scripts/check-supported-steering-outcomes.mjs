import {createGunzip} from 'node:zlib';
import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/supported-steering-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-9+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
const protocol=read(join(base,'protocol.json')),result=read(join(base,'results.json')),rows=protocol.histories.map(history=>read(join(base,'rows',history.seed+'.json')));
let receipts=0;
for(const arm of protocol.arms){
  for(const mode of ['reset','native','guarded','native-full']){
    const values=rows.map(row=>row.arms[arm].effects[mode]),expected=result.arms[arm].comparisons[mode];assert.equal(expected.complete,values.every(Boolean));
    assert.equal(expected.positiveHistories,values.filter(value=>value&&value.energy>0).length);
    if(expected.complete){close(expected.meanEnergy,values.reduce((sum,value)=>sum+value.energy,0)/8);assert.equal(expected.survivorDifference,values.reduce((sum,value)=>sum+value.survivors,0));}
    for(const row of rows){const candidate=row.arms[arm].probes['transfer-current']?.endpoint,control=row.arms[arm].probes['transfer-'+mode]?.endpoint,effect=row.arms[arm].effects[mode];
      if(candidate&&control){close(effect.energy,candidate.budgetAdjustedEnergyPerFounder-control.budgetAdjustedEnergyPerFounder);assert.equal(effect.survivors,candidate.survivors-control.survivors);}else assert.equal(effect,null);}
  }
  for(const phase of ['A','B']){
    const values=rows.map(row=>[phase,'current','reset'].map(mode=>row.arms[arm].probes[phase+'-'+mode]?.endpoint)),expected=result.arms[arm].retention[phase];assert.equal(expected.complete,values.every(row=>row.every(Boolean)));
    if(expected.complete){const saved=values.reduce((sum,row)=>sum+row[0].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8,current=values.reduce((sum,row)=>sum+row[1].budgetAdjustedEnergyPerFounder-row[2].budgetAdjustedEnergyPerFounder,0)/8;
      close(expected.savedAdvantage,saved);close(expected.currentAdvantage,current);if(saved>0)close(expected.ratio,current/saved);else assert.equal(expected.ratio,null);}
  }
  const pressure=[];
  for(const row of rows){
    const probes=row.arms[arm].probes,aa=probes['A-A']?.endpoint,ab=probes['A-B']?.endpoint,ar=probes['A-reset']?.endpoint,ba=probes['B-A']?.endpoint,bb=probes['B-B']?.endpoint;
    if(![aa,ab,ar,ba,bb].every(Boolean)){pressure.push(null);continue;}
    for(const mode of ['A','B']){
      const label=row.history.seed+'-'+arm+'-probe-A-'+mode,stream=createReadStream(join(base,'traces',label+'.jsonl.gz')).pipe(createGunzip()),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let intake=0,toxin=0;
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);if(event.type==='physical'){intake+=event.beneficialEaten;toxin+=event.toxinDamage;receipts++;}}
      assert.equal(digest.digest('hex'),row.traces[label].sha256);const recorded=probes['A-'+mode].endpoint.statistics.A;close(intake,recorded?.intake??0);close(toxin,recorded?.toxin??0);
    }
    const net=endpoint=>{const stats=endpoint.statistics.A??{intake:0,toxin:0};return (stats.intake-stats.toxin)/endpoint.founders;};
    pressure.push({aAdvantage:aa.budgetAdjustedEnergyPerFounder-ar.budgetAdjustedEnergyPerFounder,aInterference:aa.budgetAdjustedEnergyPerFounder-ab.budgetAdjustedEnergyPerFounder,bAcquisition:bb.budgetAdjustedEnergyPerFounder-ba.budgetAdjustedEnergyPerFounder,aNetIntakeDifference:net(aa)-net(ab)});
  }
  assert.deepEqual(pressure,result.arms[arm].pressureRows);
  if(pressure.every(Boolean)){
    for(const key of ['aAdvantage','aInterference','bAcquisition','aNetIntakeDifference'])close(result.arms[arm].pressure[key],pressure.reduce((sum,row)=>sum+row[key],0)/8);
    close(result.arms[arm].pressure.excessOverFivePercent,result.arms[arm].pressure.aInterference-.05*result.arms[arm].pressure.aAdvantage);
  }else assert.equal(result.arms[arm].pressure,null);
  const expected=['reset','native-full'].every(mode=>{const value=result.arms[arm].comparisons[mode];return value.complete&&value.meanEnergy>0&&value.positiveHistories>=6&&value.survivorDifference>=0;});assert.equal(result.arms[arm].promisingTransfer,expected);
}
const report={schema:1,passed:true,pressureReceipts:receipts,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Post-outcome independent paired arithmetic and A-probe intake/toxin receipt sums; not statistical qualification or independent physical dynamics.'};
writeFileSync(join(base,'outcomes-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));

