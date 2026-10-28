import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const protocol=read(join(base,'protocol.json')),rows=[];
const aggregate=()=>({decisions:0,available:0,midpoint:0,founders:0});
for(const history of protocol.histories){
  const rowPath=join(base,'rows',history.seed+'.json'),row=read(rowPath),arms={};
  for(const arm of protocol.arms){
    const phases={};
    for(const phase of ['A','B','C','D']){
      const counts=row.traces[history.seed+'-'+arm+'-acquire-'+phase]?.counts;
      if(!counts){phases[phase]=null;continue;}
      const totals=aggregate();for(const value of Object.values(counts)){totals.founders++;for(const key of ['decisions','available','midpoint'])totals[key]+=value[key];}
      phases[phase]=totals;
    }
    arms[arm]={phases};
  }
  const anchorPath=join(base,'anchors',history.seed+'-replay-D.json'),anchor=read(anchorPath);
  const memory={founders:0,records:0,phases:{A:0,B:0,C:0,D:0},actions:[0,0],updates:0};
  for(const fly of anchor.world.world.flies){
    const state=anchor.state.learners[fly.id].steering;memory.founders++;memory.updates+=state.updates;
    for(const record of state.memory){
      assert.equal(record.agentId,fly.id);memory.records++;memory.actions[record.action]++;
      const phase=record.tick<=512?'A':record.tick<=1024?'B':record.tick<=1536?'C':'D';memory.phases[phase]++;
    }
  }
  rows.push({seed:history.seed,rowSha256:hash(readFileSync(rowPath)),anchorSha256:hash(readFileSync(anchorPath)),arms,memory});
}
const totals={arms:{},memory:{founders:0,records:0,phases:{A:0,B:0,C:0,D:0},actions:[0,0],updates:0}};
for(const arm of protocol.arms){
  totals.arms[arm]={};for(const phase of ['A','B','C','D']){
    const sum=aggregate();for(const row of rows){const value=row.arms[arm].phases[phase];assert.ok(value);for(const key of Object.keys(sum))sum[key]+=value[key];}
    totals.arms[arm][phase]=sum;
  }
}
for(const row of rows){for(const key of ['founders','records','updates'])totals.memory[key]+=row.memory[key];
  for(const phase of ['A','B','C','D'])totals.memory.phases[phase]+=row.memory.phases[phase];
  for(const action of [0,1])totals.memory.actions[action]+=row.memory.actions[action];}
const report={schema:1,scope:'Post-outcome descriptive census from reported acquisition action counts and surviving own replay memories; not causal or fresh validation.',rows,totals};
writeFileSync(join(base,'support-census.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(totals));
