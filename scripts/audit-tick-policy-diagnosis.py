import argparse
import hashlib
import json
import math
import re
import runpy
from pathlib import Path

CORE=runpy.run_path(str(Path(__file__).with_name('audit-tick-actor-critic.py')))
same=CORE['same']
VERSIONS=['initial','A','B','C','final']


def tv(a,b):
    return sum(abs(x-y) for x,y in zip(a,b))/2


def predict(weights,raw,bits,work):
    observation=list(raw)
    observation[:4]=[bits[0]]+[(v+1)/2 for v in bits[1:]]
    observation[12]=raw[3]
    state=dict(work=work,weights=weights)
    return CORE['network'](state,CORE['features'](state,raw,observation))


def history_expected(h):
    assert list(h['models'])==VERSIONS
    changes=[]
    for version in VERSIONS:
        groups={key:dict(l1=0.,max=0.) for key in ['hidden','policyHeads','valueHead']}
        for agent_id in h['founderIds']:
            key=str(agent_id)
            for index,(current,initial) in enumerate(zip(h['models'][version][key],h['models']['initial'][key])):
                group=groups['hidden' if index<136 else 'policyHeads' if index<156 else 'valueHead']
                change=abs(current-initial)
                group['l1']+=change
                group['max']=max(group['max'],change)
        changes.append(dict(version=version,groups=groups))
    work=dict(scalarOperations=0)
    rows=[]
    for context_index,context in enumerate(h['contexts']):
        key=str(context['agentId'])
        assert context['agentId'] in h['founderIds']
        raw=context['raw']
        pool=h['codebook']['A' if context['phase']=='return-A' else context['phase']]
        stimuli=[dict(cueId=v['id'],bits=v['bits'],valence=v['valence']) for v in pool]+[dict(cueId=0,bits=[0,0,0,0],valence=0)]
        initial=h['models']['initial'][key]
        for version in VERSIONS:
            weights=h['models'][version][key]
            predictions=[]
            for stimulus in stimuli:
                base=predict(initial,raw,stimulus['bits'],work)
                current=predict(weights,raw,stimulus['bits'],work)
                hidden=predict(initial[:136]+weights[136:],raw,stimulus['bits'],work)
                heads=predict(weights[:136]+initial[136:156]+weights[156:],raw,stimulus['bits'],work)
                critic=predict(weights[:156]+initial[156:],raw,stimulus['bits'],work)
                assert tv(heads['probabilities'],base['probabilities'])<1e-15
                same(critic['probabilities'],current['probabilities'],'value-head policy isolation')
                # JS computes features once for the five forwards, not five
                # times as this direct independent implementation does.
                work['scalarOperations']-=4*(6 if stimulus['cueId']==0 else 21)
                predictions.append(dict(cueId=stimulus['cueId'],valence=stimulus['valence'],probabilities=current['probabilities'],value=current['value'],
                    totalVariationFromInitial=tv(current['probabilities'],base['probabilities']),hiddenResetPolicyChange=tv(current['probabilities'],hidden['probabilities']),
                    headsResetToInitialDifference=tv(heads['probabilities'],base['probabilities']),valueResetPolicyChange=tv(critic['probabilities'],current['probabilities'])))
            def association(indices):
                return sum(sum(v['probabilities'][i] for i in indices) for v in predictions if v['valence']==1)/2-sum(sum(v['probabilities'][i] for i in indices) for v in predictions if v['valence']==-1)/2
            rows.append(dict(contextIndex=context_index,version=version,predictions=predictions,acceptAssociation=association([0,2]),stationaryAssociation=association([2,3])))
    return dict(seed=h['seed'],parameterChanges=changes,rows=rows,observerScalarOperations=work['scalarOperations'])


def verify_sources(result,root):
    found={}
    def visit(path):
        path=path.resolve()
        name=path.relative_to(root.resolve()).as_posix()
        if name in found:
            return
        data=path.read_bytes()
        found[name]=hashlib.sha256(data).hexdigest()
        if path.suffix in ('.mjs','.js'):
            for imported in re.findall(r'''(?:from|import)\s+['"](\.[^'"]+)['"]''',data.decode('utf8')):
                visit(path.parent/imported)
    for name in ['scripts/tick-policy-diagnosis.mjs','scripts/extract-tick-policy-diagnosis.py',
                 'scripts/audit-tick-policy-diagnosis.py','scripts/audit-tick-actor-critic.py','tests/tick-policy-diagnosis.test.mjs']:
        visit(root/name)
    same(result['sources'],found,'complete diagnosis source closure')


def audit(input_path,result_path):
    input_bytes=input_path.read_bytes()
    data=json.loads(input_bytes)
    result=json.loads(result_path.read_text(encoding='utf8'))
    assert data['kind']=='tick-policy-diagnosis-input' and result['kind']=='tick-policy-diagnosis-output'
    assert result['inputSha256']==hashlib.sha256(input_bytes).hexdigest()
    assert result['protocolSha256']==data['protocolSha256'] and result['resultsSha256']==data['resultsSha256']
    verify_sources(result,Path(__file__).resolve().parents[1])
    assert len(result['histories'])==len(data['histories'])
    contexts=predictions=0
    for h,actual in zip(data['histories'],result['histories']):
        expected=history_expected(h)
        same(actual,expected,'conditional policy evaluation')
        contexts+=len(h['contexts'])
        predictions+=sum(len(v['predictions']) for v in actual['rows'])
    return dict(schema=1,passed=True,histories=len(data['histories']),contexts=contexts,predictions=predictions,
                inputSha256=hashlib.sha256(input_bytes).hexdigest(),resultSha256=hashlib.sha256(result_path.read_bytes()).hexdigest(),
                scope='Independent conditional-network/feature/ablation and parameter-partition arithmetic. Input extraction provenance separately binds failed source tapes; not new performance or causal training attribution.')


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('input',type=Path)
    parser.add_argument('result',type=Path)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    report=audit(args.input,args.result)
    with args.output.open('x',encoding='utf8') as stream:
        json.dump(report,stream,indent=2)
        stream.write('\n')
    print(json.dumps(report))
