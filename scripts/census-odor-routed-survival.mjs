import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/odor-routed-development/20261026-v1'),output=join(root,'evidence/odor-routed-survival-census/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
mkdirSync(join(root,'evidence/odor-routed-survival-census'),{recursive:true});mkdirSync(output,{recursive:false});
const manifest={schema:1,kind:'frozen-continuing-survival-census',developmentProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),developmentResultsSha256:hash(readFileSync(join(base,'results.json'))),
  sourceSha256:hash(readFileSync(fileURLToPath(import.meta.url))),designSha256:hash(readFileSync(join(root,'docs/ODOR_ROUTED_SURVIVAL_DESIGN.md'))),
  scope:'Post-outcome factual descriptions on reused histories; no isolated causal attribution or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const phaseFor=tick=>tick<=512?'A':tick<=1024?'B':tick<=1536?'C':'odor-free-acquisition';
const rows=[];let decisions=0,receipts=0;
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json')),arms={};
  for(const arm of ['learned','frozen']){
    const label=history.seed+'-acquire-'+arm,final=read(join(base,'finals',label+'.json')),endpoint=row.acquisition[arm].endpoint,pending={},phases={};
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256'),prefix=createHash('sha256');stream.on('data',block=>digest.update(block));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line),tick=event.tick??event.own?.tick;assert.ok(Number.isInteger(tick));events++;if(tick<=512)prefix.update(line+'\n');
      const name=phaseFor(tick),stats=phases[name]??={decisions:0,moves:[0,0,0],routes:{present:0,absent:0},accept:0,beneficial:0,harmful:0,toxin:0,cost:0,paidExtra:0};
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event.tick;stats.decisions++;stats.moves[event.choice.action]++;stats.routes[event.choice.route]++;stats.accept+=Number(event.choice.accept);decisions++;
      }else if(event.type==='physical'){
        assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];
        stats.beneficial+=event.beneficialEaten;stats.harmful+=event.harmfulEaten;stats.toxin+=event.toxinDamage;stats.cost+=event.cost;stats.paidExtra+=event.paidExtra;receipts++;
      }else assert.equal(event.type,'observe');
    }
    assert.equal(events,row.traces[label].events);assert.equal(digest.digest('hex'),row.traces[label].sha256);assert.equal(Object.keys(pending).length,0);
    for(const [name,stats]of Object.entries(phases)){
      const expected=endpoint.statistics[name];assert.equal(stats.decisions,expected.decisions);assert.deepEqual(stats.moves,expected.moves);assert.equal(stats.accept,expected.accept);
      close(stats.beneficial,expected.intake);close(stats.toxin,expected.toxin);close(stats.cost,expected.cost);
    }
    const paid=Object.values(phases).reduce((sum,phase)=>sum+phase.paidExtra,0);close(paid,endpoint.paidEnergy);close(endpoint.incurredEnergy-endpoint.paidEnergy,endpoint.outstandingEnergy);
    const lineage=final.world.world.lineage;assert.equal(lineage.length,endpoint.founders);
    const survivors=Object.fromEntries(Object.entries({A:512,B:1024,C:1536,D:1792}).map(([name,tick])=>[name,lineage.filter(body=>body.died===null||body.died>tick).length]));
    assert.equal(survivors.D,endpoint.survivors);
    arms[arm]={phases,survivors,incurredEnergy:endpoint.incurredEnergy,paidEnergy:endpoint.paidEnergy,outstandingEnergy:endpoint.outstandingEnergy,prefixSha256:prefix.digest('hex'),traceSha256:row.traces[label].sha256};
  }
  assert.equal(arms.learned.prefixSha256,arms.frozen.prefixSha256);
  const result={seed:history.seed,arms};writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);
  console.log(JSON.stringify({seed:history.seed,learned:arms.learned.survivors,frozen:arms.frozen.survivors}));
}
assert.equal(decisions,receipts);const aggregate={};
for(const arm of ['learned','frozen']){
  const phases={};for(const row of rows)for(const [name,value]of Object.entries(row.arms[arm].phases)){
    const sum=phases[name]??={decisions:0,moves:[0,0,0],routes:{present:0,absent:0},accept:0,beneficial:0,harmful:0,toxin:0,cost:0,paidExtra:0};
    for(const field of ['decisions','accept','beneficial','harmful','toxin','cost','paidExtra'])sum[field]+=value[field];
    for(let index=0;index<3;index++)sum.moves[index]+=value.moves[index];for(const route of ['present','absent'])sum.routes[route]+=value.routes[route];
  }
  aggregate[arm]={phases,survivors:Object.fromEntries(['A','B','C','D'].map(name=>[name,rows.reduce((sum,row)=>sum+row.arms[arm].survivors[name],0)])),
    incurredEnergy:rows.reduce((sum,row)=>sum+row.arms[arm].incurredEnergy,0),paidEnergy:rows.reduce((sum,row)=>sum+row.arms[arm].paidEnergy,0)};
}
const result={schema:1,passed:true,qualified:false,decisions,receipts,histories:rows.length,aggregate,scope:manifest.scope};
writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
