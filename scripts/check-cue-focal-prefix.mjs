import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-focal-controller/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),rows=[];
for(const selected of protocol.cases){
  const study=read(join(base,'rows',selected.seed+'-'+selected.focal+'.json')),streams={};
  for(const arm of ['all-residual','focal-cheap','focal-residual','all-cheap']){
    const label=selected.seed+'-'+selected.focal+'-'+arm,stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256'),events={};stream.on('data',chunk=>digest.update(chunk));
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);
      if(event.type==='decision'&&event.id===selected.focal)(events[event.tick]??={}).decision=event;
      else if(event.type==='physical'&&event.agentId===selected.focal)(events[event.tick]??={}).physical=event;
    }
    assert.equal(digest.digest('hex'),study.arms[arm].trace.sha256);streams[arm]=events;
  }
  const contrasts={};for(const [costly,cheap]of [['all-residual','focal-cheap'],['focal-residual','all-cheap']]){
    const first=streams[costly],second=streams[cheap],ticks=Object.keys(first).map(Number).sort((left,right)=>left-right);
    const value={ticks:ticks.length,firstDifferentCommand:null,firstDifferentIntake:null,maxCommandDifference:0,maxIntakeDifference:0,firstTick:ticks[0],lastTick:ticks.at(-1),initialEnergyDifference:null,lastCostlyEnergy:0,lastCheapEnergy:0,costDifference:0,paidExtraDifference:0};
    for(const tick of ticks){
      const left=first[tick],right=second[tick];assert.ok(left.decision&&left.physical&&right?.decision&&right.physical);
      const commandDifference=Math.max(...left.decision.outputs.map((item,index)=>Math.abs(item-right.decision.outputs[index]))),intakeDifference=Math.abs(left.physical.beneficialEaten-right.physical.beneficialEaten);
      if(commandDifference>1e-12&&value.firstDifferentCommand===null)value.firstDifferentCommand=tick;
      if(intakeDifference>1e-12&&value.firstDifferentIntake===null)value.firstDifferentIntake=tick;
      value.maxCommandDifference=Math.max(value.maxCommandDifference,commandDifference);value.maxIntakeDifference=Math.max(value.maxIntakeDifference,intakeDifference);
      if(value.initialEnergyDifference===null)value.initialEnergyDifference=right.physical.initialEnergy-left.physical.initialEnergy;
      value.costDifference+=left.physical.cost-right.physical.cost;value.paidExtraDifference+=left.physical.paidExtra-right.physical.paidExtra;value.lastCostlyEnergy=left.physical.finalEnergy;value.lastCheapEnergy=right.physical.finalEnergy;
    }
    contrasts[costly+'-vs-'+cheap]=value;
  }
  rows.push({seed:selected.seed,focal:selected.focal,contrasts});
}
const report={schema:1,rows,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Post-outcome focal common-time command/intake and paid-cost prefix comparison; no proof of fixed-neighbor outcomes or unobserved actions.'};
writeFileSync(join(base,'focal-prefix-readback-v2.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows));
