import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {interval95} from '../learning/tasks.mjs';
const directory=resolve(process.argv[2]||''),r=JSON.parse(await readFile(join(directory,'results.json'))),p=JSON.parse(await readFile(join(directory,'protocol.json')));
assert.deepEqual(r.protocol,p);assert.deepEqual(r.rows.map(x=>x.seed),p.seeds);assert.equal(new Set(p.seeds).size,p.seeds.length);let maxAccountingResidual=0;
for(const row of r.rows)for(const arms of Object.values(row.probes)){assert.equal(new Set(Object.values(arms).map(x=>x.founderHash)).size,1);for(const arm of Object.values(arms)){maxAccountingResidual=Math.max(maxAccountingResidual,Math.abs(arm.accountingResidual));assert.ok(Math.abs(arm.accountingResidual)<1e-6);}}
for(const landscape of ['a','b'])for(const[a,b]of [['afterB','empty'],['afterB','atA'],['atA','empty']])for(const k of ['energy','population'])assert.deepEqual(interval95(r.rows.map(row=>row.probes[landscape][a][k]-row.probes[landscape][b][k])),r.summary[landscape][a+'Minus'+b][k]);
for(const[file,hash]of Object.entries(p.sourceSha256))assert.equal(createHash('sha256').update(await readFile(join(directory,'sources',file))).digest('hex'),hash);
if(p.seedSource){const bytes=await readFile(join(directory,'seed-source.json')),source=JSON.parse(bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),p.seedSource.sha256);assert.deepEqual((source.protocol||source).seeds,p.seeds);}
assert.equal(createHash('sha256').update(await readFile(join(directory,'reference.json'))).digest('hex'),p.referenceSha256);
const audit={at:new Date().toISOString(),seedCount:p.seeds.length,maxAccountingResidual,reusedProbeSeeds:Boolean(p.seedSource),checks:['unique seeds and full outcomes','matched within-probe bodies','energy ledger after recorded interventions','all paired probe intervals recomputed','archived policy reference and source hashes','seed source hash and exact pairing when supplied'],scope:'Exploratory intervention among surviving bodies with standardized probe budgets. No prespecified noninferiority/new-skill gate; A/B fields are not guaranteed distinct skills. No ecological or RSI promotion.'};await writeFile(join(directory,'audit.json'),JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2));
