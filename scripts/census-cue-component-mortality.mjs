import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),mask=join(root,'evidence/cue-shared-transfer-components/20261026-v1'),study=join(root,'evidence/cue-shared-development/20261026-v1'),output=join(root,'evidence/cue-component-mortality/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const close=(left,right)=>assert.ok(Math.abs(left-right)<=1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right)),`${left} != ${right}`);
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const prior=read(join(mask,'protocol.json')),inputs=prior.inputs.map(input=>{
  const maskRow=join(mask,'rows',input.history.seed+'.json'),studyRow=join(study,'rows',input.history.seed+'.json');
  return {...input,maskRowSha256:hash(readFileSync(maskRow)),studyRowSha256:hash(readFileSync(studyRow))};
});
const names=['scripts/census-cue-component-mortality.mjs','docs/CUE_COMPONENT_MORTALITY_CENSUS_DESIGN.md'],sources=Object.fromEntries(names.map(name=>[name,hash(readFileSync(join(root,name)))]));
write(join(output,'protocol.json'),{schema:1,inputs,sourceSha256:sources,arms:['residual-only','full','native','native-full'],
  scope:'Post-outcome factual identity, physical-receipt and cost census; no causal focal intervention or qualification.'});
for(const name of names){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[],discordances=[];
for(const input of inputs){
  const seed=input.history.seed,maskRowPath=join(mask,'rows',seed+'.json'),studyRowPath=join(study,'rows',seed+'.json');
  assert.equal(hash(readFileSync(maskRowPath)),input.maskRowSha256);assert.equal(hash(readFileSync(studyRowPath)),input.studyRowSha256);
  const maskRow=read(maskRowPath),studyRow=read(studyRowPath),arms={};let commonWorld=null;
  for(const arm of ['residual-only','full','native','native-full']){
    const cheap=arm==='native-full',folder=cheap?study:mask,label=cheap?seed+'-cue-shared-probe-transfer-native-full':seed+'-'+arm;
    const initial=read(join(folder,'starts',label+'.json')),final=read(join(folder,'finals',label+'.json')),trace=cheap?studyRow.traces[label]:maskRow.arms[arm].trace;
    const worldHash=hash(JSON.stringify(initial.world));if(commonWorld===null)commonWorld=worldHash;else assert.equal(worldHash,commonWorld);
    const living=new Map(final.world.world.flies.map(fly=>[fly.id,fly])),bodies={};
    for(const fly of initial.world.world.flies){const state=initial.state.learners[fly.id];bodies[fly.id]={id:fly.id,initialEnergy:fly.energy,initialAge:fly.age,lifespan:fly.genome.traits.lifespan,initialDebt:state.charge.outstandingEnergy,
      alive:living.has(fly.id),finalEnergy:living.get(fly.id)?.energy??0,finalDebt:final.state.learners[fly.id].charge.outstandingEnergy,decisions:0,midpoint:0,moves:[0,0,0],intake:0,toxin:0,cost:0,paidExtra:0,lastTick:null,last:[]};}
    const stream=createReadStream(join(folder,'traces',label+'.jsonl')),digest=createHash('sha256'),pending={};stream.on('data',chunk=>digest.update(chunk));let events=0;
    for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
      const event=JSON.parse(line);events++;
      if(event.type==='decision'){
        const body=bodies[event.id];assert.ok(body&&!pending[event.id]);pending[event.id]=event.tick;body.decisions++;body.midpoint+=Number(event.steering?.action===1);body.moves[event.choice.action]++;body.lastTick=event.tick;
        body.last.push({tick:event.tick,observedEnergy:event.own?.energy??null,move:event.choice.move,steering:event.steering?.action??0,available:event.available??false,
          recommendation:event.recommendation?.point??null,guard:event.guard??null});if(body.last.length>12)body.last.shift();
      }else if(event.type==='physical'){
        const body=bodies[event.agentId];assert.equal(pending[event.agentId],event.tick);delete pending[event.agentId];
        close(event.finalEnergy,event.initialEnergy-event.cost+event.beneficialEaten-event.toxinDamage);
        body.intake+=event.beneficialEaten;body.toxin+=event.toxinDamage;body.cost+=event.cost;body.paidExtra+=event.paidExtra;
        body.last.at(-1).receipt={initialEnergy:event.initialEnergy,finalEnergy:event.finalEnergy,cost:event.cost,paidExtra:event.paidExtra,intake:event.beneficialEaten,toxin:event.toxinDamage};
      }
    }
    assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);
    for(const body of Object.values(bodies)){
      assert.ok(body.last.length>0);const receipt=body.last.at(-1).receipt;
      if(body.alive){body.deathCause=null;close(body.finalEnergy,receipt.finalEnergy);}
      else{body.deathCause=receipt.finalEnergy<=0?'energy':'age';if(body.deathCause==='age')assert.ok(body.initialAge+(body.lastTick-initial.world.world.tick)*.1>body.lifespan-1e-8);}
    }
    arms[arm]={startWorldSha256:worldHash,bodies};
  }
  for(const [id,candidate]of Object.entries(arms['residual-only'].bodies)){
    const reference=arms['native-full'].bodies[id];assert.ok(reference);if(candidate.alive!==reference.alive)discordances.push({seed,id:Number(id),classification:candidate.alive?'saved':'lost',
      candidateCause:candidate.deathCause,referenceCause:reference.deathCause,candidateLastTick:candidate.lastTick,referenceLastTick:reference.lastTick});
  }
  const row={seed,arms};write(join(output,'rows',seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed,discordances:discordances.filter(item=>item.seed===seed)}));
}
const totals={};for(const arm of ['residual-only','full','native','native-full']){
  const value={founders:0,alive:0,energyDeaths:0,ageDeaths:0,decisions:0,midpoint:0,intake:0,toxin:0,cost:0,paidExtra:0,initialDebt:0,finalDebt:0};
  for(const row of rows)for(const body of Object.values(row.arms[arm].bodies)){
    value.founders++;value.alive+=Number(body.alive);value.energyDeaths+=Number(body.deathCause==='energy');value.ageDeaths+=Number(body.deathCause==='age');
    for(const key of ['decisions','midpoint','intake','toxin','cost','paidExtra','initialDebt','finalDebt'])value[key]+=body[key];
  }
  totals[arm]=value;
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const result={schema:1,qualified:false,totals,discordances,scope:'Post-outcome factual matched-body census, not causal or qualification evidence.'};write(join(output,'results.json'),result);console.log(JSON.stringify(result));
