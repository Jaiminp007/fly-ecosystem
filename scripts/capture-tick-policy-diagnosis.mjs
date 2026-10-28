import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {dirname,relative,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../learning/intervention-study.mjs';
import {policyDiagnosisSourceHashes} from './tick-policy-diagnosis.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const [path,studyPath]=process.argv.slice(2),directory=resolve(path),study=resolve(studyPath);
const sources={},visit=path=>{
  const name=relative(root,path).split(sep).join('/');assert.ok(name && !name.startsWith('../') && !name.startsWith('/'));
  if(Object.hasOwn(sources,name))return;
  const bytes=readFileSync(path);sources[name]=digest(bytes);
  if(/\.m?js$/.test(name))for(const m of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
};
for(const name of [...Object.keys(policyDiagnosisSourceHashes()),'scripts/capture-tick-policy-diagnosis.mjs','scripts/tick-consumption-provenance.mjs',
  'scripts/audit-tick-consumption-provenance.py','learning/contact-cue.mjs','tests/contact-cue.test.mjs',
  'tests/tick-consumption-provenance.test.mjs','docs/CONTACT_CUE_VALUE_DESIGN.md'])visit(resolve(root,name));
for(const name of Object.keys(sources)){
  const target=join(directory,'extended-sources',name);mkdirSync(dirname(target),{recursive:true});copyFileSync(join(root,name),target);
}
const frozen=JSON.parse(readFileSync(join(study,'protocol.json'))).sourceSha256;
for(const [name,sha]of Object.entries(frozen)){
  const source=join(study,'sources',name);assert.equal(digest(readFileSync(source)),sha);
  const target=join(directory,'frozen-study','sources',name);mkdirSync(dirname(target),{recursive:true});copyFileSync(source,target);
}
writeFileSync(join(directory,'source-capture.json'),JSON.stringify({schema:1,sources,frozenSourceSha256:frozen},null,2)+'\n',{flag:'wx'});
