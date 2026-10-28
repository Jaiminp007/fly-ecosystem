import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/taste-steering-crossover/20261026-v1'),output=join(root,'evidence/steering-target-census/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),prior=read(join(source,'protocol.json'));
for(const [name,digest]of Object.entries(prior.sourceSha256))assert.equal(hash(readFileSync(join(source,'sources',name))),digest);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(source,'sources/learning/odor-routed-experiment.mjs')).href);
const protocol={schema:1,sourceProtocolSha256:hash(readFileSync(join(source,'protocol.json'))),scriptSha256:hash(readFileSync(fileURLToPath(import.meta.url))),planSha256:hash(readFileSync(join(root,'docs/STEERING_TARGET_CENSUS_PLAN.md'))),scope:'Post-outcome read-only target census; valence is evaluator-only and not a learner input.'};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const empty=()=>({decisions:0,available:0,classes:{good:{native:0,midpoint:0},mixed:{native:0,midpoint:0},bad:{native:0,midpoint:0}},cueDiffersFromOwn:0,predictor:{goodCount:0,badCount:0,goodAcceptanceSum:0,badAcceptanceSum:0}});
function acceptance(weights,cue){const feature=[1,...cue];for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)feature.push(cue[first]*cue[second]);const logit=Math.log(3)+weights.reduce((sum,weight,index)=>sum+weight*feature[index],0)/Math.sqrt(11);return .05+.9/(1+Math.exp(-logit));}
const rows=[];
for(const input of prior.inputs){
  const seed=input.history.seed,row=read(join(source,'rows',seed+'.json'));
  for(const phase of ['A','B'])for(const arm of ['AA','AB']){
    const label=seed+'-'+phase+'-'+arm,initial=read(join(source,'starts',label+'.json')),final=read(join(source,'finals',label+'.json')),run=OdorRoutedExperiment.restore(initial),counts=empty(),sensed={};
    const original=run.world.sensors.bind(run.world);
    Object.defineProperty(run.world,'sensors',{configurable:true,enumerable:false,value:(fly,foodIndex,agentIndex,challenge)=>{
      const observer={nearby:(body,radius)=>{const found=foodIndex.nearby(body,radius);sensed[fly.id]=found;return found;}};return original(fly,observer,agentIndex,challenge);
    }});
    const digest=createHash('sha256');let events=0;run.attach(event=>{
      digest.update(JSON.stringify(event)+'\n');events++;if(event.type!=='decision')return;counts.decisions++;if(!event.available)return;counts.available++;
      const patches=sensed[event.id].filter(patch=>patch.amount>.06),indices=event.recommendation.pair;assert.equal(indices.length,2);assert.ok(indices.every(index=>index>=0&&index<patches.length));
      const selected=indices.map(index=>patches[index]),state=run.learners[event.id],fly=run.world.flies.find(body=>body.id===event.id),cosine=Math.cos(fly.heading),sine=Math.sin(fly.heading);
      for(const [position,index]of indices.entries()){
        const patch=selected[position],point=state.spatialPoints[index],dx=patch.x-fly.x,dy=patch.y-fly.y;
        assert.ok(Math.abs(point[0]-(dx*cosine+dy*sine))<1e-9&&Math.abs(point[1]-(-dx*sine+dy*cosine))<1e-9&&point[2]===patch.amount);
        const matches=run.codebook[phase].filter(item=>item.bits.every((value,bit)=>value===patch.cue[bit]));assert.equal(matches.length,1);assert.equal(matches[0].valence,patch.valence);
        const probability=acceptance(state.taste.weights,patch.cue),good=patch.valence===1;counts.predictor[good?'goodCount':'badCount']++;counts.predictor[good?'goodAcceptanceSum':'badAcceptanceSum']+=probability;
      }
      const positives=selected.filter(patch=>patch.valence===1).length,category=positives===2?'good':positives===0?'bad':'mixed';counts.classes[category][event.steering.action?'midpoint':'native']++;
      if(selected.some(patch=>patch.cue.some((value,index)=>value!==event.own.cue[index])))counts.cueDiffersFromOwn++;
    });
    const endpoint=run.advance(prior.ticks);run.attach(null);assert.deepEqual(endpoint,row.phases[phase].arms[arm].endpoint);assert.deepEqual(run.checkpoint(false),final);
    assert.equal(events,row.phases[phase].arms[arm].trace.events);assert.equal(digest.digest('hex'),row.phases[phase].arms[arm].trace.sha256);rows.push({seed,phase,arm,...counts});
  }
  console.log(JSON.stringify({seed,replays:rows.length}));
}
const summary=Object.fromEntries(['A','B'].map(phase=>[phase,Object.fromEntries(['AA','AB'].map(arm=>{const records=rows.filter(row=>row.phase===phase&&row.arm===arm),sum=empty();
  for(const record of records){sum.decisions+=record.decisions;sum.available+=record.available;sum.cueDiffersFromOwn+=record.cueDiffersFromOwn;
    for(const category of ['good','mixed','bad'])for(const action of ['native','midpoint'])sum.classes[category][action]+=record.classes[category][action];
    for(const key of Object.keys(sum.predictor))sum.predictor[key]+=record.predictor[key];}return [arm,sum];}))]));
const result={schema:1,scope:protocol.scope,rows,summary};writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({summary}));
