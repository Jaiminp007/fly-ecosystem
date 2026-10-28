import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-focal-controller/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),rows=[];
for(const selected of protocol.cases){
  const study=read(join(base,'rows',selected.seed+'-'+selected.focal+'.json')),arms={};
  for(const arm of protocol.arms){
    const label=selected.seed+'-'+selected.focal+'-'+arm,initial=read(join(base,'starts',label+'.json'));
    const value={decisions:0,midpoint:0,moves:[0,0,0],intake:0,toxin:0,cost:0,paidExtra:0,initialDebt:initial.state.learners[selected.focal].charge.outstandingEnergy,lastTick:null};
    const stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);
      if(event.type==='decision'&&event.id===selected.focal){value.decisions++;value.midpoint+=Number(event.steering?.action===1);value.moves[event.choice.action]++;value.lastTick=event.tick;}
      else if(event.type==='physical'&&event.agentId===selected.focal){value.intake+=event.beneficialEaten;value.toxin+=event.toxinDamage;value.cost+=event.cost;value.paidExtra+=event.paidExtra;}
    }
    assert.equal(digest.digest('hex'),study.arms[arm].trace.sha256);arms[arm]=value;
  }
  rows.push({seed:selected.seed,focal:selected.focal,arms});
}
const report={schema:1,rows,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Post-outcome focal factual action, receipt and setup-debt counts; not isolated cost causation or qualification.'};
writeFileSync(join(base,'focal-action-census.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows));
