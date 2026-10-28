import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-development/20261026-v1'),output=join(root,'evidence/odor-routed-survival-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const source=read(join(output,'protocol.json')),protocol=read(join(base,'protocol.json')),result=read(join(output,'results.json'));
assert.equal(hash(readFileSync(join(base,'protocol.json'))),source.developmentProtocolSha256);assert.equal(hash(readFileSync(join(base,'results.json'))),source.developmentResultsSha256);
assert.equal(hash(readFileSync(join(root,'scripts/census-odor-routed-survival.mjs'))),source.sourceSha256);assert.equal(hash(readFileSync(join(root,'docs/ODOR_ROUTED_SURVIVAL_DESIGN.md'))),source.designSha256);
const survivors={learned:{A:0,B:0,C:0,D:0},frozen:{A:0,B:0,C:0,D:0}},totals={learned:{},frozen:{}};let prefixes=0,decisions=0;
for(const history of protocol.histories){
  const original=read(join(base,'rows',history.seed+'.json')),row=read(join(output,history.seed+'.json')),prefixesByArm={};
  for(const arm of ['learned','frozen']){
    const label=history.seed+'-acquire-'+arm,checkpoint=read(join(base,'finals',label+'.json')),endpoint=original.acquisition[arm].endpoint;
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256'),prefix=createHash('sha256');stream.on('data',block=>digest.update(block));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line),tick=event.tick??event.own?.tick;if(tick<=512)prefix.update(line+'\n');events++;
    }
    assert.equal(digest.digest('hex'),original.traces[label].sha256);assert.equal(events,original.traces[label].events);prefixesByArm[arm]=prefix.digest('hex');
    assert.equal(prefixesByArm[arm],row.arms[arm].prefixSha256);
    for(const [phase,tick]of Object.entries({A:512,B:1024,C:1536,D:1792})){
      const alive=checkpoint.world.world.lineage.filter(body=>body.died===null||body.died>tick).length;assert.equal(alive,row.arms[arm].survivors[phase]);survivors[arm][phase]+=alive;
    }
    for(const [phase,stats]of Object.entries(endpoint.statistics)){
      const recorded=row.arms[arm].phases[phase],aggregate=totals[arm][phase]??={decisions:0,beneficial:0,toxin:0,cost:0};
      assert.equal(recorded.decisions,stats.decisions);assert.deepEqual(recorded.moves,stats.moves);assert.equal(recorded.accept,stats.accept);
      close(recorded.beneficial,stats.intake);close(recorded.toxin,stats.toxin);close(recorded.cost,stats.cost);
      aggregate.decisions+=stats.decisions;aggregate.beneficial+=stats.intake;aggregate.toxin+=stats.toxin;aggregate.cost+=stats.cost;
    }
    close(row.arms[arm].paidEnergy,endpoint.paidEnergy);close(row.arms[arm].incurredEnergy,endpoint.incurredEnergy);
  }
  assert.equal(prefixesByArm.learned,prefixesByArm.frozen);prefixes++;
}
for(const arm of ['learned','frozen']){
  assert.deepEqual(survivors[arm],result.aggregate[arm].survivors);
  for(const [phase,values]of Object.entries(totals[arm]))for(const [field,value]of Object.entries(values))close(value,result.aggregate[arm].phases[phase][field]);
  decisions+=Object.values(totals[arm]).reduce((sum,value)=>sum+value.decisions,0);
}
assert.equal(decisions,result.decisions);assert.equal(result.decisions,result.receipts);
const report={schema:1,passed:true,histories:prefixes,decisions,survivors,scope:'Independent A-prefix hashes, phase and lineage aggregation from stored traces/checkpoints; not independent world dynamics or isolated causal attribution.'};
writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
