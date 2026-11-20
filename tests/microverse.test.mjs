import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Microverse,makeRule,valence,KINDS} from '../microverse/sim.mjs';
import {STRAINS} from '../microverse/strains.mjs';
import {CONFIG} from '../microverse/config.mjs';

const world=(names,seed=7)=>new Microverse(seed,Object.fromEntries(names.map(n=>[n,STRAINS[n]])),CONFIG);
const run=(w,ticks)=>{for(let t=0;t<ticks&&w.flies.length;t++)w.step();return w;};

test('microverse is deterministic for a seed and differs across seeds',()=>{
  const a=run(world(['SELF','FIXED'],11),800).snapshot(),b=run(world(['SELF','FIXED'],11),800).snapshot(),c=run(world(['SELF','FIXED'],12),800).snapshot();
  assert.deepEqual(a,b);assert.notDeepEqual(a,c);
});

test('chemistry is balanced and follows the hidden rule',()=>{
  const w=world(['FIXED']);
  assert.equal(w.codes.length,KINDS);assert.equal(w.kindValence.filter(v=>v>0).length,KINDS/2);
  w.codes.forEach((bits,k)=>assert.equal(w.kindValence[k],valence(w.rule,bits)));
  for(const f of ['pairs','staircase','triples','single'])assert.ok(makeRule(f,3).target.length>0);
});

test('a short world stays finite, breeds, and keeps energy within bounds',()=>{
  const w=run(world(['SELF']),1500);
  assert.ok(w.flies.length>0&&w.stats.births>0);
  for(const f of w.flies){assert.ok(Number.isFinite(f.energy)&&f.energy>0&&f.energy<=w.cfg.maxEnergy);assert.ok(f.brain.taste.w.every(Number.isFinite)&&f.brain.move.w.every(Number.isFinite));}
  assert.ok(w.flies.length<=w.cfg.capacity);
});

test('controls behave as defined: FIXED never rewrites, ORACLE is born with the rule, FROZEN never learns',()=>{
  const w=run(world(['FIXED','ORACLE','FROZEN']),600);
  for(const f of w.flies){
    if(f.strain==='FIXED')assert.deepEqual(f.brain.taste.masks,STRAINS.FIXED.tasteMasks);
    if(f.strain==='FROZEN'){assert.ok(f.brain.taste.w.every(x=>x===0));}
  }
  const o=world(['ORACLE']);for(const f of o.flies)for(const t of o.rule.target)assert.ok(f.brain.taste.masks.includes(t));
});

test('self-revision adds taste features from evidence; learned weights are not inherited',()=>{
  const w=run(world(['SELF']),3000);
  assert.ok(w.flies.some(f=>f.brain.taste.masks.length>STRAINS.SELF.tasteMasks.length));
  const parent=w.flies.find(f=>f.brain.taste.w.some(x=>x!==0));assert.ok(parent);
  const child=w.spawn(parent.strain,null,parent,parent.x,parent.y,25,parent.gen+1);
  assert.ok(child.brain.taste.w.every(x=>x===0)&&child.brain.move.masks.length===child.brain.move.w.length);
  assert.deepEqual(child.brain.taste.ev,parent.brain.taste.ev);assert.notEqual(child.brain.taste.ev,parent.brain.taste.ev);
});

test('server serves the microverse viewer and its modules',async()=>{
  await mkdir('runs',{recursive:true});const dir=await mkdtemp(resolve('runs/mv-test-'));const port=18767;
  const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),RUNS_DIR:dir},stdio:['ignore','pipe','pipe']});
  try{
    await new Promise((ok,fail)=>{const t=setTimeout(()=>fail(new Error('startup timeout')),6000);child.stdout.once('data',()=>{clearTimeout(t);ok();});child.once('error',fail);});
    const base=`http://127.0.0.1:${port}`;
    for(const [p,type] of [['/microverse','text/html'],['/microverse.js','text/javascript'],['/microverse/sim.mjs','text/javascript'],['/microverse/strains.mjs','text/javascript'],['/microverse/config.mjs','text/javascript']]){
      const r=await fetch(base+p);assert.equal(r.status,200,p);assert.equal(r.headers.get('content-type'),type,p);}
    assert.equal((await fetch(base+'/microverse/suite.mjs')).status,404);
    assert.match(await (await fetch(base+'/')).text(),/href="\/microverse"/);
  }finally{child.kill('SIGTERM');await once(child,'exit');await rm(dir,{recursive:true,force:true});}
});
