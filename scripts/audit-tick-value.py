"""Independent direct-value, normalized-history, reservoir and price arithmetic."""
import argparse
import copy
import hashlib
import json
import math
import re
import runpy
from pathlib import Path

CORE=runpy.run_path(str(Path(__file__).with_name('audit-tick-actor-critic.py')))
same=CORE['same']
CONFIG=dict(mechanism='tick-linear-expected-sarsa-v1',dimensions=71,actions=4,epsilon=.1,discount=.99,
            **{'lambda':.9},updateRate=.05,replayRate=.01,capacity=64,recent=16,weightBound=4)
FIXTURES=[dict(name=name,agentId=31+index,seed=251001+index,ticks=ticks,**{'lambda':lam}) for index,(name,ticks,lam) in enumerate([
    ('reservoir',90,.9),('lambda-zero',8,0),('freeze-reset',9,.9),('reset-live',14,.9),('terminal-first',1,.9),('terminal-reservoir',75,.9),('contact',5,.9)])]


def zeros():
    return [[0.]*71 for _ in range(4)]


def create(agent_id,seed,lam):
    return dict(schema=1,kind='own-tick-linear-value',agentId=agent_id,config=dict(CONFIG,**{'lambda':lam}),weights=zeros(),eligibility=zeros(),
        previous=None,pending=None,recent=[],older=[],olderSeen=0,acquiredTransitions=0,rngState=seed,
        retentionRngState=(seed^0x9e3779b9)&0xffffffff or 1,replayRngState=(seed^0xa511e9b3)&0xffffffff or 1,
        decisions=0,transitions=0,lastDecisionTick=0,lastObservedTick=0,awaitingObservation=False,acquisition=True,dead=False,
        work=dict(scalarOperations=2,liveUpdates=0,replayUpdates=0),
        charge=dict(operationsBilled=0,outstandingEnergy=0.,incurredEnergy=0.,paidEnergy=0.,storageBytes=0))


def draw(state,key):
    state[key]=CORE['rng_next'](state[key])
    state['work']['scalarOperations']+=7
    return state[key]/4294967296


def index_draw(state,key,size):
    value=math.floor(draw(state,key)*size)
    state['work']['scalarOperations']+=2
    return value


def features(state,raw,observation):
    assert raw[16]==1 and all(abs(v)<=1 for v in raw)
    base=CORE['features'](state,raw,observation)
    if state['previous'] is None:
        values=base+[0.]*38
    else:
        previous=state['previous']
        values=base+[.5*v for v in previous['inputs']]+[.5 if a==previous['action'] else 0. for a in range(4)]+[1.]
        state['work']['scalarOperations']+=37
    norm=max(1.,math.sqrt(sum(v*v for v in values)))
    state['work']['scalarOperations']+=215
    return base,[v/norm for v in values]


def prediction(state,phi):
    values=[sum(w*v for w,v in zip(row,phi)) for row in state['weights']]
    maximum=max(values)
    ties=sum(v==maximum for v in values)
    probabilities=[.1/4+((1-.1)/ties if value==maximum else 0.) for value in values]
    state['work']['scalarOperations']+=579+2*ties
    return values,probabilities


def expected(state,phi):
    values,probabilities=prediction(state,phi)
    state['work']['scalarOperations']+=8
    return sum(v*p for v,p in zip(values,probabilities))


def remember(state,record):
    state['recent'].append(copy.deepcopy(record))
    if len(state['recent'])<=16:
        return
    displaced=state['recent'].pop(0)
    state['olderSeen']+=1
    if len(state['older'])<48:
        state['older'].append(displaced)
    else:
        index=index_draw(state,'retentionRngState',state['olderSeen'])
        if index<48:
            state['older'][index]=displaced


def update(state,energy,next_phi,terminal):
    p=state['pending']
    assert p is not None and state['acquisition'] and not state['dead']
    reward=(energy-p['initialEnergy'])/120
    previous=prediction(state,p['phi'])[0][p['action']]
    next_value=0. if terminal else expected(state,next_phi)
    target=reward if terminal else reward+.99*next_value
    delta=target-previous
    decay=.99*state['config']['lambda']
    step=.05*delta
    state['work']['scalarOperations']+=1713+(0 if terminal else 2)
    for action in range(4):
        for index in range(71):
            state['eligibility'][action][index]=decay*state['eligibility'][action][index]+(p['phi'][index] if action==p['action'] else 0.)
            state['weights'][action][index]=max(-4.,min(4.,state['weights'][action][index]+step*state['eligibility'][action][index]))
    state['transitions']+=1
    state['acquiredTransitions']+=1
    state['work']['liveUpdates']+=1
    record=dict(agentId=state['agentId'],tick=p['tick'],duration=1,phi=list(p['phi']),action=p['action'],reward=reward,nextPhi=list(next_phi),
                terminal=terminal,initialEnergy=p['initialEnergy'],finalEnergy=energy,experience=state['transitions'])
    remember(state,record)
    records=state['older']+state['recent']
    selected=records[index_draw(state,'replayRngState',len(records))]
    replay_prediction=prediction(state,selected['phi'])[0][selected['action']]
    replay_next=0. if selected['terminal'] else expected(state,selected['nextPhi'])
    replay_target=selected['reward'] if selected['terminal'] else selected['reward']+.99*replay_next
    replay_delta=replay_target-replay_prediction
    replay_step=.01*replay_delta
    state['work']['scalarOperations']+=286+(0 if selected['terminal'] else 2)
    state['weights'][selected['action']]=[max(-4.,min(4.,weight+replay_step*feature)) for weight,feature in zip(state['weights'][selected['action']],selected['phi'])]
    state['work']['replayUpdates']+=1
    state['pending']=None
    if terminal:
        state['eligibility']=zeros()
    return dict(record=record,prediction=previous,nextValue=next_value,target=target,delta=delta,
                replay=dict(experience=selected['experience'],prediction=replay_prediction,nextValue=replay_next,target=replay_target,delta=replay_delta))


def choose(state,own):
    assert own['agentId']==state['agentId'] and not state['dead'] and not state['awaitingObservation']
    assert own['tick']==state['lastObservedTick']+1
    base,phi=features(state,own['raw'],own['observation'])
    transitions=[]
    if state['pending'] is not None:
        transitions.append(update(state,own['energy'],phi,False))
    _,probabilities=prediction(state,phi)
    value=draw(state,'rngState')
    cumulative=0.
    action=3
    for index,probability in enumerate(probabilities):
        cumulative+=probability
        state['work']['scalarOperations']+=2
        if value<cumulative:
            action=index
            break
    state['pending']=dict(tick=own['tick'],phi=list(phi),action=action,initialEnergy=own['energy']) if state['acquisition'] else None
    state['previous']=dict(inputs=base,action=action,tick=own['tick'])
    state['decisions']+=1
    state['lastDecisionTick']=own['tick']
    state['awaitingObservation']=True
    return action,transitions


def observe(state,own):
    assert own['agentId']==state['agentId'] and state['awaitingObservation'] and not state['dead']
    assert own['tick']==state['lastDecisionTick']==state['lastObservedTick']+1
    rows=[]
    if own['terminal'] and state['pending'] is not None:
        rows.append(update(state,own['energy'],[0.]*71,True))
    state['lastObservedTick']=own['tick']
    state['awaitingObservation']=False
    state['dead']=own['terminal']
    return rows


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
    for name in ['scripts/tick-value-engineering.mjs','scripts/audit-tick-value.py','scripts/audit-tick-actor-critic.py',
                 'tests/tick-value.test.mjs','tests/tick-value-audit.test.mjs','docs/TICK_VALUE_DESIGN.md']:
        visit(root/name)
    same(record['sources'],found,'complete value source closure')


def audit_record(record,root):
    assert record['schema']==1 and record['kind']=='tick-direct-value-engineering'
    same(record['pricing'],CORE['PRICING'])
    source_check(record,root)
    assert len(record['fixtures'])==7
    totals=dict(fixtures=7,decisions=0,liveUpdates=0,replayUpdates=0,terminalObservations=0,reservoirDraws=0,events=0)
    for fixture,config in zip(record['fixtures'],FIXTURES):
        for key,value in config.items():
            same(fixture[key],value,'fixed fixture identity')
        state=create(config['agentId'],config['seed'],config['lambda'])
        same(fixture['initialState'],state,'initial value state')
        physical,last_food,index=50.,0.,0
        def take(kind,**payload):
            nonlocal index
            assert index<len(fixture['events']),'missing event'
            event=fixture['events'][index]
            index+=1
            same(event,dict(type=kind,**payload,state=state),'complete reconstructed event')
        for tick in range(1,config['ticks']+1):
            raw=[0.]*17
            raw[0],raw[2],raw[3],raw[4],raw[10],raw[13],raw[16]=.8,.6,.5,physical/120,1 if tick%3==0 else 0,last_food,1
            cue=[1,-1,1,-1] if tick%2 else [-1,1,-1,1]
            if config['name'] in ('terminal-first','lambda-zero'):
                cue=[0,0,0,0]
            if config['name']=='contact':
                fly=dict(x=100,y=100)
                patches=[dict(x=100,y=100,cue=[1,-1,1,-1]),dict(x=130,y=100,cue=[-1,1,-1,1])]
                fallback=[-1,1,-1,1]
                nearest=math.inf
                cue=fallback
                for patch in patches:
                    squared=(patch['x']-fly['x'])**2+(patch['y']-fly['y'])**2
                    state['work']['scalarOperations']+=6
                    if squared<=225:
                        state['work']['scalarOperations']+=1
                        if squared<nearest:
                            nearest,cue=squared,patch['cue']
                take('contact',fly=fly,patches=patches,fallback=fallback,cue=cue)
            observation=list(raw)
            observation[:4]=[cue[0]]+[(v+1)/2 for v in cue[1:]]
            observation[12]=raw[3]
            own=dict(agentId=config['agentId'],tick=tick,energy=physical-state['charge']['outstandingEnergy'],raw=raw,observation=observation)
            action,rows=choose(state,own)
            take('choose',own=own,action=action,transitions=rows)
            accept=action in (0,2)
            attraction,wall=2*(raw[2]-raw[1]),1.8*(raw[10]-raw[11])
            outputs=[math.tanh((attraction if accept else -attraction+.8*raw[0])+wall),-1 if action>=2 else 0,1 if accept else -1,-1,0]
            state['work']['scalarOperations']+=6 if accept else 9
            take('motor',raw=raw,action=action,outputs=outputs)
            CORE['bill'](state,record['pricing'])
            state['charge']['storageBytes']=CORE['encoded_bytes'](state)
            storage=state['charge']['storageBytes']*record['pricing']['byteEnergyPerSecond']*.1
            state['charge']['outstandingEnergy']+=storage
            state['charge']['incurredEnergy']+=storage
            energy_cost=state['charge']['outstandingEnergy']
            take('charge',energyCost=energy_cost)
            paid=energy_cost/2 if config['name']=='terminal-reservoir' else energy_cost
            state['charge']['outstandingEnergy']=max(0.,state['charge']['outstandingEnergy']-paid)
            state['charge']['paidEnergy']+=paid
            physical-=paid
            take('pay',paid=paid)
            last_food=.03 if tick%3==0 else -.01
            physical+=last_food
            terminal=tick==config['ticks'] and config['name'] in ('terminal-first','terminal-reservoir')
            after=dict(agentId=config['agentId'],tick=tick,energy=(0. if terminal else physical)-state['charge']['outstandingEnergy'],terminal=terminal)
            endings=observe(state,after)
            take('observe',own=after,transitions=endings)
            if terminal:
                CORE['bill'](state,record['pricing'])
                take('bill')
                totals['terminalObservations']+=1
            if config['name']=='freeze-reset' and tick==3:
                state['acquisition']=False
                state['pending']=None
                state['eligibility']=zeros()
                take('freeze')
            if config['name']=='freeze-reset' and tick==5 or config['name']=='reset-live' and tick==7:
                state.update(weights=zeros(),eligibility=zeros(),previous=None,pending=None,recent=[],older=[],olderSeen=0,acquiredTransitions=0)
                take('reset')
            state=copy.deepcopy(state)
            take('restore')
        assert index==len(fixture['events']),'trailing/extra engineering events'
        same(fixture['finalState'],state,'final independent value state')
        totals['decisions']+=state['decisions']
        totals['liveUpdates']+=state['work']['liveUpdates']
        totals['replayUpdates']+=state['work']['replayUpdates']
        totals['reservoirDraws']+=max(0,state['olderSeen']-48)
        totals['events']+=index
    assert totals['reservoirDraws']>0 and totals['terminalObservations']==2
    return dict(schema=1,passed=True,**totals,scope='Independent synthetic value/history/policy/trace/reservoir/replay/motor/charge arithmetic; not physical worlds, learning qualification, meaningful pressure or RSI.')


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
