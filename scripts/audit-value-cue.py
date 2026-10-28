"""Independent value/actor wrapper arithmetic and contact geometry.

Sensor geometry/native policy and supply are not a second physics simulator.
Captured-source exact replay must bind all observer values to engine execution.
"""
import argparse
import copy
import hashlib
import json
import math
import re
import runpy
from pathlib import Path

WORLD=runpy.run_path(str(Path(__file__).with_name('audit-tick-cue.py')))
VALUE=runpy.run_path(str(Path(__file__).with_name('audit-tick-value.py')))
CORE=WORLD['CORE']
same,vector=CORE['same'],CORE['vector']
ARMS=['candidate','originalValue','contactActor','originalActor','lambda0','frozen','reset','cueBlind','shuffled','nullCandidate','nullBlind',
      'incumbent','acceptCruise','refuseCruise','acceptStationary','refuseStationary','random']
VALUES=set(ARMS[:2]+ARMS[4:11])
ACTORS={'contactActor','originalActor'}
SPECS=[('A','A'),('A','B'),('A','C'),('A','reset'),('B','A'),('B','B'),('B','C'),('B','reset'),('C','B'),('C','C')]+[
    ('transfer',v) for v in ['A','C','reset','accept','acceptStationary']]


def program(arm):
    return 'value' if arm in VALUES else 'actor' if arm in ACTORS else 'native' if arm=='incumbent' else 'fixed'


def fixed_state(agent_id,seed,arm,tick=0):
    state=WORLD['fixed_state'](agent_id,seed,arm,tick)
    state['kind']='native-value-reference-observer' if arm=='incumbent' else 'fixed-value-menu-control'
    return state


def freeze_value(state):
    state['acquisition'],state['pending'],state['eligibility']=False,None,VALUE['zeros']()


def reset_value(state):
    state.update(weights=VALUE['zeros'](),eligibility=VALUE['zeros'](),previous=None,pending=None,recent=[],older=[],olderSeen=0,acquiredTransitions=0)


def cue_layout(food,book,family,seed):
    rng=seed
    for _ in range(6):
        rng=CORE['rng_next'](rng)
    order=list(range(len(food)))
    for index in range(len(order)-1,0,-1):
        rng=CORE['rng_next'](rng)
        other=math.floor(rng/4294967296*(index+1))
        order[index],order[other]=order[other],order[index]
    pool=book['A' if family=='return-A' else family]
    for offset,index in enumerate(order):
        food[index]['cue']=list(pool[offset%4]['bits'])
        food[index]['cueId']=pool[offset%4]['id']
    return rng


def source_check(record,root):
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
    for name in ['scripts/value-cue-engineering.mjs','scripts/audit-value-cue.py','scripts/audit-tick-value.py',
                 'scripts/audit-tick-cue.py','scripts/audit-tick-actor-critic.py','tests/value-cue-audit.test.mjs']:
        visit(root/name)
    same(record['sources'],found,'complete value wrapper source closure')


class AuditValueWorld(WORLD['AuditWorld']):
    def __init__(self,checkpoint,states=None):
        super().__init__(copy.deepcopy(checkpoint),states)
        self.program=self.wrapper['program']
        assert self.program==program(self.arm)
        self.positions={key:dict(x=fly['x'],y=fly['y']) for key,fly in self.flies.items()}
        self.anchor_context=None
        self.contact_queries=0

    def observation(self,event):
        own=event['own']
        key=str(own['agentId'])
        same(event['sensorPosition'],self.positions[key],'sensor position continuation')
        source=event['nativeSourceCue']
        vector(source,4)
        assert source==[0,0,0,0] or all(v in (-1,1) for v in source)
        selected=list(source)
        operations=0
        contact=not self.wrapper['transfer'] and (self.program=='value' and self.arm!='originalValue' or self.arm=='contactActor')
        if self.wrapper['transfer']:
            selected=[0,0,0,0]
        elif contact:
            nearest=math.inf
            position=self.positions[key]
            for patch in self.world['food']:
                dx,dy=patch['x']-position['x'],patch['y']-position['y']
                squared=dx*dx+dy*dy
                operations+=6
                if squared<=225:
                    operations+=1
                    if squared<nearest:
                        nearest,selected=squared,list(patch['cue'])
            self.contact_queries+=1
        same(event['selectedCue'],selected,'contact/transfer selected cue')
        same(event['contactOperations'],operations,'actual contact query bill')
        self.states[key]['work']['scalarOperations']+=operations
        cue=selected
        if self.arm in ('cueBlind','nullBlind'):
            cue=[0,0,0,0]
        if self.arm=='shuffled' and not self.wrapper['transfer']:
            family='A' if self.family=='return-A' else self.family
            text=f"{self.wrapper['historySpec']['shuffleSeed']}:{own['agentId']}:{own['tick']}"
            index=int(hashlib.sha256(text.encode()).hexdigest()[:8],16)%4
            cue=self.wrapper['codebook'][family][index]['bits']
        observation=list(own['raw'])
        observation[:4]=[cue[0]]+[(v+1)/2 for v in cue[1:]]
        observation[12]=own['raw'][3]
        same(own['observation'],observation,'lawful own cue observation')

    def decision(self,event):
        own=event['own']
        self.tick(own['tick'])
        key=str(own['agentId'])
        assert key in self.tick_live and key not in self.actions
        state=self.states[key]
        self.raw(key,own['raw'])
        same(event['physicalEnergy'],self.energy[key])
        same(own['energy'],self.energy[key]-state['charge']['outstandingEnergy'],'own energy minus debt')
        self.observation(event)
        if self.program in ('value','actor'):
            action,rows=VALUE['choose'](state,own) if self.program=='value' else WORLD['choose'](state,own)
            same(self.buffer.pop(key,[]),rows,'completed own transitions')
        else:
            assert self.program=='fixed' and state['lastObservedTick']+1==own['tick'] and not state['dead']
            state['work']['scalarOperations']+=1
            if self.arm=='random':
                state['rngState']=CORE['rng_next'](state['rngState'])
                action=math.floor(state['rngState']/4294967296*4)
                state['work']['scalarOperations']+=9
            else:
                action=['acceptCruise','refuseCruise','acceptStationary','refuseStationary'].index(self.arm)
            state['decisions']+=1
            state['lastDecisionTick']=own['tick']
        same(event['choice'],action,'applied menu choice')
        raw=own['raw']
        accept=action in (0,2)
        attraction,wall=2*(raw[2]-raw[1]),1.8*(raw[10]-raw[11])
        outputs=[math.tanh((attraction if accept else -attraction+.8*raw[0])+wall),-1 if action>=2 else 0,1 if accept else -1,-1,0]
        same(event['outputs'],outputs,'existing motor primitive')
        state['work']['scalarOperations']+=6 if accept else 9
        CORE['bill'](state,self.pricing)
        charge=state['charge']
        charge['storageBytes']=CORE['encoded_bytes'](state)
        storage=charge['storageBytes']*self.pricing['byteEnergyPerSecond']*.1
        charge['outstandingEnergy']+=storage
        charge['incurredEnergy']+=storage
        same(event['rngState'],state['rngState'])
        same(event['scalarOperations'],state['work']['scalarOperations'])
        same(event['storageBytes'],charge['storageBytes'])
        same(event['requestedExtra'],charge['outstandingEnergy'])
        self.actions[key]=dict(outputs=outputs,requested=charge['outstandingEnergy'])
        self.counts['decisions']+=1

    def native_cost(self,event):
        if event['type']=='native-motor':
            same(event['sensorPosition'],self.positions[str(event['agentId'])],'native reference sensor position')
        super().native_cost(event)

    def physical(self,event):
        key=str(event['agentId'])
        position=event['physicalPosition']
        assert set(position)=={'x','y'} and all(math.isfinite(v) for v in position.values())
        assert 6<=position['x']<=994 and 6<=position['y']<=634
        old=self.positions[key]
        distance=math.hypot(position['x']-old['x'],position['y']-old['y'])
        speed=(self.actions[key]['outputs'][1]+1)/2*self.flies[key]['genome']['traits']['speed']
        assert distance<=speed*.1+1e-9,'recorded displacement exceeds applied speed'
        super().physical(event)
        self.positions[key]=copy.deepcopy(position)

    def observe(self,event):
        own=event['own']
        key=str(own['agentId'])
        assert own['tick']==self.current and key in self.receipts and key not in self.observed
        assert set(self.receipts)==self.tick_live
        terminal=self.energy[key]<=0 or self.age[key]>self.flies[key]['genome']['traits']['lifespan']
        same(own['terminal'],terminal,'physical death condition')
        physical=0. if terminal else self.energy[key]
        discarded=self.energy[key] if terminal else 0.
        state=self.states[key]
        same(event['physicalEnergy'],physical)
        same(event['discardedEnergy'],discarded)
        same(own['energy'],physical-state['charge']['outstandingEnergy'])
        rows=[]
        if self.program=='value':
            rows=VALUE['observe'](state,own)
        elif self.program=='actor':
            assert state['awaitingObservation'] and state['lastDecisionTick']==own['tick']
            if terminal and state['pending'] is not None:
                rows.append(CORE['transition'](state,own['energy'],0.,True))
            state['awaitingObservation']=False
        same(self.buffer.pop(key,[]),rows,'terminal completed records')
        state['lastObservedTick'],state['dead']=own['tick'],terminal
        if terminal:
            self.live.remove(key)
            self.sums['discarded']+=discarded
            self.sums['deaths']+=1
            self.sums['energy' if self.energy[key]<=0 else 'age']+=1
            self.energy[key]=0.
            if self.program!='native':
                CORE['bill'](state,self.pricing)
            self.counts['terminalObservations']+=1
        for field in ['outstandingEnergy','incurredEnergy','paidEnergy']:
            same(event[field],state['charge'][field])
        same(event['scalarOperations'],state['work']['scalarOperations'])
        self.observed.add(key)
        if self.observed==self.tick_live:
            self.completed,self.current=self.current,None
            assert not self.buffer

    def endpoint(self,actual):
        assert self.current is None
        energy=sum(self.energy[key] for key in self.live)
        debt=sum(state['charge']['outstandingEnergy'] for state in self.states.values())
        operations=sum(state['work']['scalarOperations'] for state in self.states.values())
        totals=copy.deepcopy(self.world['totals'])
        totals['foodEaten']+=self.sums['beneficial']+self.sums['harmful']
        totals['dissipated']+=self.sums['cost']+self.sums['harmful']+self.sums['damage']+self.sums['discarded']
        totals['signalCost']+=self.sums['signalCost']
        totals['signalExposure']+=self.sums['signalExposure']
        totals['deaths']+=self.sums['deaths']
        for cause in ['energy','age']:
            totals['deathCauses'][cause]+=self.sums[cause]
        if self.world['config']['cueForaging']:
            for field,total in [('beneficialEaten','beneficial'),('harmfulEaten','harmful'),('toxinDamage','damage')]:
                totals[field]+=self.sums[total]
        external=actual['totals']['externalEnergy']
        assert math.isfinite(external) and external>=self.world['totals']['externalEnergy']-1e-10
        totals['externalEnergy']=external
        inventory=sum(p['amount'] for p in self.world['food'])+(external-self.world['totals']['externalEnergy'])-self.sums['beneficial']-self.sums['harmful']
        same(actual['foodInventory'],inventory,'resource conservation conditional on recorded supply')
        residual=actual['foodInventory']+energy+totals['dissipated']-self.world['initialEnergy']-external
        assert math.isfinite(actual['accountingResidual']) and abs(actual['accountingResidual'])<1e-7 and abs(residual)<1e-7,'both independent conservation bounds'
        expected=dict(tick=self.completed,founders=len(self.ids),survivors=len(self.live),survival=len(self.live)/len(self.ids),physicalEnergy=energy,
            startingEnergy=self.wrapper['startingEnergy'],startingDebt=self.wrapper['startingDebt'],outstandingEnergy=debt,
            budgetAdjustedEnergyPerFounder=(energy-self.wrapper['startingEnergy']-(debt-self.wrapper['startingDebt']))/len(self.ids),
            foodInventory=actual['foodInventory'],totals=totals,scalarOperations=operations,additionalScalarOperations=operations-self.wrapper['startingOperations'],
            learnerEncodedBytes=0 if self.program=='native' else sum(CORE['encoded_bytes'](state) for state in self.states.values()))
        assert set(actual)==set(expected)|{'accountingResidual'}
        same({k:v for k,v in actual.items() if k!='accountingResidual'},expected,'full independent wrapper endpoint')

    def events(self,events,complete=True):
        for event in events:
            assert event['arm']==self.arm and event['program']==self.program
            kind=event['type']
            if kind=='transition':
                key=str(event['record']['agentId'] if self.program=='value' else event['agentId'])
                assert key in self.live and key not in self.buffer and self.program in ('value','actor')
                self.buffer[key]=[{k:v for k,v in event.items() if k not in ('arm','program','type')}]
                self.counts['transitions']+=1
            elif kind=='decision':
                self.decision(event)
            elif kind in ('native-cost','native-motor'):
                self.native_cost(event)
            elif kind=='physical':
                self.physical(event)
            elif kind=='observe':
                self.observe(event)
            elif kind=='intervention':
                assert self.current is None and event['tick']==self.completed and self.arm in ('frozen','reset') and self.program=='value'
                assert event['phase']=={512:'B',1024:'C'}.get(self.completed) and event['action']==self.arm and self.completed not in self.interventions
                self.interventions.add(self.completed)
                for key in self.live:
                    freeze_value(self.states[key]) if self.arm=='frozen' else reset_value(self.states[key])
            elif kind=='phase':
                assert self.current is None and event['tick']==self.completed
                assert event['phase']=={512:'B',1024:'C',1536:'return-A'}.get(self.completed)
                if self.arm in ('frozen','reset') and self.completed in (512,1024):
                    assert self.completed in self.interventions
                self.family=event['phase']
                index=['A','B','C','return-A'].index(self.family)
                seed=self.wrapper['historySpec']['resourceSeeds'][index]
                assert event['resource']['family']==self.family and event['resource']['seed']==seed
                rng=cue_layout(self.world['food'],self.wrapper['codebook'],self.family,seed)
                assert event['resource']['rngState']==rng
            elif kind=='phase-end':
                assert self.current is None and event['tick']==self.completed and event['phase']==self.family
                assert event['phase']=={512:'A',1024:'B',1536:'C',1792:'return-A'}.get(self.completed)
                self.endpoint(event['endpoint'])
                self.phase_rows.append(dict(phase=self.family,**event['endpoint']))
                if self.program in ('value','actor') and self.family in ('A','B'):
                    self.saved[self.family]={key:copy.deepcopy(state['weights']) for key,state in self.states.items()}
                if self.arm=='candidate' and self.family=='C':
                    self.anchor=copy.deepcopy(self.states)
                    self.anchor_context=dict(live=set(self.live),energy=copy.deepcopy(self.energy),age=copy.deepcopy(self.age),
                                             positions=copy.deepcopy(self.positions),endpoint=copy.deepcopy(event['endpoint']))
            else:
                raise AssertionError(kind)
        if complete:
            assert self.current is None and not self.buffer


def audit_case(case,config):
    if case['name'].startswith('short-'):
        assert (case['arm'],case['profile'],case['ticks'])==(case['name'][6:],'quiet',4)
    else:
        expected={'mixed-intake':('acceptCruise','mixed',3),'low-contact':('candidate','low',3),
            'age-extinction':('candidate','extinct',1),'partial-mortality':('candidate','partial',2),
            'phase-candidate':('candidate','quiet',1792),'phase-frozen':('frozen','quiet',1025),'phase-reset':('reset','quiet',1025)}
        assert (case['arm'],case['profile'],case['ticks'])==expected[case['name']]
    cp=case['initialCheckpoint']
    w,world=cp['state'],cp['world']['world']
    assert w['arm']==case['arm'] and w['program']==program(case['arm']) and world['tick']==0
    same(w['historySpec'],config['history'])
    same(w['pricing'],CORE['PRICING'])
    same(w['reference'],config['reference'])
    same(w['codebook'],WORLD['codebook'](config['history']['cueSeed']))
    assert w['founderIds']==[1,2] and not world['config']['reproduction'] and not world['config']['mutation']
    for field in ['learning']:
        assert world['config'][field]==(w['program']=='native')
    for field in ['memoryLearning','neuralLearning']:
        assert world['config']['episodicParameters'][field]==(w['program']=='native')
    for key,state in w['learners'].items():
        agent_id=int(key)
        seed=(config['history']['seed']^((agent_id*2654435761)&0xffffffff))&0xffffffff or 1
        expected=VALUE['create'](agent_id,seed,0 if w['arm']=='lambda0' else .9) if w['program']=='value' else CORE['create_body'](agent_id,seed) if w['program']=='actor' else fixed_state(agent_id,seed,w['arm'])
        same(state,expected,'initial program-specific body')
    audit=AuditValueWorld(cp)
    audit.events(case['events'])
    assert audit.completed==case['ticks'] or not audit.live,'missing complete live-founder ticks'
    audit.endpoint(case['endpoint'])
    final=case['finalCheckpoint']
    same(final['state']['learners'],audit.states,'final full learner states')
    same(final['state']['savedModels'],audit.saved,'actual saved models')
    same(final['state']['phaseRows'],audit.phase_rows)
    assert final['world']['world']['tick']==audit.completed
    assert {str(f['id']) for f in final['world']['world']['flies']}==audit.live
    for fly in final['world']['world']['flies']:
        key=str(fly['id'])
        same(fly['energy'],audit.energy[key]);same(fly['age'],audit.age[key])
        same(dict(x=fly['x'],y=fly['y']),audit.positions[key])
    if final['atC'] is not None:
        assert audit.anchor is not None
        same(final['atC']['state']['learners'],audit.anchor)
        same(final['atC']['state']['savedModels'],audit.saved)
        same(final['atC']['world']['world']['totals'],audit.anchor_context['endpoint']['totals'])
        for fly in final['atC']['world']['world']['flies']:
            key=str(fly['id']);same(fly['energy'],audit.anchor_context['energy'][key]);same(dict(x=fly['x'],y=fly['y']),audit.anchor_context['positions'][key])
    return audit


def audit_probe(probe,parent,parent_audit):
    spec,result=probe['spec'],probe['result']
    assert probe['ticks']==2 and probe['resourceSeed']==251209
    if parent is None:
        assert probe['events']==[]
        same(result,dict(**spec,resourceSeed=251209,founders=2,survivors=0,survival=0,value=0,skippedAllDead=True,startWorldSha256=None,
                         resetInitializationOperations=0,resetInitializationEnergyPerFounder=0))
        return None
    cp=parent['finalCheckpoint']['atC'] if probe['parent']=='phase-candidate' else parent['finalCheckpoint']
    states=copy.deepcopy(parent_audit.anchor if probe['parent']=='phase-candidate' else parent_audit.states)
    fixed='acceptCruise' if spec['version']=='accept' else 'acceptStationary' if spec['version']=='acceptStationary' else None
    operations=0
    for key,current in list(states.items()):
        if fixed:
            state=fixed_state(current['agentId'],current['rngState'],fixed,current['lastObservedTick'])
            state['dead'],state['charge']=current['dead'],copy.deepcopy(current['charge'])
            state['charge']['operationsBilled'],state['charge']['storageBytes']=0,0
            states[key]=state
        else:
            operations+=current['work']['scalarOperations']
            if spec['version'] in ('A','B'):
                current['weights']=copy.deepcopy(parent_audit.saved[spec['version']][key])
            if spec['version']=='reset':
                current['weights']=VALUE['zeros']()
            freeze_value(current)
            current.update(previous=None,recent=[],older=[],olderSeen=0,acquiredTransitions=0)
            current['charge']['storageBytes']=0
    events=probe['events']
    assert events[0]['type']=='probe-start' and events[-1]['type']=='probe-end'
    start,end=events[0],events[-1]
    same(start['learners'],states,'uniform compact inference states and inherited debt')
    same(start['spec'],spec)
    assert start['ticks']==2 and start['resourceSeed']==251209 and start['inferenceOnlyCompaction'] and start['resetInitializationOperations']==0
    for field in ['flies','rng','ecologyRng']:
        same(start['world']['world'][field],cp['world']['world'][field],'common source '+field)
    same(sum(p['amount'] for p in start['world']['world']['food']),sum(p['amount'] for p in cp['world']['world']['food']),'no probe refill')
    transfer=spec['family']=='transfer'
    assert start['world']['world']['config']['cueForaging']==(not transfer)
    if not transfer:
        expected=copy.deepcopy(cp['world']['world']['food'])
        cue_layout(expected,cp['state']['codebook'],spec['family'],251209)
        same([p['cue'] for p in start['world']['world']['food']],[p['cue'] for p in expected],'unseen family cue assignment')
        same([dict(x=p['x'],y=p['y']) for p in start['world']['world']['food']],[dict(x=p['x'],y=p['y']) for p in expected])
    energy=sum(f['energy'] for f in cp['world']['world']['flies'])
    debt=sum(s['charge']['outstandingEnergy'] for s in states.values())
    same(start['startingEnergy'],energy);same(start['startingDebt'],debt)
    wrapper=copy.deepcopy(cp['state'])
    wrapper.update(arm=fixed or 'frozen',program='fixed' if fixed else 'value',learners=states,startingEnergy=energy,startingDebt=debt,
        startingOperations=operations,probe=True,transfer=transfer,phaseIndex=['A','B','C'].index('A' if transfer else spec['family']))
    assert start['arm']==end['arm']==wrapper['arm'] and start['program']==end['program']==wrapper['program']
    audit=AuditValueWorld(dict(state=wrapper,world=start['world']),states)
    audit.events(events[1:-1])
    assert audit.completed==start['world']['world']['tick']+2 or not audit.live
    audit.endpoint(end['endpoint']);same(end['learners'],audit.states)
    same(result['endpoint'],end['endpoint'])
    for field in ['founders','survivors','survival']:
        same(result[field],end['endpoint'][field])
    same(result['value'],end['endpoint']['budgetAdjustedEnergyPerFounder'])
    assert result['resourceSeed']==251209 and result['family']==spec['family'] and result['version']==spec['version']
    assert result['resetInitializationOperations']==result['resetInitializationEnergyPerFounder']==0
    assert result['acquisitionDisabled'] and result['learnedWeightsUnchanged'] and result['inferenceOnlyCompaction']
    assert result['skippedAllDead']==(not bool(cp['world']['world']['flies']))
    assert result['startWorldSha256']==start['startWorldSha256'] and audit.counts['transitions']==0
    return audit


def audit_record(record,root):
    assert record['schema']==1 and record['kind']=='value-cue-world-engineering'
    source_check(record,root)
    expected_names={f'short-{arm}' for arm in ARMS}|{'mixed-intake','low-contact','age-extinction','partial-mortality','phase-candidate','phase-frozen','phase-reset'}
    assert len(record['cases'])==len(expected_names)==24 and {c['name'] for c in record['cases']}==expected_names
    cases,audits={},{}
    totals=dict(cases=0,probes=0,decisions=0,physicalReceipts=0,terminalObservations=0,transitions=0,contactQueries=0)
    def count(audit):
        if audit is None:
            return
        for key,value in audit.counts.items():
            totals[key]+=value
        totals['contactQueries']+=audit.contact_queries
    for case in record['cases']:
        cases[case['name']]=case
        audits[case['name']]=audit_case(case,record['config'])
        totals['cases']+=1
        count(audits[case['name']])
    common=[c['initialCheckpoint']['world'] for c in record['cases'] if c['profile']=='quiet' and c['arm'] not in ('incumbent','nullCandidate','nullBlind')]
    assert all(w==common[0] for w in common),'unmatched physical main starts'
    expected={('phase-candidate','probe',f,v) for f,v in SPECS}|{('phase-candidate','sham','A','A')}|{
        (parent,'probe','transfer',v) for parent in ['partial-mortality','age-extinction'] for v in ['C','reset','accept','acceptStationary']}|{('absent-end-C','probe','A','C')}
    assert len(record['probes'])==len(expected)==25
    assert {(p['parent'],p['role'],p['spec']['family'],p['spec']['version']) for p in record['probes']}==expected
    starts,hashes={},{}
    for probe in record['probes']:
        count(audit_probe(probe,cases.get(probe['parent']),audits.get(probe['parent'])))
        totals['probes']+=1
        if probe['parent']!='absent-end-C':
            key=(probe['parent'],probe['spec']['family'])
            start=probe['events'][0]['world']
            if key in starts:
                same(start,starts[key],'full paired physical probe states')
            starts[key]=start
            hashes.setdefault(key,set()).add(probe['result']['startWorldSha256'])
    assert all(len(v)==1 for v in hashes.values())
    actual=next(p for p in record['probes'] if p['parent']=='phase-candidate' and p['role']=='probe' and p['spec']==dict(family='A',version='A'))
    sham=next(p for p in record['probes'] if p['role']=='sham')
    same(actual['events'],sham['events'],'copy sham event identity');same(actual['result'],sham['result'])
    return dict(schema=1,passed=True,**totals,
        scope='Independent wrapper contact geometry, program-specific policy/learning, bills, native costs, physical ledgers, mortality/debt, saved weights and compact paired probes. Native sensory/policy/noise and supply provenance still require exact captured-source replay. Not performance statistics or qualification.')


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('record',type=Path)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    result=audit_record(json.loads(args.record.read_text(encoding='utf8')),Path(__file__).resolve().parents[1])
    text=json.dumps(result,indent=2)+'\n'
    if args.output:
        with args.output.open('x',encoding='utf8') as stream:
            stream.write(text)
    else:
        print(text,end='')
