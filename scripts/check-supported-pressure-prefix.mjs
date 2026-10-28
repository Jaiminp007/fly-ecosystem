import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-steering-development/20261026-v1'),base=join(root,'evidence/supported-pressure-prefix/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),development=read(join(source,'protocol.json'));
assert.equal(sha(readFileSync(join(source,'protocol.json'))),protocol.sourceProtocol);for(const [path,digest]of Object.entries(protocol.files))assert.equal(sha(readFileSync(join(root,path))),digest);
const counts={A:{},B:{}};let paired=0,events=0;
for(const history of development.histories){const result=read(join(base,history.seed+'.json')),rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),row=JSON.parse(rowBytes);assert.equal(sha(rowBytes),result.rowSha256);
  for(const phase of ['A','B']){const saved=result.phases[phase],labels=['A','B'].map(model=>history.seed+'-protect-probe-'+phase+'-'+model),starts=labels.map(label=>readFileSync(join(source,'starts',label+'.json.gz'))),worlds=starts.map(bytes=>JSON.parse(gunzipSync(bytes)).world);
    assert.deepEqual(starts.map(sha),saved.startHashes);assert.deepEqual(worlds[0],worlds[1]);assert.equal(sha(JSON.stringify(worlds[0])),saved.worldSha256);
    const traces=labels.map(label=>gunzipSync(readFileSync(join(source,'traces',label+'.jsonl.gz'))));assert.deepEqual(traces.map(sha),saved.traceHashes);
    const lists=traces.map((buffer,index)=>{assert.equal(sha(buffer),row.traces[labels[index]].sha256);const lines=buffer.toString().split('\n');assert.equal(lines.pop(),'');assert.equal(lines.length,row.traces[labels[index]].events);return lines;});
    let first=null,prefix=0;for(let index=0;index<Math.max(lists[0].length,lists[1].length);index++){
      if(index>=lists[0].length||index>=lists[1].length){first={reasons:['trace-length'],eventIndex:index};break;}
      const left=JSON.parse(lists[0][index]),right=JSON.parse(lists[1][index]),reasons=[];
      if(left.type!==right.type)reasons.push('event-type');else if(left.type==='decision'){
        if(left.id!==right.id||left.tick!==right.tick)reasons.push('decision-order');else{
          if(JSON.stringify(left.own)!==JSON.stringify(right.own)||JSON.stringify(left.features)!==JSON.stringify(right.features))reasons.push('input');
          if(left.outputs[0]!==right.outputs[0])reasons.push('steering');if(left.outputs[1]!==right.outputs[1])reasons.push('motor');if(left.outputs[2]!==right.outputs[2])reasons.push('taste');
          if(left.outputs[3]!==right.outputs[3]||left.outputs[4]!==right.outputs[4])reasons.push('other-output');if(left.requestedExtra!==right.requestedExtra)reasons.push('extra-cost');
        }
      }else if(JSON.stringify(left)!==JSON.stringify(right))reasons.push(left.type+'-receipt');
      if(reasons.length){first={eventIndex:index,type:left.type,tick:left.tick??left.own?.tick??null,agentId:left.id??left.agentId??left.own?.agentId??null,reasons,...(left.type==='decision'?{outputs:[left.outputs,right.outputs],requestedExtra:[left.requestedExtra,right.requestedExtra],probabilities:[left.choice.feedProbability,right.choice.feedProbability]}:{})};break;}prefix++;
    }
    assert.equal(prefix,saved.prefixEvents);assert.deepEqual(first,saved.first);for(const reason of first?.reasons??['none'])counts[phase][reason]=(counts[phase][reason]??0)+1;paired++;events+=lists[0].length+lists[1].length;
  }
}
assert.deepEqual(counts,read(join(base,'results.json')).counts);const report={schema:1,passed:true,paired,events,checkerSha256:sha(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent compressed trace hashes and prefix reconstruction, not later component attribution or independent physics.'};
writeFileSync(join(base,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
