import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-steering-development/20261026-v1'),output=join(root,'evidence/supported-pressure-census/20261026-v1');
assert.ok(existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),previous=read(join(source,'protocol.json'));
const protocol=read(join(output,'protocol.json'));assert.equal(hash(readFileSync(join(source,'protocol.json'))),protocol.sourceProtocol);for(const [path,digest]of Object.entries(protocol.files))assert.equal(hash(readFileSync(join(root,path))),digest);
function rng(seed){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
function taste(model,cue,odor){
  if(!odor)return 1;const phi=[1,cue[0],cue[1],cue[2],cue[3]];phi.push(cue[0]*cue[1],cue[0]*cue[2],cue[0]*cue[3],cue[1]*cue[2],cue[1]*cue[3],cue[2]*cue[3]);
  let slot=0,dot=0;for(let position=0;position<4;position++)if(cue[position]===1)slot+=2**position;
  for(let position=0;position<11;position++)dot+=model.weights[position]*phi[position];
  return .05+.9/(1+Math.exp(-(Math.log(3)+dot/Math.sqrt(11)+model.residuals[slot])));
}
function steering(model,cue,features){
  let slot=0;if(cue.some(value=>value!==0)){slot=1;for(let index=0;index<4;index++)if(cue[index]===1)slot+=2**index;}
  const output=[0,0];for(let action=0;action<2;action++)for(let index=0;index<8;index++)output[action]+=(model.weights[action][index]+model.contextWeights[slot][action][index])*features[index];return output;
}
const close=(left,right)=>assert.ok(Math.abs(left-right)<1e-10+1e-10*Math.max(Math.abs(left),Math.abs(right))),rows=[];
for(const history of previous.histories){
  const rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),row=JSON.parse(rowBytes),anchors={},anchorHashes={};
  for(const phase of ['A','B','D']){const bytes=readFileSync(join(source,'anchors',history.seed+'-protect-'+phase+'.json.gz'));anchorHashes[phase]=hash(bytes);anchors[phase]=JSON.parse(gunzipSync(bytes).toString());}
  for(const fly of anchors.D.world.world.flies)for(const route of ['present','absent'])assert.deepEqual(anchors.A.state.learners[fly.id].banks[route].weights,anchors.B.state.learners[fly.id].banks[route].weights);
  const result={seed:history.seed,rowSha256:hash(rowBytes),anchorHashes,trajectories:{}};
  for(const saved of ['A','B']){
    const label=history.seed+'-protect-probe-A-'+saved,startBytes=readFileSync(join(source,'starts',label+'.json.gz')),start=JSON.parse(gunzipSync(startBytes).toString()),random=Object.fromEntries(Object.entries(start.state.learners).map(([id,state])=>[id,state.taste.rngState])),trace=row.traces[label],digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
    const counts={decisions:0,odor:0,eligible:0,available:0,tasteChanges:0,eligibleTasteChanges:0,steeringChanges:0,bothChanges:0,probabilityDelta:0,absoluteProbabilityDelta:0};let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;if(event.type!=='decision')continue;counts.decisions++;random[event.id]=rng(random[event.id]);const draw=random[event.id]/4294967296;
      const tasteValues={},steeringValues={};for(const phase of ['A','B']){const state=anchors[phase].state.learners[event.id];tasteValues[phase]=taste(state.cueTaste,event.own.cue,event.own.odorPresent);steeringValues[phase]=steering(state.steering,event.own.cue,event.features);}
      close(tasteValues[saved],event.choice.feedProbability);assert.equal(draw<tasteValues[saved],event.choice.accept);for(let action=0;action<2;action++)close(steeringValues[saved][action],event.steering.predictions[action]);
      const tasteChange=(draw<tasteValues.A)!==(draw<tasteValues.B),steeringChange=event.available&&(steeringValues.A[1]>steeringValues.A[0])!==(steeringValues.B[1]>steeringValues.B[0]),eligible=event.choice.move===-1&&event.own.odorPresent&&event.own.contactPresent&&event.own.contactHomogeneous;
      counts.odor+=Number(event.own.odorPresent);counts.eligible+=Number(eligible);counts.available+=Number(event.available);counts.tasteChanges+=Number(tasteChange);counts.eligibleTasteChanges+=Number(eligible&&tasteChange);counts.steeringChanges+=Number(steeringChange);counts.bothChanges+=Number(tasteChange&&steeringChange);
      counts.probabilityDelta+=tasteValues.B-tasteValues.A;counts.absoluteProbabilityDelta+=Math.abs(tasteValues.B-tasteValues.A);
    }
    assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);result.trajectories[saved]={startSha256:hash(startBytes),traceSha256:trace.sha256,counts};
  }
  assert.deepEqual(result,read(join(output,history.seed+'.json')));rows.push(result);console.log(JSON.stringify({seed:history.seed}));
}
const keys=['decisions','odor','eligible','available','tasteChanges','eligibleTasteChanges','steeringChanges','bothChanges','probabilityDelta','absoluteProbabilityDelta'],totals=Object.fromEntries(['A','B'].map(phase=>[phase,Object.fromEntries(keys.map(key=>[key,rows.reduce((sum,row)=>sum+row.trajectories[phase].counts[key],0)]))]));
assert.deepEqual({schema:1,totals,scope:protocol.scope},read(join(output,'results.json')));const report={schema:1,passed:true,histories:rows.length,decisions:totals.A.decisions+totals.B.decisions,checkerSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Independent taste, steering and factual RNG arithmetic, hashes and aggregate reconstruction; not physical counterfactuals.'};writeFileSync(join(output,'readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));

