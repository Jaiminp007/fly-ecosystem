"""Read-only archive binding and reserve-state check for development studies.

This does not rescore results, open reserves, rehash archive chunks or replay
worlds. It checks current protocols/results against preserved manifest records.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SKIP={'sources','registries','engineering','authority-inputs'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit():
    archived={}
    for manifest in sorted((ROOT/'handoff').rglob('*manifest*.json')):
        data=json.loads(manifest.read_text(encoding='utf8'))
        for row in data.get('files',[]):
            if not isinstance(row,dict) or not {'path','sha256'}<=row.keys():continue
            archived.setdefault((row['path'],row['sha256']),[]).append(manifest.relative_to(ROOT).as_posix())
    def bindings(path):
        matches=archived.get((path.relative_to(ROOT).as_posix(),sha(path)),[])
        if not matches and path.name=='protocol.json':
            # The active bank's immutable freeze is archived under a snapshot
            # path, separately from its still-growing performance directory.
            for snapshot in (ROOT/'evidence/value-development-freeze').glob('*/protocol.json'):
                check=json.loads(snapshot.with_name('snapshot-check.json').read_text(encoding='utf8'))
                if check['passed'] is True and check['protocolSha256']==sha(path)==sha(snapshot):
                    matches+=archived.get((snapshot.relative_to(ROOT).as_posix(),sha(snapshot)),[])
        assert matches,('Current file does not match any preserved archive manifest',str(path))
        return matches
    studies=[]
    for path in sorted((ROOT/'evidence').rglob('protocol.json')):
        if any(part in SKIP for part in path.relative_to(ROOT/'evidence').parts):continue
        if (path.parent/'snapshot-check.json').exists():continue
        p=json.loads(path.read_text(encoding='utf8'))
        if not {'developmentHistories','confirmationHistories'}<=p.keys():continue
        result_path=path.parent/'development/results.json'
        result=json.loads(result_path.read_text(encoding='utf8')) if result_path.exists() else None
        reserve=path.parent/'confirmation'
        if result is not None:
            assert type(result['promising']) is bool
            if not result['promising']:assert not reserve.exists(),('Failed reserve is open',str(reserve))
        else:assert not reserve.exists(),('Reserve opened without development result',str(reserve))
        studies.append(dict(protocol=path.relative_to(ROOT).as_posix(),protocolSha256=sha(path),experiment=p['experiment'],
            protocolArchiveBindings=bindings(path),developmentHistories=len(p['developmentHistories']),
            reservedHistories=len(p['confirmationHistories']),developmentResultPresent=result is not None,
            promising=result['promising'] if result else None,resultSha256=sha(result_path) if result else None,
            resultArchiveBindings=bindings(result_path) if result else [],confirmationDirectoryExists=reserve.exists()))
    failed=[s for s in studies if s['promising'] is False]
    return dict(schema=1,passed=True,studies=studies,failedStudies=len(failed),
        failedReservedHistories=sum(s['reservedHistories'] for s in failed),
        scope='Current development-study protocols/results match preserved manifest records; failed/unfinished reserves remain closed. Not full archive-chunk integrity, scientific re-audit or qualification.')


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    result=audit()
    with args.output.open('x',encoding='utf8') as output:json.dump(result,output,indent=2);output.write('\n')
    print(json.dumps(dict(passed=True,studies=len(result['studies']),failedStudies=result['failedStudies'],failedReservedHistories=result['failedReservedHistories'])))
