import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-development/20261026-v1');
const output=join(root,'evidence/own-steering-energy-diagnosis/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7+1e-10*Math.max(Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const protocol=read(join(base,'protocol.json'));mkdirSync(join(root,'evidence/own-steering-energy-diagnosis'),{recursive:true});mkdirSync(output,{recursive:false});
const manifest={schema:1,kind:'own-steering-energy-census',developmentProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),developmentResultsSha256:hash(readFileSync(join(base,'results.json'))),
  sourceSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Post-outcome factual diagnostic, not an intervention, qualification or new seed.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const histories=[];let decisionCount=0,receiptCount=0;
for(const history of protocol.histories){
  const row=read(join(base,'rows',history.seed+'.json')),episodes={};
  for(const [label,trace]of Object.entries(row.traces)){
    if(!label.includes('-acquire-')&&!label.includes('-probe-transfer-'))continue;
    const final=read(join(base,'finals',label+'.json')),endpoint=label.includes('-acquire-')?row.acquisition[label.split('-acquire-')[1]].endpoint:row.probes[label.split('-probe-')[1]].endpoint;
    const alive=new Set(final.world.world.flies.map(fly=>fly.id)),pending={},last={},bins={},totals={decisions:0,receipts:0,beneficial:0,harmful:0,toxin:0,cost:0,paidExtra:0,deathEnergy:0};
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        assert.ok(!pending[event.id]);pending[event.id]=event;
        const steering=event.steering?(event.steering.action?'midpoint':'native'):'cheap-native',speed=event.choice.action;
        const key=steering+'-speed-'+speed,bin=bins[key]??={decisions:0,beneficial:0,harmful:0,toxin:0,cost:0};bin.decisions++;totals.decisions++;decisionCount++;
      }else if(event.type==='physical'){
        const prior=pending[event.agentId];assert.ok(prior&&prior.tick===event.tick);delete pending[event.agentId];
        const steering=prior.steering?(prior.steering.action?'midpoint':'native'):'cheap-native',bin=bins[steering+'-speed-'+prior.choice.action];
        for(const [key,value]of [['beneficial',event.beneficialEaten],['harmful',event.harmfulEaten],['toxin',event.toxinDamage],['cost',event.cost]]){totals[key]+=value;bin[key]+=value;}
        totals.paidExtra+=event.paidExtra;totals.receipts++;receiptCount++;last[event.agentId]=event.finalEnergy;
      }
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);
    for(const [id,energy]of Object.entries(last))if(!alive.has(Number(id)))totals.deathEnergy+=energy;
    close(endpoint.physicalEnergy-endpoint.startingEnergy,totals.beneficial-totals.toxin-totals.cost-totals.deathEnergy);
    close(endpoint.budgetAdjustedEnergyPerFounder,(totals.beneficial-totals.toxin-totals.cost-totals.deathEnergy-endpoint.outstandingEnergy+endpoint.startingDebt)/endpoint.founders);
    episodes[label]={endpoint,totals,bins,traceSha256:trace.sha256};
  }
  const outcome={seed:history.seed,episodes};writeFileSync(join(output,history.seed+'.json'),JSON.stringify(outcome,null,2)+'\n',{flag:'wx'});histories.push(outcome);
  console.log(JSON.stringify({seed:history.seed,episodes:Object.keys(episodes).length}));
}
assert.equal(decisionCount,receiptCount);
const aggregate={};
for(const group of ['acquire-learned','acquire-native','acquire-guarded','probe-transfer-current','probe-transfer-reset','probe-transfer-native','probe-transfer-guarded','probe-transfer-native-full']){
  const records=histories.map(row=>row.episodes[row.seed+'-'+group]).filter(Boolean),fields=['beneficial','harmful','toxin','cost','paidExtra','deathEnergy'];
  aggregate[group]={histories:records.length,survivors:records.reduce((sum,row)=>sum+row.endpoint.survivors,0),
    totals:Object.fromEntries(fields.map(key=>[key,records.reduce((sum,row)=>sum+row.totals[key],0)])),
    averageBudgetEnergyPerFounder:records.length?records.reduce((sum,row)=>sum+row.endpoint.budgetAdjustedEnergyPerFounder,0)/records.length:null};
}
const report={schema:1,passed:true,decisionCount,receiptCount,aggregate,scope:manifest.scope};
writeFileSync(join(output,'results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
