"""Read-only arithmetic/selection description, no rerun or new fork selection."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'evidence/stall-transfer/20261025-v1'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
rows=[read(p) for p in sorted((BASE/'rows').glob('*.json'))]
events=[]
for row in rows:
    seed=row['history']['seed'];trace=read(BASE/'reference-traces'/f'{seed}.json')
    for event in row['events']:
        cp=read(BASE/'checkpoints'/f"{seed}-{event['window']}.json")['checkpoint']
        body=next(f for f in cp['run']['world']['world']['flies'] if f['id']==event['id'])
        matching=[r for r in trace if r['id']==event['id'] and r['decision']<event['decision']]
        prior=matching[-16:];assert len(prior)==16 and all(r['raw'][3]>0 and r['raw'][13]<=0 for r in prior)
        assert any(r['raw'][10]>0 or r['raw'][11]>0 for r in prior[-4:])
        at=next(r for r in trace if r['id']==event['id'] and r['decision']==event['decision'])
        horizons={b:{h:state['elapsed']-(event['decision']-1) for h,state in branch['snapshots'].items()} for b,branch in event['branches'].items()}
        for b in ['P','D']:
            for h,state in event['branches'][b]['snapshots'].items():
                effect=event['effects'][b][h]
                assert abs(effect['cohortPerFounder']*24-effect['focalBudget']-effect['otherBodiesBudget'])<1e-9
                assert state['endpoint']['founders']==24 and abs(state['endpoint']['accountingResidual'])<1e-7
        events.append(dict(seed=seed,window=event['window'],decision=event['decision'],id=event['id'],latestPhysicalIntake=body['lastFood'],
            deepInteriorAtSelection=bool(at['target'] and at['target']['deepInterior']),collisionsInPreceding16=sum(r['collision'] for r in prior),
            actualHorizonDelays=horizons,effects=event['effects']))
result=dict(schema=1,kind='stall-diagnostic-readback',passed=True,events=events,
    actual64TickCases=sum(all(v['later']==64 for v in e['actualHorizonDelays'].values()) for e in events),
    shortened64TickCases=sum(any(v['later']<64 for v in e['actualHorizonDelays'].values()) for e in events),
    latestIntakePositiveCases=sum(e['latestPhysicalIntake']>0 for e in events),
    deepInteriorSelectionCases=sum(e['deepInteriorAtSelection'] for e in events),
    selectionsWithPriorCollision=sum(e['collisionsInPreceding16']>0 for e in events),
    scope='Read-only description of frozen selected events. No new exclusion, timing change, outcome-based selection, qualification or RSI. Later code caps at the original endpoint; actual elapsed delays are reported here.')
path=BASE/'readback.json'
with path.open('x',encoding='utf8') as f:json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({k:v for k,v in result.items() if k!='events'}))
