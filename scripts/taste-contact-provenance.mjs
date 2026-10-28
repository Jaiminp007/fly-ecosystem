import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/cue-shared-development/20261026-v1'),output=join(root,'evidence/taste-contact-provenance/20261026-v1');
assert.ok(!existsSync(output));const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const protocol=read(join(source,'protocol.json'));for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(source,'sources',name))),expected);
const {OdorRoutedExperiment}=await import(pathToFileURL(join(source,'sources/learning/odor-routed-experiment.mjs')).href);
const sourceHashes=Object.fromEntries(['scripts/taste-contact-provenance.mjs','docs/TASTE_CONTACT_PROVENANCE_PLAN.md'].map(name=>[name,hash(readFileSync(join(root,name)))]));
const manifest={schema:1,inputProtocolSha256:hash(readFileSync(join(source,'protocol.json'))),sourceHashes,histories:protocol.histories.map(item=>item.seed),scope:'Post-hoc, selected D survivors; diagnostic valences never enter acquisition.'};
mkdirSync(dirname(output),{recursive:true});mkdirSync(output);writeFileSync(join(output,'protocol.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const records=[],retained=[],replays=[];
for(const history of protocol.histories){
  const anchor=read(join(source,'anchors',history.seed+'-cue-shared-D.json')),survivors=new Set(anchor.world.world.flies.map(fly=>fly.id)),row=read(join(source,'rows',history.seed+'.json'));
  for(const phase of ['A','B','C']){
    const label=history.seed+'-cue-shared-acquire-'+phase,start=read(join(source,'starts',label+'.json')),final=read(join(source,'finals',label+'.json'));
    const run=OdorRoutedExperiment.restore(start),digest=createHash('sha256'),pending=new Map();let events=0;
    run.attach(event=>{
      digest.update(JSON.stringify(event)+'\n');events++;
      if(event.type==='decision'&&survivors.has(event.id)&&event.choice.move===-1&&event.choice.accept&&event.own.contactPresent&&event.own.odorPresent){
        const fly=run.world.flies.find(body=>body.id===event.id);assert.ok(fly);
        const patches=run.world.food.map((patch,index)=>({index,distanceSquared:(patch.x-fly.x)**2+(patch.y-fly.y)**2,amount:patch.amount,valence:patch.valence,cue:patch.cue})).filter(patch=>patch.distanceSquared<=225).sort((left,right)=>left.distanceSquared-right.distanceSquared||left.index-right.index);
        assert.ok(patches.length>0);assert.deepEqual(patches[0].cue,event.own.cue);
        pending.set(event.id,{history:history.seed,phase,id:event.id,tick:event.tick,cue:event.own.cue,patches,receipt:null});
      }else if(event.type==='physical'&&pending.has(event.agentId)){
        const entry=pending.get(event.agentId);assert.equal(entry.tick,event.tick);entry.receipt={beneficial:event.beneficialEaten,harmful:event.harmfulEaten,toxin:event.toxinDamage};
      }else if(event.type==='observe'&&pending.has(event.own.agentId)){
        const entry=pending.get(event.own.agentId);assert.equal(entry.tick,event.own.tick);assert.ok(entry.receipt);
        const net=entry.receipt.beneficial-entry.receipt.toxin,lastFood=Math.max(-1,Math.min(1,net));assert.ok(Math.abs(lastFood-event.own.lastFood)<1e-9);
        if(lastFood!==0){entry.target=Number(lastFood>0);entry.agrees=entry.target===Number(entry.patches[0].valence===1);records.push(entry);}
        pending.delete(event.own.agentId);
      }
    });
    run.advance(512);run.attach(null);assert.equal(pending.size,0);assert.deepEqual(run.checkpoint(false),final);
    assert.equal(events,row.traces[label].events);assert.equal(digest.digest('hex'),row.traces[label].sha256);replays.push(label);
  }
  for(const id of survivors)for(const memory of anchor.state.learners[id].taste.memory){
    const matches=records.filter(record=>record.history===history.seed&&record.id===id&&record.tick===memory.tick);
    assert.equal(matches.length,1);const record=matches[0];assert.deepEqual(memory.phi.slice(1,5),record.cue);assert.equal(memory.target,record.target);
    retained.push({history:history.seed,id,tick:memory.tick,agrees:record.agrees});
  }
  console.log(JSON.stringify({seed:history.seed,survivors:survivors.size,examples:records.filter(record=>record.history===history.seed).length}));
}
const aggregate=items=>({count:items.length,disagreements:items.filter(item=>!item.agrees).length,mixed:items.filter(item=>item.receipt.beneficial>0&&item.receipt.toxin>0).length,
  positiveOnly:items.filter(item=>item.receipt.beneficial>0&&item.receipt.toxin===0).length,negativeOnly:items.filter(item=>item.receipt.beneficial===0&&item.receipt.toxin>0).length,
  multipleContacts:items.filter(item=>item.patches.length>1).length,oppositeValenceContact:items.filter(item=>item.patches.some(patch=>patch.valence!==item.patches[0].valence)).length,
  selectedEmpty:items.filter(item=>item.patches[0].amount===0).length});
const result={schema:1,scope:manifest.scope,replays,all:aggregate(records),agree:aggregate(records.filter(item=>item.agrees)),disagree:aggregate(records.filter(item=>!item.agrees)),retained:{count:retained.length,disagreements:retained.filter(item=>!item.agrees).length},records,retained};
writeFileSync(join(output,'results.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...result,records:undefined,retained:result.retained,replays:replays.length}));
