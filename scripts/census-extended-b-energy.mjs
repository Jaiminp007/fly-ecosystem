import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/extended-b-development/20261026-v1'),output=join(root,'evidence/extended-b-energy-census/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),close=(left,right)=>assert.ok(Math.abs(left-right)<1e-7+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`),protocol=read(join(source,'protocol.json'));
const records=[];for(const history of protocol.histories){const row=read(join(source,'rows',history.seed+'.json'));
  for(const arm of protocol.arms)for(const phase of ['B','C']){
    const label=history.seed+'-'+arm+'-acquire-'+phase,trace=row.traces[label];if(!trace)continue;
    const startPath=join(source,'starts',label+'.json'),finalPath=join(source,'finals',label+'.json'),initial=read(startPath),final=read(finalPath),first=initial.world.world,last=final.world.world;
    const sumEnergy=world=>world.flies.reduce((sum,fly)=>sum+fly.energy,0),sumDebt=state=>Object.values(state.learners).reduce((sum,body)=>sum+body.charge.outstandingEnergy,0);
    const totals={beneficial:0,harmful:0,toxin:0,cost:0,paidExtra:0,discarded:0},pending={},digest=createHash('sha256');let events=0,receipts=0,terminals=0;
    const stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='physical'){assert.ok(!pending[event.agentId]);pending[event.agentId]=event;totals.beneficial+=event.beneficialEaten;totals.harmful+=event.harmfulEaten;totals.toxin+=event.toxinDamage;totals.cost+=event.cost;totals.paidExtra+=event.paidExtra;receipts++;}
      else if(event.type==='observe'){const receipt=pending[event.own.agentId];assert.ok(receipt);assert.equal(receipt.tick,event.own.tick);if(event.own.terminal){totals.discarded+=receipt.finalEnergy;terminals++;}delete pending[event.own.agentId];}
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);
    const deaths={energy:last.totals.deathCauses.energy-first.totals.deathCauses.energy,age:last.totals.deathCauses.age-first.totals.deathCauses.age};assert.equal(deaths.energy+deaths.age,terminals);assert.equal(first.flies.length-last.flies.length,terminals);
    const energyStart=sumEnergy(first),energyEnd=sumEnergy(last);close(energyStart+totals.beneficial-totals.toxin-totals.cost-totals.discarded,energyEnd);
    const before=initial.state.statistics[phase]??{intake:0,toxin:0,cost:0},after=final.state.statistics[phase];assert.ok(after);close(totals.beneficial,after.intake-before.intake);close(totals.toxin,after.toxin-before.toxin);close(totals.cost,after.cost-before.cost);
    records.push({seed:history.seed,arm,phase,ticks:last.tick-first.tick,startBodies:first.flies.length,endBodies:last.flies.length,energyStart,energyEnd,startDebt:sumDebt(initial.state),endDebt:sumDebt(final.state),deaths,receipts,totals,startSha256:hash(readFileSync(startPath)),finalSha256:hash(readFileSync(finalPath))});
  }
}
const summary={};for(const arm of protocol.arms){summary[arm]={};for(const phase of ['B','C']){const subset=records.filter(record=>record.arm===arm&&record.phase===phase),sum=key=>subset.reduce((total,record)=>total+key(record),0);
  summary[arm][phase]={histories:subset.length,startBodies:sum(record=>record.startBodies),endBodies:sum(record=>record.endBodies),energyStart:sum(record=>record.energyStart),energyEnd:sum(record=>record.energyEnd),energyDeaths:sum(record=>record.deaths.energy),ageDeaths:sum(record=>record.deaths.age),beneficial:sum(record=>record.totals.beneficial),toxin:sum(record=>record.totals.toxin),cost:sum(record=>record.totals.cost),paidExtra:sum(record=>record.totals.paidExtra),discarded:sum(record=>record.totals.discarded),receipts:sum(record=>record.receipts)};
}}
const report={schema:1,sourceProtocolSha256:hash(readFileSync(join(source,'protocol.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),planSha256:hash(readFileSync(join(root,'docs/EXTENDED_B_ENERGY_CENSUS_PLAN.md'))),scope:'Factual receipt and phase-ledger census; no counterfactual or independent physics.',records,summary};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
