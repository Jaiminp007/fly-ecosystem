import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,relative,sep,dirname} from 'node:path';
import {digest} from '../learning/intervention-study.mjs';
import {diagnosePolicyRecord} from '../learning/tick-policy-diagnosis.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export function policyDiagnosisSourceHashes() {
  const sources={},visit=path => {
    const name=relative(root,path).split(sep).join('/'); assert.ok(name && !name.startsWith('../') && !name.startsWith('/'));
    if (Object.hasOwn(sources,name)) return;
    const bytes=readFileSync(path); sources[name]=digest(bytes);
    if (/\.m?js$/.test(name)) for (const match of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)) visit(resolve(dirname(path),match[1]));
  };
  for (const name of ['scripts/tick-policy-diagnosis.mjs','scripts/extract-tick-policy-diagnosis.py',
    'scripts/audit-tick-policy-diagnosis.py','scripts/audit-tick-actor-critic.py','tests/tick-policy-diagnosis.test.mjs']) visit(resolve(root,name));
  return Object.fromEntries(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b,'en')));
}
export function evaluatePolicyFile(path) {
  const bytes=readFileSync(path),input=JSON.parse(bytes);
  return {...diagnosePolicyRecord(input),inputSha256: digest(bytes),sources: policyDiagnosisSourceHashes()};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [source,output]=process.argv.slice(2); assert.ok(source && output);
  writeFileSync(output,JSON.stringify(evaluatePolicyFile(source))+'\n',{flag: 'wx'});
}
