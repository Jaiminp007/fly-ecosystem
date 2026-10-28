import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-steering-development/20261026-v1'),output=join(root,'evidence/supported-pressure-prefix/20261026-v1');assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),development=read(join(source,'protocol.json'));
const files=['scripts/supported-pressure-prefix.mjs','docs/SUPPORTED_PRESSURE_PREFIX_PLAN.md'],protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),files:Object.fromEntries(files.map(path=>[path,sha(readFileSync(join(root,path)))])),scope:'Comparison of recorded matched-start prefixes; not a component intervention or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
function tape(path){const digest=createHash('sha256'),stream=createReadStream(path).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));return {digest,iterator:createInterface({input:stream,crlfDelay:Infinity})[Symbol.asyncIterator](),events:0};}
function difference(left,right){
  if(left.type!==right.type)return ['event-type'];
  if(left.type==='decision'){
    if(left.id!==right.id||left.tick!==right.tick)return ['decision-order'];
    const reasons=[];if(JSON.stringify(left.own)!==JSON.stringify(right.own)||JSON.stringify(left.features)!==JSON.stringify(right.features))reasons.push('input');
    if(left.outputs[0]!==right.outputs[0])reasons.push('steering');if(left.outputs[1]!==right.outputs[1])reasons.push('motor');if(left.outputs[2]!==right.outputs[2])reasons.push('taste');
    if(left.outputs[3]!==right.outputs[3]||left.outputs[4]!==right.outputs[4])reasons.push('other-output');if(left.requestedExtra!==right.requestedExtra)reasons.push('extra-cost');return reasons;
  }
  return JSON.stringify(left)===JSON.stringify(right)?[]:[left.type+'-receipt'];
}
const rows=[];
for(const history of development.histories){const rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),original=JSON.parse(rowBytes),result={seed:history.seed,rowSha256:sha(rowBytes),phases:{}};
  for(const phase of ['A','B']){
    const labels=['A','B'].map(saved=>history.seed+'-protect-probe-'+phase+'-'+saved),starts=labels.map(label=>readFileSync(join(source,'starts',label+'.json.gz'))),worlds=starts.map(bytes=>JSON.parse(gunzipSync(bytes).toString()).world);
    assert.deepEqual(worlds[0],worlds[1]);const tapes=labels.map(label=>tape(join(source,'traces',label+'.jsonl.gz')));let first=null,prefix=0;
    while(true){const next=await Promise.all(tapes.map(item=>item.iterator.next()));for(let index=0;index<2;index++)if(!next[index].done)tapes[index].events++;
      if(next.every(item=>item.done))break;if(first!==null)continue;
      if(next.some(item=>item.done)){first={reasons:['trace-length'],eventIndex:prefix};continue;}
      const left=JSON.parse(next[0].value),right=JSON.parse(next[1].value),reasons=difference(left,right);
      if(reasons.length){first={eventIndex:prefix,type:left.type,tick:left.tick??left.own?.tick??null,agentId:left.id??left.agentId??left.own?.agentId??null,reasons,
        ...(left.type==='decision'?{outputs:[left.outputs,right.outputs],requestedExtra:[left.requestedExtra,right.requestedExtra],probabilities:[left.choice.feedProbability,right.choice.feedProbability]}:{})};}else prefix++;
    }
    const traceHashes=tapes.map(item=>item.digest.digest('hex'));for(let index=0;index<2;index++){assert.equal(traceHashes[index],original.traces[labels[index]].sha256);assert.equal(tapes[index].events,original.traces[labels[index]].events);}
    result.phases[phase]={worldSha256:sha(JSON.stringify(worlds[0])),startHashes:starts.map(sha),traceHashes,prefixEvents:prefix,first};
  }
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify(result));
}
const counts=Object.fromEntries(['A','B'].map(phase=>{const tally={};for(const row of rows)for(const reason of row.phases[phase].first?.reasons??['none'])tally[reason]=(tally[reason]??0)+1;return [phase,tally];}));
writeFileSync(join(output,'results.json'),JSON.stringify({schema:1,counts,scope:protocol.scope},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({counts}));
