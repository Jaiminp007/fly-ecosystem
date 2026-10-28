import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/cue-shared-development/20261026-v1'),output=join(root,'evidence/cue-shared-exposure/20261026-v1');assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const prior=read(join(base,'protocol.json'));for(const [name,expected]of Object.entries(prior.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const sources=Object.fromEntries(['scripts/census-cue-shared-exposure.mjs','docs/CUE_SHARED_CAUSAL_CENSUS_DESIGN.md'].map(name=>[name,hash(readFileSync(join(root,name)))]));
const inputs=prior.histories.map(history=>{const path=join(base,'rows',history.seed+'.json');return {history,rowSha256:hash(readFileSync(path))};});
write(join(output,'protocol.json'),{schema:1,inputs,sourceSha256:sources,studyProtocolSha256:hash(readFileSync(join(base,'protocol.json'))),
  scope:'Post-outcome factual own-exposure and frozen policy census on reused histories; no counterfactual outcome or causal attribution.'});
for(const name of Object.keys(sources)){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const blank=()=>({decisions:0,present:0,absent:0,available:0,steering:[0,0],moves:[0,0,0],physicalCost:0,intake:0,toxin:0,paidExtra:0});
function add(target,source){for(const key of ['decisions','present','absent','available','physicalCost','intake','toxin','paidExtra'])target[key]+=source[key];for(const key of ['steering','moves'])for(let index=0;index<target[key].length;index++)target[key][index]+=source[key][index];}
function route(cue){if(cue.every(value=>value===0))return 0;assert.ok(cue.every(value=>value===-1||value===1));return 1+cue.reduce((sum,value,index)=>sum+(value===1?2**index:0),0);}
function features(own){const raw=own.raw,contact=own.contactPresent;return [1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),contact?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,contact?raw[13]*.25:0];}
function scores(weights,phi){return weights.map(row=>row.reduce((sum,value,index)=>sum+value*phi[index],0));}
const rows=[];
for(const input of inputs){
  const history=input.history,rowPath=join(base,'rows',history.seed+'.json');assert.equal(hash(readFileSync(rowPath)),input.rowSha256);const study=read(rowPath),arms={};
  for(const arm of prior.arms){
    const anchorPath=join(base,'anchors',history.seed+'-'+arm+'-D.json'),anchor=read(anchorPath),survivors=new Set(anchor.world.world.flies.map(fly=>fly.id)),phases={};
    for(const phase of ['A','B','C','D','transfer']){
      const label=history.seed+'-'+arm+'-'+(phase==='transfer'?'probe-transfer-current':'acquire-'+phase),trace=study.traces[label];assert.ok(trace);
      const start=phase==='transfer'?read(join(base,'starts',label+'.json')):null,byFounder={},pending={},stream=createReadStream(join(base,'traces',label+'.jsonl')),digest=createHash('sha256');
      stream.on('data',chunk=>digest.update(chunk));let events=0;
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
        const event=JSON.parse(line);events++;
        if(event.type==='decision'){
          const id=event.id,state=byFounder[id]??=blank(),own=event.own;assert.equal(own.agentId,id);assert.equal(Boolean(route(own.cue)),own.odorPresent);
          assert.equal(event.choice.route,own.odorPresent?'present':'absent');assert.ok(!pending[id]);pending[id]=event.tick;
          state.decisions++;state[own.odorPresent?'present':'absent']++;state.available+=Number(event.available);state.steering[event.steering.action]++;state.moves[event.choice.action]++;
          if(phase==='transfer'){
            assert.equal(route(own.cue),0);assert.ok(event.choice.accept);
            const model=start.state.learners[id],motor=scores(model.banks.absent.weights,features(own));let move=2;for(let action=1;action>=0;action--)if(motor[action]>motor[move])move=action;
            assert.equal(event.choice.action,move);
            const steering=model.steering.weights.map((weights,action)=>weights.reduce((sum,value,index)=>sum+(value+(arm==='cue-shared'?model.steering.contextWeights[0][action][index]:0))*event.features[index],0));
            assert.deepEqual(event.steering.predictions,steering);assert.equal(event.steering.action,Number(event.available&&steering[1]>steering[0]));
          }
        }else if(event.type==='physical'){
          const id=event.agentId,state=byFounder[id];assert.equal(pending[id],event.tick);delete pending[id];state.physicalCost+=event.cost;state.intake+=event.beneficialEaten;state.toxin+=event.toxinDamage;state.paidExtra+=event.paidExtra;
        }
      }
      assert.equal(Object.keys(pending).length,0);assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);
      const all=blank(),surviving=blank();for(const [id,value]of Object.entries(byFounder)){add(all,value);if(survivors.has(Number(id)))add(surviving,value);}
      phases[phase]={all,surviving,byFounder};
    }
    const anchorA=read(join(base,'anchors',history.seed+'-'+arm+'-A.json'));let absentBankChange=0,sharedChange=0;
    if(arm==='cue-shared')for(const id of survivors){const before=anchorA.state.learners[id].steering,after=anchor.state.learners[id].steering;
      for(let action=0;action<2;action++)for(let index=0;index<8;index++){
        absentBankChange+=Math.abs(after.contextWeights[0][action][index]-before.contextWeights[0][action][index]);sharedChange+=Math.abs(after.weights[action][index]-before.weights[action][index]);
      }}
    arms[arm]={survivors:survivors.size,anchorSha256:hash(readFileSync(anchorPath)),absentBankChange,sharedChange,phases};
  }
  const row={seed:history.seed,arms};write(join(output,'rows',history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:history.seed,cueTransfer:arms['cue-shared'].phases.transfer.all,replayTransfer:arms.replay.phases.transfer.all}));
}
const totals={};for(const arm of prior.arms){totals[arm]={survivors:0,absentBankChange:0,sharedChange:0,phases:{}};
  for(const row of rows){totals[arm].survivors+=row.arms[arm].survivors;totals[arm].absentBankChange+=row.arms[arm].absentBankChange;totals[arm].sharedChange+=row.arms[arm].sharedChange;}
  for(const phase of ['A','B','C','D','transfer']){const all=blank(),surviving=blank();for(const row of rows){add(all,row.arms[arm].phases[phase].all);add(surviving,row.arms[arm].phases[phase].surviving);}totals[arm].phases[phase]={all,surviving};}}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
write(join(output,'results.json'),{schema:1,totals,scope:'Post-outcome descriptive factual exposure, reconstructed frozen commands and D-survivor support; not causal or qualification evidence.'});console.log(JSON.stringify(totals));
