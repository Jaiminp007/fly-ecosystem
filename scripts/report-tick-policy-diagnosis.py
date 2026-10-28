import hashlib
import json
import sys
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def report(directory):
    data=json.loads((directory/'input.json').read_text(encoding='utf8'))
    result=json.loads((directory/'result.json').read_text(encoding='utf8'))
    numeric=json.loads((directory/'numeric-audit.json').read_text(encoding='utf8'))
    provenance=json.loads((directory/'provenance-audit.json').read_text(encoding='utf8'))
    replay=json.loads((directory/'provenance-replay-audit.json').read_text(encoding='utf8'))
    assert numeric['passed'] and provenance['passed'] and replay['passed']
    assert numeric['inputSha256']==sha(directory/'input.json')==sha(directory/'reextracted-input.json')
    assert numeric['resultSha256']==sha(directory/'result.json')==sha(directory/'captured-result.json')
    assert provenance['recordSha256']==sha(directory/'consumption-provenance.json') and provenance['inputSha256']==numeric['inputSha256']
    partitions=[]
    for version in ['initial','A','B','C','final']:
        groups={name:sum(next(v for v in h['parameterChanges'] if v['version']==version)['groups'][name]['l1'] for h in result['histories']) for name in ['hidden','policyHeads','valueHead']}
        for family in ['A','B','C','return-A']:
            rows=[row for h,source in zip(result['histories'],data['histories']) for row in h['rows'] if row['version']==version and source['contexts'][row['contextIndex']]['phase']==family]
            predictions=[v for row in rows for v in row['predictions']]
            partitions.append(dict(version=version,phase=family,contexts=len(rows),
                meanAcceptAssociation=sum(v['acceptAssociation'] for v in rows)/len(rows),
                maxAbsAcceptAssociation=max(abs(v['acceptAssociation']) for v in rows),
                meanPolicyTV=sum(v['totalVariationFromInitial'] for v in predictions)/len(predictions),
                maxPolicyTV=max(v['totalVariationFromInitial'] for v in predictions),
                maxHiddenResetPolicyTV=max(v['hiddenResetPolicyChange'] for v in predictions),parameterL1=groups))
    return dict(schema=1,kind='tick-policy-diagnosis-summary',protocolSha256=data['protocolSha256'],resultsSha256=data['resultsSha256'],
        histories=len(data['histories']),contexts=numeric['contexts'],predictions=numeric['predictions'],partitions=partitions,
        provenanceSummaries=provenance['summaries'],sourceHashes={name:sha(directory/name) for name in ['input.json','result.json','consumption-provenance.json','numeric-audit.json','provenance-audit.json','provenance-replay-audit.json','source-capture.json']},
        scope='Post-hoc description of a failed bank, fixed first/last own-observation contexts and exact instrumented replay. No new independent sample, fitted choice, causal failure effect, scientific qualification or RSI.')


if __name__=='__main__':
    directory,output=Path(sys.argv[1]).resolve(),Path(sys.argv[2])
    result=report(directory)
    with output.open('x',encoding='utf8') as stream:
        json.dump(result,stream,indent=2)
        stream.write('\n')
    print(json.dumps(dict(histories=result['histories'],contexts=result['contexts'],predictions=result['predictions'],scope=result['scope'])))
