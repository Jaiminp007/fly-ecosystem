"""Independent taste/held-movement/replay/price reconstruction on named API fixtures."""
import argparse
import copy
import hashlib
import json
import math
import re
import runpy
from pathlib import Path

CORE = runpy.run_path(str(Path(__file__).with_name('audit-tick-actor-critic.py')))
same = CORE['same']
DEFAULTS = dict(mechanism='stationary-taste-energy-v1', tasteDimensions=11, motorDimensions=16,
    holdTicks=16, capacity=32, recent=8, discount=.95, **{'lambda': .9}, epsilon=.1, tasteRate=.1,
    actorRate=.05, criticRate=.1, tdRmsRate=.03125, tdFloor=1e-6, advantageBound=4, weightBound=8, priorOdds=3,feedingRule='matching')
FIXTURES = [dict(name=name, agentId=51+i, seed=254001+i, ticks=ticks, **({'options': options} if options else {}))
    for i, (name, ticks, options) in enumerate([
        ('reservoir-terminal',192,{}),('terminal-first',1,{}),('freeze-reset',80,{}),('reset-live',192,{}),
        ('cue-blind',160,dict(cueBlind=True)),('taste-off',64,dict(tasteLearning=False)),
        ('normalization-off',80,dict(normalizeMotor=False)),('neutral',32,{}),('no-contact',32,{}),('compact-inference',192,{})])]


def create(agent_id, seed, options):
    # This observer covers the original pairwise/shared-motor fixtures only.
    # New orthogonal/appetite development mechanisms need their own extension
    # before any independent reconstruction claim can be made for them.
    assert options.get('tasteRepresentation', 'pairwise') == 'pairwise'
    assert options.get('motorRepresentation', 'shared') == 'shared'
    assert options.get('holdTicks', 16) == 16
    assert options.get('tasteRate', .1) == .1
    config = dict(DEFAULTS, tasteLearning=True, normalizeMotor=True, cueBlind=False,
                  tasteRepresentation='pairwise', motorRepresentation='shared')
    config.update(options)
    return dict(schema=1, kind='own-taste-energy', agentId=agent_id, config=config,
        priorLogit=math.log(3), tasteScale=1/math.sqrt(11),
        weights=dict(taste=[0.]*11,actor=[0.]*16,critic=[0.]*16), eligibility=dict(actor=[0.]*16,critic=[0.]*16),
        credit=dict(schema=2,agentId=agent_id,maskedCue=config['cueBlind'],tick=0,pending=None,dead=False,scalarOperations=0),
        hold=dict(cruise=False,remaining=0), motorPending=None, tdRms=0., recent=[],older=[],olderSeen=0,
        tasteExamples=0,acquiredTasteExamples=0, feedRngState=seed,motorRngState=(seed^0x9e3779b9)&0xffffffff or 1,
        retentionRngState=(seed^0xa511e9b3)&0xffffffff or 1,replayRngState=(seed^0x63d83595)&0xffffffff or 1,
        decisions=0,lastDecisionTick=0,lastObservedTick=0,awaitingObservation=False,acquisition=True,dead=False,
        work=dict(scalarOperations=6,liveUpdates=0,replayUpdates=0,tasteLiveUpdates=0,motorUpdates=0),
        charge=dict(operationsBilled=0,outstandingEnergy=0.,incurredEnergy=0.,paidEnergy=0.,storageBytes=0))


def count(state, n):
    state['work']['scalarOperations'] += n


def dot(state, weights, phi):
    count(state, 2*len(phi))
    return sum(w*x for w,x in zip(weights,phi))


def sigmoid(state, x):
    count(state, 4)
    return 1/(1+math.exp(-x))


def draw(state, key):
    state[key] = CORE['rng_next'](state[key])
    count(state, 7)
    return state[key]/4294967296


def index_draw(state, key, size):
    value = math.floor(draw(state,key)*size)
    count(state, 2)
    return value


def taste_features(cue, scale):
    return [v*scale for v in [1]+list(cue)+[cue[a]*cue[b] for a in range(4) for b in range(a+1,4)]]


def features(state, raw, cue, contact):
    count(state,31)  # Six products, eleven taste scales, fourteen motor scales.
    return taste_features(cue,state['tasteScale']),[1.]+[v*.25 for v in raw[:14]]+[.25 if contact else 0.]


def taste_prediction(state, phi):
    value = dot(state,state['weights']['taste'],phi)+state['priorLogit']
    count(state,1)
    return sigmoid(state,value)


def remember(state, record):
    state['recent'].append(copy.deepcopy(record))
    if len(state['recent'])<=8:
        return
    displaced=state['recent'].pop(0)
    state['olderSeen']+=1
    if len(state['older'])<24:
        state['older'].append(displaced)
    else:
        index=index_draw(state,'retentionRngState',state['olderSeen'])
        count(state,1)
        if index<24:
            state['older'][index]=displaced


def taste_update(state, record, mode, events):
    prediction=taste_prediction(state,record['phi'])
    error=record['target']-prediction
    step=.1*error
    count(state,2+11*4)
    state['weights']['taste']=[max(-8.,min(8.,w+step*x)) for w,x in zip(state['weights']['taste'],record['phi'])]
    if mode=='live':
        state['work']['tasteLiveUpdates']+=1
        state['work']['liveUpdates']+=1
    else:
        state['work']['replayUpdates']+=1
    events.append(copy.deepcopy(dict(type='taste-update',mode=mode,record=record,prediction=prediction,error=error,step=step)))


def replay(state, events):
    records=state['older']+state['recent']
    if records:
        taste_update(state,records[index_draw(state,'replayRngState',len(records))],'replay',events)


def motor_update(state, energy, next_phi, terminal, duration, events):
    p=state['motorPending']
    assert p and state['acquisition'] and 1<=duration<=16
    reward=(energy-p['initialEnergy'])/120
    count(state,2)
    previous=dot(state,state['weights']['critic'],p['phi'])
    next_value=0. if terminal else dot(state,state['weights']['critic'],next_phi)
    fraction=duration/16
    discount=.95**fraction
    decay=discount*(.9**fraction)
    count(state,4)
    target=reward if terminal else reward+discount*next_value
    delta=target-previous
    count(state,1+(0 if terminal else 2))
    scale,advantage=1.,delta
    if state['config']['normalizeMotor']:
        state['tdRms']=.96875*state['tdRms']+.03125*(delta*delta)
        scale=max(1e-6,math.sqrt(state['tdRms']))
        advantage=max(-4.,min(4.,delta/scale))
        count(state,9)
    derivative=.9*(p['baseProbability']*(1-p['baseProbability']))
    factor=derivative/p['probability'] if p['cruise'] else -derivative/(1-p['probability'])
    actor_step,critic_step=.05*advantage,.1*delta
    count(state,3+(1 if p['cruise'] else 3)+2+16*13)
    for j,phi in enumerate(p['phi']):
        state['eligibility']['actor'][j]=decay*state['eligibility']['actor'][j]+factor*phi
        state['eligibility']['critic'][j]=decay*state['eligibility']['critic'][j]+phi
        state['weights']['actor'][j]=max(-8.,min(8.,state['weights']['actor'][j]+actor_step*state['eligibility']['actor'][j]))
        state['weights']['critic'][j]=max(-8.,min(8.,state['weights']['critic'][j]+critic_step*state['eligibility']['critic'][j]))
    state['work']['motorUpdates']+=1
    state['work']['liveUpdates']+=1
    state['motorPending']=None
    if terminal:
        state['eligibility']=dict(actor=[0.]*16,critic=[0.]*16)
    events.append(copy.deepcopy(dict(type='motor-update',record=dict(p,duration=duration,finalEnergy=energy,terminal=terminal,reward=reward),
        previousValue=previous,nextValue=next_value,discount=discount,decay=decay,target=target,delta=delta,scale=scale,advantage=advantage,factor=factor)))
    if state['config']['tasteLearning']:
        replay(state,events)


def choose(state, own):
    assert own['agentId']==state['agentId'] and not state['dead'] and not state['awaitingObservation']
    assert own['tick']==state['lastObservedTick']+1
    taste,motor=features(state,own['raw'],own['cue'],own['contactPresent'])
    events=[]
    if state['hold']['remaining']==0:
        if state['motorPending']:
            assert own['tick']-state['motorPending']['tick']==16
            motor_update(state,own['energy'],motor,False,16,events)
        logit=dot(state,state['weights']['actor'],motor)+state['priorLogit']
        count(state,1)
        base=sigmoid(state,logit)
        probability=.05+.9*base
        count(state,2)
        cruise=draw(state,'motorRngState')<probability
        count(state,1)
        state['hold']=dict(cruise=cruise,remaining=16)
        state['motorPending']=dict(tick=own['tick'],phi=list(motor),cruise=cruise,baseProbability=base,
            probability=probability,initialEnergy=own['energy']) if state['acquisition'] else None
    prediction=taste_prediction(state,taste) if own['odorPresent'] else 1.
    probability=(.05 if prediction<.5 else .95) if state['config']['feedingRule']=='greedy' else .05+.9*prediction
    if not own['odorPresent']:
        probability=1.
    if own['odorPresent']:
        count(state,1 if state['config']['feedingRule']=='greedy' else 2)
    accept=draw(state,'feedRngState')<probability
    action=(0 if state['hold']['cruise'] else 2)+(0 if accept else 1)
    count(state,2)
    state['hold']['remaining']-=1
    assert state['credit']['pending'] is None and not state['credit']['dead']
    state['credit']['pending']=dict(tick=own['tick'],action=action,cue=list(own['cue']),contactPresent=own['contactPresent'] and own['odorPresent'])
    state['decisions']+=1
    state['lastDecisionTick']=own['tick']
    state['awaitingObservation']=True
    return action,events


def observe(state, own):
    assert own['agentId']==state['agentId'] and state['awaitingObservation'] and not state['dead']
    assert own['tick']==state['lastDecisionTick']==state['lastObservedTick']+1
    credit=state['credit'];p=credit['pending']
    assert p and p['tick']==own['tick'] and math.isfinite(own['lastFood']) and abs(own['lastFood'])<=1
    count(state,3);credit['scalarOperations']+=3
    example=None
    if p['action']==2 and p['contactPresent'] and own['lastFood']!=0:
        example=dict(agentId=own['agentId'],tick=own['tick'],cue=list(p['cue']),signedIntake=own['lastFood'],
            outcomeSign=1 if own['lastFood']>0 else -1,terminal=own['terminal'])
    credit.update(tick=own['tick'],pending=None,dead=own['terminal'])
    events=[]
    if state['acquisition'] and state['config']['tasteLearning'] and example:
        phi=taste_features(example['cue'],state['tasteScale'])
        count(state,18)  # Six pair products, eleven scales and target comparison.
        state['tasteExamples']+=1;state['acquiredTasteExamples']+=1
        record=dict(example,phi=phi,target=1 if example['outcomeSign']==1 else 0,experience=state['tasteExamples'])
        remember(state,record)
        taste_update(state,record,'live',events)
        replay(state,events)
    if own['terminal'] and state['motorPending']:
        motor_update(state,own['energy'],None,True,own['tick']-state['motorPending']['tick']+1,events)
    state.update(lastObservedTick=own['tick'],awaitingObservation=False,dead=own['terminal'])
    return events


def freeze(state):
    state['acquisition']=False;state['motorPending']=None
    state['eligibility']=dict(actor=[0.]*16,critic=[0.]*16)


def reset(state):
    state.update(weights=dict(taste=[0.]*11,actor=[0.]*16,critic=[0.]*16),eligibility=dict(actor=[0.]*16,critic=[0.]*16),
        motorPending=None,hold=dict(cruise=False,remaining=0),tdRms=0.,recent=[],older=[],olderSeen=0,acquiredTasteExamples=0)


def compact(state):
    freeze(state)
    state.update(hold=dict(cruise=False,remaining=0),tdRms=0.,recent=[],older=[],olderSeen=0,acquiredTasteExamples=0)


def sources(record, root):
    found={}
    def visit(path):
        path=path.resolve();name=path.relative_to(root.resolve()).as_posix()
        if name in found:
            return
        data=path.read_bytes();found[name]=hashlib.sha256(data).hexdigest()
        if path.suffix in ('.mjs','.js'):
            for imported in re.findall(r'''(?:from|import)\s+['"](\.[^'"]+)['"]''',data.decode('utf8')):
                visit(path.parent/imported)
    for name in ['scripts/taste-energy-engineering.mjs','scripts/audit-taste-energy.py','scripts/audit-tick-actor-critic.py',
        'tests/taste-energy.test.mjs','tests/taste-energy-audit.test.mjs','tests/stationary-taste-credit.test.mjs','docs/TASTE_ENERGY_DESIGN.md']:
        visit(root/name)
    same(record['sources'],found,'complete taste-energy source closure')


def audit(record, root):
    assert record['schema']==1 and record['kind']=='taste-energy-component-engineering'
    same(record['pricing'],CORE['PRICING'])
    sources(record,root)
    assert len(record['fixtures'])==len(FIXTURES)
    totals=dict(fixtures=len(FIXTURES),contactCases=4,decisions=0,tasteLiveUpdates=0,motorUpdates=0,replayUpdates=0,terminalObservations=0,events=0)
    for fixture,config in zip(record['fixtures'],FIXTURES):
        for key,value in config.items():
            same(fixture[key],value,'fixed fixture identity')
        state=create(config['agentId'],config['seed'],config.get('options',{}))
        same(fixture['initialState'],state,'initial complete state')
        physical,last_food,index=50.,0.,0
        def take(kind,**payload):
            nonlocal index
            assert index<len(fixture['events']),'missing event'
            same(fixture['events'][index],dict(type=kind,**payload,state=state),f"{config['name']}:{index}:{kind}")
            index+=1
        for tick in range(1,config['ticks']+1):
            raw=[0.]*17
            raw[0],raw[2],raw[3],raw[4],raw[10],raw[13],raw[16]=.8,.6,.5,physical/120,1 if tick%3==0 else 0,last_food,1
            source=[[1,-1,1,-1],[-1,1,-1,1],[1,1,-1,-1],[-1,-1,1,1]][((tick-1)//16)%4]
            neutral=config['name'] in ('neutral','terminal-first');contact=config['name']!='no-contact'
            cue=[0,0,0,0] if neutral or config.get('options',{}).get('cueBlind') else source
            own=dict(agentId=config['agentId'],tick=tick,energy=physical-state['charge']['outstandingEnergy'],raw=raw,cue=cue,contactPresent=contact,odorPresent=not neutral)
            action,updates=choose(state,own)
            take('choose',own=own,action=action,updates=updates)
            accept=action in (0,2)
            attraction,wall=2*(raw[2]-raw[1]),1.8*(raw[10]-raw[11])
            outputs=[math.tanh((attraction if accept else -attraction+.8*raw[0])+wall),-1 if action>=2 else 0,1 if accept else -1,-1,0]
            count(state,6 if accept else 9)
            take('motor',raw=raw,action=action,outputs=outputs)
            CORE['bill'](state,record['pricing'])
            charge=state['charge'];charge['storageBytes']=CORE['encoded_bytes'](state)
            storage=charge['storageBytes']*record['pricing']['byteEnergyPerSecond']*.1
            charge['outstandingEnergy']+=storage;charge['incurredEnergy']+=storage
            energy_cost=charge['outstandingEnergy'];take('charge',energyCost=energy_cost)
            paid=energy_cost/2 if config['name']=='reservoir-terminal' else energy_cost
            charge['outstandingEnergy']=max(0.,charge['outstandingEnergy']-paid);charge['paidEnergy']+=paid;physical-=paid
            take('pay',paid=paid)
            last_food=(.03 if tick%3==0 else -.01) if accept and contact else 0.
            physical+=last_food-.02
            terminal=tick==config['ticks'] and config['name'] in ('terminal-first','reservoir-terminal')
            own=dict(agentId=config['agentId'],tick=tick,energy=(0. if terminal else physical)-charge['outstandingEnergy'],lastFood=last_food,terminal=terminal)
            updates=observe(state,own);take('observe',own=own,updates=updates)
            if terminal:
                CORE['bill'](state,record['pricing']);take('bill');totals['terminalObservations']+=1
            if config['name']=='freeze-reset' and tick==33:
                freeze(state);take('freeze')
            if config['name']=='freeze-reset' and tick==49 or config['name']=='reset-live' and tick==96:
                reset(state);take('reset')
            if config['name']=='compact-inference' and tick==128:
                compact(state);take('compact')
            take('restore')
        assert index==len(fixture['events']),'extra event'
        same(fixture['finalState'],state,'final complete state')
        totals['decisions']+=state['decisions'];totals['events']+=index
        for key in ['tasteLiveUpdates','motorUpdates','replayUpdates']:
            totals[key]+=state['work'][key]
    expected_contacts=[
        dict(name='radius-tie',fly=dict(x=100,y=100),patches=[dict(x=115,y=100,cue=[1,-1,1,-1]),dict(x=85,y=100,cue=[-1,1,-1,1]),dict(x=115.001,y=100,cue=[-1,1,-1,1])],fallback=[0,0,0,0]),
        dict(name='distant-fallback',fly=dict(x=500,y=500),patches=[dict(x=100,y=100,cue=[1,-1,1,-1])],fallback=[-1,1,-1,1]),
        dict(name='absent',fly=dict(x=0,y=0),patches=[],fallback=[0,0,0,0]),
        dict(name='contact-no-odor',fly=dict(x=0,y=0),patches=[dict(x=0,y=0,cue=[0,0,0,0])],fallback=[0,0,0,0])]
    assert len(record['contacts'])==4
    for observed,config in zip(record['contacts'],expected_contacts):
        for key,value in config.items():
            same(observed[key],value,'fixed contact case')
        nearest=math.inf;selected=config['fallback'];present=False;operations=1
        for patch in config['patches']:
            dx,dy=patch['x']-config['fly']['x'],patch['y']-config['fly']['y']
            squared=dx*dx+dy*dy;operations+=6
            if squared<=225:
                operations+=1
                if squared<nearest:
                    nearest,selected,present=squared,patch['cue'],True
        same(observed['output'],dict(cue=selected,contactPresent=present,odorPresent=selected[0]!=0),'local observation')
        same(observed['work'],dict(scalarOperations=operations),'local observation work')
    return dict(schema=1,passed=True,**totals,
        scope='Independent full taste/held-movement/normalized-score/trace/reservoir/replay/ledger/encoding/lifecycle reconstruction on fixed artificial API schedules. Not physical provenance, a performance study, learner qualification or RSI.')


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('record',type=Path);parser.add_argument('--output',type=Path);args=parser.parse_args()
    result=audit(json.loads(args.record.read_text(encoding='utf8')),Path(__file__).resolve().parents[1])
    if args.output:
        with args.output.open('x',encoding='utf8') as stream:
            json.dump(result,stream,indent=2);stream.write('\n')
    print(json.dumps(result))
