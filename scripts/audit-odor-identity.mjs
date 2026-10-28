import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {odorIdentityFeatures} from '../learning/odor-identity.mjs';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {digest} from '../learning/intervention-study.mjs';

const directory=resolve(process.argv[2]),sourceSha256={},sources={};
for(const file of ['engine.mjs','challenges.mjs','scripts/audit-odor-identity.mjs','scripts/audit-odor-identity.py','tests/odor-identity.test.mjs','docs/ODOR_IDENTITY_DESIGN.md',
  ...(await readdir('learning')).filter(name=>name.endsWith('.mjs')).map(name=>`learning/${name}`)]){
  sources[file]=await readFile(file);sourceSha256[file]=digest(sources[file]);
}
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
for(const[file,bytes]of Object.entries(sources)){const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}
const protocol={schema:1,kind:'odor-identity-algebra-v1',createdAt:new Date().toISOString(),sourceSha256,
  energy:[.1,.5,.9],proximity:[0,.5,1],previousIntake:[-1,0,1],walls:[[0,0],[1,0],[0,1]],histories:['empty','neutral','fixed-cue'],
  scope:'Deterministic cue-only Walsh parity representation. No worlds, rewards, fitting, learned policy, transfer qualification or RSI. Orthogonal codes fix recorded sensory collisions but do not prove functional interference or memory pressure. A separate learner pressure test is required.'};
await writeFile(join(directory,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const contexts=[];
for(const energy of protocol.energy)for(const proximity of protocol.proximity)for(const previousIntake of protocol.previousIntake)for(const walls of protocol.walls)for(const history of protocol.histories){
  const patterns=[];
  for(let pattern=0;pattern<16;pattern++){
    const bits=Array.from({length:4},(_,index)=>pattern>>index&1?1:-1),raw=Array(17).fill(0);
    raw[0]=1;raw[3]=proximity;raw[4]=energy;raw[10]=walls[0];raw[11]=walls[1];raw[13]=previousIntake;raw[16]=1;
    const state={work:{scalarOperations:0},rngState:41,history:history==='empty'?[]:[{choice:1,observation:Array(17).fill(history==='neutral'?0:1)}]},
      before=structuredClone(state),features=odorIdentityFeatures(state,cueObservation(raw,bits));
    assert.deepEqual({...state,work:before.work},before);assert.ok(state.work.scalarOperations>0);
    patterns.push({bits,features,operations:state.work.scalarOperations});
  }
  contexts.push({energy,proximity,previousIntake,walls,history,patterns});
}
const neutral=odorIdentityFeatures({work:{scalarOperations:0}},cueObservation(Array(17).fill(0),[0,0,0,0]));
await writeFile(join(directory,'codes.json'),JSON.stringify({schema:1,protocolSha256:digest(await readFile(join(directory,'protocol.json'))),contexts,neutral},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({contexts:contexts.length,featureEvaluations:contexts.length*16,learnerQualification:false}));
