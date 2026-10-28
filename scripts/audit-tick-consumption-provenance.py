"""Independent recorded-provenance geometry, partition and receipt arithmetic.

This does not independently simulate the world. Exact instrumented event and
checkpoint replay separately checks the diagnostic observer's noninterference.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path


def same(actual,expected):
    assert math.isfinite(actual) and math.isclose(actual,expected,rel_tol=1e-10,abs_tol=1e-10),(actual,expected)


def phase(tick):
    return 'A' if tick<=512 else 'B' if tick<=1024 else 'C' if tick<=1536 else 'return-A'


def counts(rows):
    return dict(receipts=len(rows),singlePatch=sum(len(v['consumed'])==1 for v in rows),
        neutralSource=sum(v['sourceValence']==0 for v in rows),
        differentCue=sum(any(p['cueId']!=v['sourceCueId'] for p in v['consumed']) for v in rows),
        signMismatch=sum(any(v['sourceValence'] and p['valence']!=v['sourceValence'] for p in v['consumed']) for v in rows),
        lowAmountAtSensing=sum(any(p['amountAtSensing']<=.06 for p in v['consumed']) for v in rows),
        alreadyLocalLow=sum(any(p['amountAtSensing']<=.06 and p['distanceAtSensing']<=15 for p in v['consumed']) for v in rows),
        enteredContact=sum(any(p['distanceAtSensing']>15 for p in v['consumed']) for v in rows),
        mismatchLowLocal=sum(any(v['sourceValence'] and p['valence']!=v['sourceValence'] and p['amountAtSensing']<=.06 and p['distanceAtSensing']<=15 for p in v['consumed']) for v in rows))


def audit(source,input_path):
    record=json.loads(source.read_text(encoding='utf8'))
    data=json.loads(input_path.read_text(encoding='utf8'))
    assert record['kind']=='tick-consumption-provenance' and data['kind']=='tick-policy-diagnosis-input'
    assert record['protocolSha256']==data['protocolSha256'] and record['resultsSha256']==data['resultsSha256']
    assert len(record['histories'])==len(data['histories'])==8
    all_rows=[]
    for h,extracted in zip(record['histories'],data['histories']):
        assert h['seed']==extracted['seed']
        world=h['initialCheckpoint']['world']['world']
        assert {fly['id'] for fly in world['flies']}==set(extracted['founderIds'])
        cells={(f,c['label'],c['action']):dict(beneficialReceipts=0,harmfulReceipts=0,beneficialEaten=0.,harmfulEaten=0.) for f,items in extracted['cueIntakeCells'].items() for c in items}
        seen=set()
        for row in h['records']:
            assert (row['agentId'],row['tick']) not in seen
            seen.add((row['agentId'],row['tick']))
            assert row['agentId'] in extracted['founderIds'] and row['choice'][2]==1
            assert row['choice'][1] in (-1,0)
            family=phase(row['tick'])
            pool=extracted['codebook']['A' if family=='return-A' else family]
            labels={v['id']:v['valence'] for v in pool}
            assert row['sourceValence']==(labels[row['sourceCueId']] if row['sourceCueId'] else 0)
            if row['choice'][1]==-1:
                assert row['before']==row['after']
            assert row['consumed']
            good=harm=0.
            for p in row['consumed']:
                assert p['valence']==labels[p['cueId']] and p['amount']>0 and p['amount']<=p['amountAtSensing']+1e-10
                patch=world['food'][p['index']]
                for position,field in [('before','distanceAtSensing'),('after','distanceAtIntake')]:
                    same(p[field],math.hypot(row[position]['x']-patch['x'],row[position]['y']-patch['y']))
                assert p['distanceAtIntake']<=15+1e-10
                if p['valence']>0:
                    good+=p['amount']
                else:
                    harm+=p['amount']
            cell=cells[family,row['sourceValence'],2 if row['choice'][1]==-1 else 0]
            cell['beneficialReceipts']+=good>0
            cell['harmfulReceipts']+=harm>0
            cell['beneficialEaten']+=good
            cell['harmfulEaten']+=harm
        for family,items in extracted['cueIntakeCells'].items():
            for expected in items:
                actual=cells[family,expected['label'],expected['action']]
                for key,value in actual.items():
                    same(value,expected[key])
        all_rows+=h['records']
    summaries=[]
    for family in ['A','B','C','return-A','all']:
        for mode in ['all','stationary','cruise']:
            rows=[v for v in all_rows if (family=='all' or phase(v['tick'])==family) and
                  (mode=='all' or (v['choice'][1]==-1)==(mode=='stationary'))]
            summaries.append(dict(phase=family,mode=mode,**counts(rows)))
    return dict(schema=1,passed=True,histories=8,summaries=summaries,
        recordSha256=hashlib.sha256(source.read_bytes()).hexdigest(),inputSha256=hashlib.sha256(input_path.read_bytes()).hexdigest(),
        scope='Independent recorded patch geometry, valence/amount consistency, stationary-body identity and aggregation against every original intake contingency cell. Not independent physics or causal effect on failed qualification.')


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('record',type=Path)
    parser.add_argument('input',type=Path)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    result=audit(args.record,args.input)
    with args.output.open('x',encoding='utf8') as stream:
        json.dump(result,stream,indent=2)
        stream.write('\n')
    print(json.dumps(dict(passed=True,histories=8,summary=result['summaries'][-3])))
