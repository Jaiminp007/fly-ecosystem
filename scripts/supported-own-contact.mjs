import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-steering-development/20261026-v1'),output=join(root,'evidence/supported-own-contact/20261026-v1');assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),development=read(join(source,'protocol.json'));
const files=['scripts/supported-own-contact.mjs','docs/SUPPORTED_OWN_CONTACT_PLAN.md'],protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),files:Object.fromEntries(files.map(path=>[path,sha(readFileSync(join(root,path)))])),scope:'Own-contact, action-selected reused development data; no physical counterfactual or qualification.'};
writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
function probability(model,cue){const features=[1,...cue];for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)features.push(cue[first]*cue[second]);const slot=cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0),dot=model.weights.reduce((sum,value,index)=>sum+value*features[index],0),logit=Math.log(3)+dot/Math.sqrt(11)+model.residuals[slot];return .05+.9/(1+Math.exp(-logit));}
const close=(left,right)=>assert.ok(Math.abs(left-right)<1e-10+1e-10*Math.max(Math.abs(left),Math.abs(right))),rows=[];
for(const history of development.histories){const rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),original=JSON.parse(rowBytes),anchors={},anchorHashes={};
  for(const phase of ['A','B']){const bytes=readFileSync(join(source,'anchors',history.seed+'-protect-'+phase+'.json.gz'));anchorHashes[phase]=sha(bytes);anchors[phase]=JSON.parse(gunzipSync(bytes).toString());}
  const result={seed:history.seed,rowSha256:sha(rowBytes),anchorHashes,probes:{}};
  for(const phase of ['A','B'])for(const saved of ['A','B']){
    const label=history.seed+'-protect-probe-'+phase+'-'+saved,trace=original.traces[label],digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    const pending={},scores={examples:0,positive:0,negative:0,brierA:0,brierB:0,logA:0,logB:0};let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;if(event.type==='decision'){assert.ok(!pending[event.id]);pending[event.id]=event;}
      else if(event.type==='observe'){
        const id=event.own.agentId,decision=pending[id];assert.ok(decision);assert.equal(decision.tick,event.own.tick);delete pending[id];
        if(decision.choice.move!==-1||!decision.choice.accept||!decision.own.odorPresent||!decision.own.contactPresent||!decision.own.contactHomogeneous||event.own.lastFood===0)continue;
        const target=Number(event.own.lastFood>0),predicted={};for(const model of ['A','B'])predicted[model]=probability(anchors[model].state.learners[id].cueTaste,decision.own.cue);
        close(predicted[saved],decision.choice.feedProbability);scores.examples++;scores.positive+=target;scores.negative+=1-target;
        for(const model of ['A','B']){const error=predicted[model]-target;scores['brier'+model]+=error*error;scores['log'+model]-=target*Math.log(predicted[model])+(1-target)*Math.log(1-predicted[model]);}
      }
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);result.probes[phase+'-'+saved]={traceSha256:trace.sha256,scores};
  }
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify({seed:history.seed,probes:result.probes}));
}
const keys=['examples','positive','negative','brierA','brierB','logA','logB'],probes=Object.fromEntries(['A-A','A-B','B-A','B-B'].map(key=>[key,{totals:Object.fromEntries(keys.map(metric=>[metric,rows.reduce((sum,row)=>sum+row.probes[key].scores[metric],0)])),historiesWithExamples:rows.filter(row=>row.probes[key].scores.examples>0).length,brierBWins:rows.filter(row=>{const score=row.probes[key].scores;return score.examples>0&&score.brierB<score.brierA;}).length,logBWins:rows.filter(row=>{const score=row.probes[key].scores;return score.examples>0&&score.logB<score.logA;}).length}]));
writeFileSync(join(output,'results.json'),JSON.stringify({schema:1,probes,scope:protocol.scope},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({probes}));
