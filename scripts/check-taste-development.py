"""Brief result/source readback, never a trajectory/independent-policy audit."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(path): return json.loads(path.read_text(encoding='utf8'))
def close(a,b): assert abs(a-b)<1e-9,(a,b)
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--start',type=int,default=8);parser.add_argument('--end',type=int,default=16);args=parser.parse_args()
    reports=[]
    for directory in sorted((ROOT/'evidence/taste-development').glob('attempt-*')):
        number=int(directory.name.split('-')[1])
        if not args.start<=number<=args.end or not (directory/'results.json').exists(): continue
        result,attempt=read(directory/'results.json'),read(directory/'attempt.json')
        assert not result['qualified'] and result['histories']==8
        for name,sha in result['sourceSha256'].items():
            assert hashlib.sha256((directory/'sources'/name).read_bytes()).hexdigest()==sha
        rows=[read(path) for path in sorted((directory/'rows').glob('*.json'))];assert len(rows)==8
        for row in rows:
            for run in row['arms'].values():
                e=run['endpoint'];assert e['founders']==24 and abs(e['accountingResidual'])<1e-7
                close(e['incurredEnergy'],e['paidEnergy']+e['outstandingEnergy'])
                close(e['budgetAdjustedEnergyPerFounder'],(e['physicalEnergy']-e['startingEnergy']-e['outstandingEnergy']+e['startingDebt'])/24)
            probes=row['probes']
            for family in ['A','B','transfer']:
                group=[p for key,p in probes.items() if key.startswith(family+':')]
                assert len({p.get('startWorldSha256') for p in group})==1
                for p in group:
                    assert p['founders']==24
                    if p.get('endpoint'): assert abs(p['endpoint']['accountingResidual'])<1e-7
            if 'pressure' in row:
                b=row['pressure'];assert b['sham']==b['probes']['A:A']
                assert all(b['probes'][key]==value for key,value in probes.items() if not key.startswith('early-'))
                p=b['probes'];v=lambda key:p[key]['value'];food=lambda key:(p[key]['endpoint']['totals']['beneficialEaten']-p[key]['endpoint']['totals']['toxinDamage'])/24 if p[key].get('endpoint') else 0
                a=v('A:A')-v('A:reset')
                effects=dict(aSkill=a,bSkill=v('B:B')-v('B:reset'),bAcquisition=v('B:B')-v('B:A'),aInterference=v('A:A')-v('A:B')-.05*a,aNetFoodInterference=food('A:A')-food('A:B'),aRetention=v('A:current')-.95*v('A:A')-.05*v('A:reset'),bRetention=v('B:current')-.95*v('B:B')-.05*v('B:reset'),transferReset=v('transfer:current')-v('transfer:reset'),transferCruise=v('transfer:current')-v('transfer:acceptCruise'),transferStationary=v('transfer:current')-v('transfer:acceptStationary'))
                for key,value in effects.items():close(value,row['pressure']['effects'][key])
        for control,c in result['controlComparisons'].items():
            effects=[r['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder']-r['arms'][control]['endpoint']['budgetAdjustedEnergyPerFounder'] for r in rows]
            close(sum(effects)/8,c['mean']);assert sum(v>0 for v in effects)==c['positive']
            assert sum(r['arms']['candidate']['endpoint']['survivors']-r['arms'][control]['endpoint']['survivors'] for r in rows)==c['survivorDifference']
        for family,r in result['retention'].items():
            retained=[row['probes'][family+':current']['value']-row['probes'][family+':reset']['value'] for row in rows]
            saved=[row['probes'][family+':'+family]['value']-row['probes'][family+':reset']['value'] for row in rows]
            close(sum(retained)/8,r['retainedMean']);close(sum(saved)/8,r['savedMean'])
        for control,c in result['transferControls'].items():
            effects=[r['probes']['transfer:current']['value']-r['probes']['transfer:'+control]['value'] for r in rows]
            close(sum(effects)/8,c['mean']);assert sum(v>0 for v in effects)==c['positive']
        for key,c in result.get('pressure',{}).items():
            effects=[r['pressure']['effects'][key] for r in rows];close(sum(effects)/8,c['mean']);assert sum(v>0 for v in effects)==c['positive']
        reports.append(dict(attempt=directory.name,survivors={arm:sum(r['arms'][arm]['endpoint']['survivors'] for r in rows) for arm in attempt['arms']},comparisons=result['controlComparisons'],retention=result['retention'],transferControls=result['transferControls'],pressure=result.get('pressure'),runtime=result['runtime']))
    assert len(reports)==args.end-args.start+1
    output=dict(schema=1,passed=True,reports=reports,qualified=False,scope='Brief captured-source/result arithmetic/common-start/sham readback only. All inputs are reusable exploratory development. No full trajectory audit, independent learner reconstruction, held-out qualification, functional-pressure success or RSI.')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with args.output.open('x',encoding='utf8') as f:json.dump(output,f,indent=2);f.write('\n')
    print(json.dumps(dict(passed=True,attempts=len(reports),output=str(args.output))))
if __name__=='__main__':main()
