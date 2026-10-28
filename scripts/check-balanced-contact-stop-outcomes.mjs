import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/balanced-contact-stop/20261026-v1'),read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`),protocol=read(join(base,'protocol.json')),results=read(join(base,'results.json'));let receipts=0;
for(const arm of protocol.arms){const measures=[];for(const history of protocol.histories){const row=read(join(base,'rows',history.seed+'.json')),probes=row.arms[arm].probes,aa=probes['A-A']?.endpoint,ab=probes['A-B']?.endpoint,ar=probes['A-reset']?.endpoint,ba=probes['B-A']?.endpoint,bb=probes['B-B']?.endpoint;assert.ok([aa,ab,ar,ba,bb].every(Boolean));
    for(const mode of ['A','B']){const label=history.seed+'-'+arm+'-probe-A-'+mode,stream=createReadStream(join(base,'traces',label+'.jsonl.gz')).pipe(createGunzip()),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let intake=0,toxin=0;for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);if(event.type==='physical'){intake+=event.beneficialEaten;toxin+=event.toxinDamage;receipts++;}}assert.equal(digest.digest('hex'),row.traces[label].sha256);const stats=probes['A-'+mode].endpoint.statistics.A??{intake:0,toxin:0};close(intake,stats.intake);close(toxin,stats.toxin);}
    const net=endpoint=>{const stats=endpoint.statistics.A??{intake:0,toxin:0};return (stats.intake-stats.toxin)/endpoint.founders;};measures.push({aAdvantage:aa.budgetAdjustedEnergyPerFounder-ar.budgetAdjustedEnergyPerFounder,aInterference:aa.budgetAdjustedEnergyPerFounder-ab.budgetAdjustedEnergyPerFounder,bAcquisition:bb.budgetAdjustedEnergyPerFounder-ba.budgetAdjustedEnergyPerFounder,aNetIntakeDifference:net(aa)-net(ab)});
  }for(const key of Object.keys(measures[0]))close(results.arms[arm].pressure[key],measures.reduce((sum,item)=>sum+item[key],0)/measures.length);
}
const report={schema:1,passed:true,receipts,checkerSha256:sha(readFileSync(fileURLToPath(import.meta.url))),scope:'A-probe food/toxin receipt totals and pressure summary arithmetic; not independent physical dynamics or qualification.'};writeFileSync(join(base,'outcomes-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
