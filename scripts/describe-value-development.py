"""Post-hoc factual description; real-bank execution requires both full audits.

No simulator, fitting, candidate comparison/selection, qualification or new seeds.
"""
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path

PHASES=('A','B','C','return-A')


def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(1048576),b''):h.update(block)
    return h.hexdigest()


def same(a,b):
    assert math.isfinite(a) and math.isfinite(b) and math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-9),(a,b)


def family(tick):
    assert type(tick) is int and 1<=tick<=1792
    return 'A' if tick<=512 else 'B' if tick<=1024 else 'C' if tick<=1536 else 'return-A'


def phase_row():
    row=dict(decisions=0,actions=[0,0,0,0],cueDecisions=0,nativeCueDifferences=0,contactOperations=0,
        billedBytesSum=0,maxBilledBytes=0,physicalReceipts=0,foodReceipts=0,mixedReceipts=0,
        transitions=0,positiveRewards=0,negativeRewards=0,zeroRewards=0,terminalTransitions=0,
        rewardSum=0.,absoluteReward=0.,terminalAbsoluteReward=0.,beneficialEaten=0.,harmfulEaten=0.,toxinDamage=0.,
        physicalCosts=0.,policyPaid=0.,nativePhysicalCosts=0.,policyIncurred=0.,discardedEnergy=0.,
        operationsAfterInitialization=0,terminalNewCharge=0.,replayLagSum=0,maxReplayLag=0,currentRecordReplay=0)
    row['actionsBySelectedValence']={str(v):[0,0,0,0] for v in (-1,0,1)}
    return row


class CandidateDescription:
    def __init__(self):
        self.phases={name:phase_row() for name in PHASES}
        self.initial=self.final=None
        self.steps={}

    def feed(self,event):
        if event.get('type')=='main-start' and event['arm']=='candidate':
            assert self.initial is None
            self.initial=event['checkpoint'];states=self.initial['state']['learners']
            self.ids=set(states)
            self.last={key:dict(incurred=s['charge']['incurredEnergy'],paid=s['charge']['paidEnergy'],
                debt=s['charge']['outstandingEnergy'],operations=s['work']['scalarOperations']) for key,s in states.items()}
            self.initializationOperations=sum(s['work']['scalarOperations'] for s in states.values())
            self.books={name:{tuple(c['bits']):c['valence'] for c in self.initial['state']['codebook']['A' if name=='return-A' else name]} for name in PHASES}
            return
        if event.get('type')=='main-end' and event['arm']=='candidate':
            assert self.final is None;self.final=event['checkpoint'];self.endpoint=event['endpoint'];return
        if event.get('role')!='main:candidate':return
        assert self.initial is not None and self.final is None
        e=event['event'];kind=e['type']
        if kind not in ('decision','physical','observe','transition'):return
        own=e['record'] if kind=='transition' else e['own'] if kind in ('decision','observe') else e
        key=str(own['agentId']);assert key in self.ids
        phase=self.phases[family(own['tick'])]
        if kind=='decision':
            action=e['choice'];assert type(action) is int and 0<=action<4
            step=(key,own['tick']);assert step not in self.steps
            self.steps[step]={}
            cue=tuple(e['selectedCue']);assert len(cue)==4
            valence=0 if cue==(0,0,0,0) else self.books[family(own['tick'])][cue]
            phase['decisions']+=1;phase['actions'][action]+=1;phase['actionsBySelectedValence'][str(valence)][action]+=1
            phase['cueDecisions']+=any(cue);phase['nativeCueDifferences']+=list(cue)!=e['nativeSourceCue']
            assert type(e['contactOperations']) is int and e['contactOperations']>=0
            phase['contactOperations']+=e['contactOperations']
            phase['billedBytesSum']+=e['storageBytes'];phase['maxBilledBytes']=max(phase['maxBilledBytes'],e['storageBytes'])
        elif kind=='physical':
            step=self.steps[(key,own['tick'])];assert 'receipt' not in step;step['receipt']=e
            assert 0<=e['paidExtra']<=e['cost']+1e-12
            same(e['finalEnergy']-e['initialEnergy'],e['beneficialEaten']-e['toxinDamage']-e['cost'])
            phase['physicalReceipts']+=1
            for field in ('beneficialEaten','harmfulEaten','toxinDamage'):
                assert math.isfinite(e[field]) and e[field]>=0;phase[field]+=e[field]
            phase['physicalCosts']+=e['cost'];phase['nativePhysicalCosts']+=e['cost']-e['paidExtra']
            phase['foodReceipts']+=e['beneficialEaten']>0 or e['harmfulEaten']>0
            phase['mixedReceipts']+=e['beneficialEaten']>0 and e['harmfulEaten']>0
        elif kind=='observe':
            receipt=self.steps.pop((key,own['tick']))['receipt'];last=self.last[key]
            incurred=e['incurredEnergy']-last['incurred'];paid=e['paidEnergy']-last['paid']
            operations=e['scalarOperations']-last['operations'];assert incurred>=-1e-12 and paid>=-1e-12 and operations>=0
            same(paid,receipt['paidExtra'])
            same(e['outstandingEnergy'],last['debt']+incurred-paid)
            same(own['energy'],e['physicalEnergy']-receipt['outstandingEnergy'])
            if own['terminal']:
                same(e['discardedEnergy'],receipt['finalEnergy'])
                new=e['incurredEnergy']-receipt['incurredEnergy'];assert new>=-1e-12
                phase['terminalNewCharge']+=new
            else:same(e['physicalEnergy'],receipt['finalEnergy']);same(e['discardedEnergy'],0)
            phase['policyIncurred']+=incurred;phase['policyPaid']+=paid;phase['operationsAfterInitialization']+=operations
            phase['discardedEnergy']+=e['discardedEnergy']
            self.last[key]=dict(incurred=e['incurredEnergy'],paid=e['paidEnergy'],debt=e['outstandingEnergy'],operations=e['scalarOperations'])
        else:
            # Credit belongs to the recorded action tick, including intervals
            # completing at the next regime's first choice.
            reward=own['reward'];same(reward,(own['finalEnergy']-own['initialEnergy'])/120)
            phase['transitions']+=1;phase['rewardSum']+=reward;phase['absoluteReward']+=abs(reward)
            phase['positiveRewards' if reward>0 else 'negativeRewards' if reward<0 else 'zeroRewards']+=1
            phase['terminalTransitions']+=own['terminal']
            if own['terminal']:phase['terminalAbsoluteReward']+=abs(reward)
            lag=own['experience']-e['replay']['experience'];assert type(lag) is int and lag>=0
            phase['replayLagSum']+=lag;phase['maxReplayLag']=max(phase['maxReplayLag'],lag);phase['currentRecordReplay']+=lag==0

    def finish(self,row):
        assert self.initial is not None and self.final is not None and not self.steps
        states=self.final['state']['learners'];assert set(states)==self.ids
        assert self.endpoint==row['arms']['candidate']['endpoint']
        total=lambda field:sum(p[field] for p in self.phases.values())
        for p in self.phases.values():assert p['decisions']==p['physicalReceipts']==sum(p['actions'])
        assert total('decisions')==row['arms']['candidate']['activity']['decisions']
        assert total('transitions')==row['arms']['candidate']['activity']['updates']
        for field in ('beneficialEaten','harmfulEaten','toxinDamage'):same(total(field),self.endpoint['totals'][field])
        same(total('physicalCosts')+total('discardedEnergy')+total('harmfulEaten')+total('toxinDamage'),self.endpoint['totals']['dissipated']-self.initial['world']['world']['totals']['dissipated'])
        same(total('policyIncurred'),sum(s['charge']['incurredEnergy'] for s in states.values()))
        same(total('policyPaid'),sum(s['charge']['paidEnergy'] for s in states.values()))
        same(total('policyIncurred')-total('policyPaid'),self.endpoint['outstandingEnergy'])
        same(total('operationsAfterInitialization')+self.initializationOperations,self.endpoint['scalarOperations'])
        versions={'A':self.final['state']['savedModels'].get('A'),'B':self.final['state']['savedModels'].get('B'),
            'C':{key:s['weights'] for key,s in self.final['atC']['state']['learners'].items()} if self.final['atC'] else None,
            'final':{key:s['weights'] for key,s in states.items()}}
        changes={}
        for name,weights in versions.items():
            if weights is None:changes[name]=dict(present=False);continue
            differences=[abs(v-self.initial['state']['learners'][key]['weights'][action][j]) for key,rows in weights.items() for action,values in enumerate(rows) for j,v in enumerate(values)]
            changes[name]=dict(present=True,l1=sum(differences),maxAbsolute=max(differences))
        memory={}
        for version,checkpoint in [('C',self.final['atC']),('final',self.final)]:
            if checkpoint is None:memory[version]=None;continue
            memory[version]=[]
            for key,s in checkpoint['state']['learners'].items():
                counts={name:0 for name in PHASES};records=s['older']+s['recent']
                assert len(records)<=64 and len({r['experience'] for r in records})==len(records)
                for r in records:assert str(r['agentId'])==key;counts[family(r['tick'])]+=1
                memory[version].append(dict(agentId=s['agentId'],dead=s['dead'],recent=len(s['recent']),older=len(s['older']),olderSeen=s['olderSeen'],retainedOrigins=counts))
        return dict(seed=row['history']['seed'],founders=len(self.ids),phases=self.phases,initializationOperations=self.initializationOperations,
            weightChangesFromInitialization=changes,retainedMemory=memory)


def describe_stream(path,row):
    assert sha(path)==row['numericsSha256'] and path.stat().st_size==row['compressedBytes']
    digest=hashlib.sha256();size=0;description=CandidateDescription()
    with gzip.open(path,'rb') as stream:
        for line in stream:
            digest.update(line);size+=len(line)
            if line.startswith((b'{"type":"main-start","arm":"candidate",',b'{"type":"main-end","arm":"candidate",',b'{"role":"main:candidate",')):
                description.feed(json.loads(line))
    assert size==row['uncompressedBytes'] and digest.hexdigest()==row['uncompressedSha256']
    return description.finish(row)


def describe(directory):
    p=json.loads((directory/'protocol.json').read_text(encoding='utf8'));folder=directory/'development'
    result=json.loads((folder/'results.json').read_text(encoding='utf8'))
    assert p['experiment']=='fixed-contact-value-development-v1' and result['promising'] is False and not (directory/'confirmation').exists()
    protocol_hash,result_hash=sha(directory/'protocol.json'),sha(folder/'results.json')
    approvals={}
    for name in ('physical-audit.json','numeric-audit.json'):
        a=json.loads((folder/name).read_text(encoding='utf8'))
        assert a['passed'] is True and a['protocolSha256']==protocol_hash and a['resultsSha256']==result_hash and a['histories']==len(p['developmentHistories'])
        approvals[name]=sha(folder/name)
    histories=[]
    for index,h in enumerate(p['developmentHistories']):
        path=folder/'rows'/f"{h['seed']}.json";row=json.loads(path.read_text(encoding='utf8'))
        assert row['history']==h and row['protocolSha256']==protocol_hash and sha(path)==result['rowSha256'][index]
        histories.append(describe_stream(folder/'numerics'/f"{h['seed']}.jsonl.gz",row))
    return dict(schema=1,kind='post-hoc-value-exposure-cost-description',protocolSha256=protocol_hash,resultsSha256=result_hash,
        auditSha256=approvals,sourceSha256=sha(Path(__file__)),histories=histories,
        scope='Descriptive arithmetic of an audited failed bank only. Selected-cue valence is observer metadata, not a learner input. Transition phases use source action ticks; cost phases use physical billing ticks. Memory counts include dead original states and do not demonstrate functional pressure. No cause identification, fitting, model selection, qualification, new seeds or RSI.')


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    result=describe(args.directory.resolve())
    with args.output.open('x',encoding='utf8') as f:json.dump(result,f,indent=2);f.write('\n')
    print(json.dumps(dict(passed=True,histories=len(result['histories']),scope=result['scope'])))
