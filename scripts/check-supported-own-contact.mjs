import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-steering-development/20261026-v1'),output=join(root,'evidence/supported-own-contact/20261026-v1');assert.ok(existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),development=read(join(source,'protocol.json'));
const protocol=read(join(output,'protocol.json'));assert.equal(sha(readFileSync(join(source,'protocol.json'))),protocol.sourceProtocol);for(const [path,digest]of Object.entries(protocol.files))assert.equal(sha(readFileSync(join(root,path))),digest);
function probability(model,cue){
  const phi=[1,cue[0],cue[1],cue[2],cue[3],cue[0]*cue[1],cue[0]*cue[2],cue[0]*cue[3],cue[1]*cue[2],cue[1]*cue[3],cue[2]*cue[3]];
  let slot=0,dot=0;for(let index=0;index<4;index++)if(cue[index]===1)slot+=2**index;
  for(let index=0;index<11;index++)dot+=model.weights[index]*phi[index];
  return .05+.9/(1+Math.exp(-(Math.log(3)+dot/Math.sqrt(11)+model.residuals[slot])));
}
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
  assert.deepEqual(result,read(join(output,history.seed+'.json')));rows.push(result);console.log(JSON.stringify({seed:history.seed}));
}
const keys=['examples','positive','negative','brierA','brierB','logA','logB'],probes=Object.fromEntries(['A-A','A-B','B-A','B-B'].map(key=>[key,{totals:Object.fromEntries(keys.map(metric=>[metric,rows.reduce((sum,row)=>sum+row.probes[key].scores[metric],0)])),historiesWithExamples:rows.filter(row=>row.probes[key].scores.examples>0).length,brierBWins:rows.filter(row=>{const score=row.probes[key].scores;return score.examples>0&&score.brierB<score.brierA;}).length,logBWins:rows.filter(row=>{const score=row.probes[key].scores;return score.examples>0&&score.logB<score.logA;}).length}]));
assert.deepEqual({schema:1,probes,scope:protocol.scope},read(join(output,'results.json')));const report={schema:1,passed:true,histories:rows.length,examples:Object.values(probes).reduce((sum,probe)=>sum+probe.totals.examples,0),checkerSha256:sha(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent own-contact pairing, prediction arithmetic and trace hashes; no physical counterfactual or qualification.'};writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));

