import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const python=process.env.SARSA_AUDIT_PYTHON || resolve('.venv-research/Scripts/python.exe');

test('supplement compares both declared conservation bounds and preserves every other endpoint check', () => {
  const script=`import runpy,math
a=runpy.run_path('scripts/audit-tick-development-supplemental.py')
core=runpy.run_path('scripts/audit-tick-actor-critic.py')
d=dict(endpoints=0,maxRecordedResidual=0.,maxIndependentResidual=0.,maxResidualDifference=0.)
compare=a['conservation_same'](core['same'],d)
actual=dict(accountingResidual=1.0686562745831907e-11,value=3.,founders=24)
expected=dict(accountingResidual=3.7971403799019754e-11,value=3.,founders=24)
try: core['same'](actual,expected,'endpoint')
except AssertionError: pass
else: raise AssertionError('Original failure not reproduced')
compare(actual,expected,'endpoint')
assert d['endpoints']==1 and d['maxResidualDifference']>1e-12
for changed,other in [(dict(actual,accountingResidual=1e-7),expected),(actual,dict(expected,accountingResidual=-1e-7)),(dict(actual,value=3.1),expected),(dict(actual,founders=1),expected),(dict(actual,accountingResidual=math.nan),expected)]:
    try: compare(changed,other,'endpoint')
    except AssertionError: pass
    else: raise AssertionError('Corruption accepted')
try: compare(1.,2.,'other')
except AssertionError: pass
else: raise AssertionError('Other numeric checks changed')
`;
  const result=spawnSync(python,['-B','-c',script],{encoding: 'utf8'});
  assert.equal(result.status,0,result.stderr);
});
