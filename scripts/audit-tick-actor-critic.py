import argparse
import copy
import hashlib
import json
import math
from pathlib import Path


SOURCES = [
    'learning/tick-actor-critic.mjs', 'learning/odor-identity.mjs',
    'learning/intervention-study.mjs', 'learning/cue-foraging.mjs',
    'learning/sarsa-experiment.mjs', 'scripts/tick-actor-critic-engineering.mjs',
    'scripts/audit-tick-actor-critic.py', 'tests/tick-actor-critic.test.mjs',
    'tests/tick-actor-critic-audit.test.mjs',
]
CONFIG = dict(mechanism='tick-shared-actor-critic-v1', inputs=33, hidden=4, actions=4,
              initializationSeed=0x74616331, discount=.99, **{'lambda': .9}, epsilon=.1,
              actorRate=.01, criticRate=.05, weightBound=4)
PRICING = dict(operationEnergy=5e-6/17, byteEnergyPerSecond=1e-5/(17*8))


def same(actual, expected, location='root'):
    if isinstance(expected, dict):
        assert isinstance(actual, dict) and actual.keys() == expected.keys(), location
        for key in expected:
            same(actual[key], expected[key], f'{location}.{key}')
    elif isinstance(expected, list):
        assert isinstance(actual, list) and len(actual) == len(expected), location
        for index, value in enumerate(expected):
            same(actual[index], value, f'{location}[{index}]')
    elif isinstance(expected, bool) or expected is None or isinstance(expected, str):
        assert type(actual) is type(expected) and actual == expected, location
    elif type(expected) is int:
        assert type(actual) is int and actual == expected, (location, actual, expected)
    else:
        assert type(actual) in (int, float) and math.isfinite(actual), location
        assert math.isclose(actual, expected, rel_tol=1e-10, abs_tol=1e-12), (location, actual, expected)


def rng_next(value):
    value ^= (value << 13) & 0xffffffff
    value ^= value >> 17
    value ^= (value << 5) & 0xffffffff
    return value & 0xffffffff


def initial_weights():
    weights, rng = [0.] * 161, CONFIG['initializationSeed']
    for hidden in range(4):
        for coordinate in range(33):
            rng = rng_next(rng)
            weights[hidden*34+coordinate] = .2 * (rng/4294967296-.5)
    weights[140] = math.log(3)
    return weights


def create_body(agent_id, seed):
    assert type(agent_id) is int and agent_id > 0
    assert type(seed) is int and 0 < seed <= 0xffffffff
    return dict(schema=1, kind='own-tick-shared-actor-critic', agentId=agent_id,
                config=copy.deepcopy(CONFIG), weights=initial_weights(), eligibility=[[0.]*161, [0.]*161],
                pending=None, rngState=seed, decisions=0, transitions=0, lastDecisionTick=0,
                lastObservedTick=0, awaitingObservation=False, acquisition=True, dead=False,
                work=dict(scalarOperations=132*9+1, liveUpdates=0, replayUpdates=0),
                charge=dict(operationsBilled=0, outstandingEnergy=0., incurredEnergy=0., paidEnergy=0., storageBytes=0))


def vector(values, size):
    assert isinstance(values, list) and len(values) == size
    assert all(type(value) in (int, float) and math.isfinite(value) for value in values)


def features(state, raw, observation):
    vector(raw, 17)
    vector(observation, 17)
    for coordinate in [4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16]:
        assert observation[coordinate] == raw[coordinate]
    assert observation[12] == raw[3]
    neutral = observation[0] == 0 and observation[1:4] == [.5, .5, .5]
    if neutral:
        code = [0.] * 16
    else:
        assert observation[0] in (-1, 1) and all(value in (0, 1) for value in observation[1:4])
        signs = [observation[0]] + [2*value-1 for value in observation[1:4]]
        code = []
        for subset in range(16):
            value = .25
            for coordinate in range(4):
                if subset & (1 << coordinate):
                    value *= signs[coordinate]
            code.append(value)
    state['work']['scalarOperations'] += 6 if neutral else 21
    return raw + code


def network(state, inputs, action=None):
    weights = state['weights']
    hidden_values = []
    for hidden in range(4):
        total = weights[hidden*34+33]
        for coordinate in range(33):
            total += weights[hidden*34+coordinate] * inputs[coordinate]
        hidden_values.append(math.tanh(total))
    def head(offset):
        total = weights[offset+4]
        for hidden in range(4):
            total += weights[offset+hidden] * hidden_values[hidden]
        return total
    logits = [head(136+index*5) for index in range(4)]
    exponentials = [math.exp(logit-max(logits)) for logit in logits]
    softmax = [value/sum(exponentials) for value in exponentials]
    probabilities = [.1/4+.9*value for value in softmax]
    value = head(156)
    state['work']['scalarOperations'] += 340
    result = dict(probabilities=probabilities, value=value)
    if action is None:
        return result
    actor, critic = [0.] * 161, [0.] * 161
    factor = .9*softmax[action]/probabilities[action]
    logit_gradients = [factor*((1 if index == action else 0)-probability) for index, probability in enumerate(softmax)]
    for index in range(4):
        for hidden in range(4):
            actor[136+index*5+hidden] = logit_gradients[index]*hidden_values[hidden]
        actor[140+index*5] = logit_gradients[index]
    for hidden in range(4):
        slope = 1-hidden_values[hidden]*hidden_values[hidden]
        signal = 0.
        for index in range(4):
            signal += logit_gradients[index]*weights[136+index*5+hidden]
        actor_hidden, critic_hidden = slope*signal, slope*weights[156+hidden]
        for coordinate in range(33):
            actor[hidden*34+coordinate] = actor_hidden*inputs[coordinate]
            critic[hidden*34+coordinate] = critic_hidden*inputs[coordinate]
        actor[hidden*34+33], critic[hidden*34+33] = actor_hidden, critic_hidden
        critic[156+hidden] = hidden_values[hidden]
    critic[160] = 1.
    state['work']['scalarOperations'] += 338
    return dict(**result, actorGradient=actor, criticGradient=critic)


def transition(state, final_energy, next_value, terminal):
    pending = state['pending']
    assert state['acquisition'] and pending is not None
    reward = (final_energy-pending['initialEnergy'])/120
    delta = (reward+.99*next_value)-pending['value']
    for coordinate in range(161):
        for trace, gradient in zip(state['eligibility'], ['actorGradient', 'criticGradient']):
            trace[coordinate] = (.99*.9)*trace[coordinate]+pending[gradient][coordinate]
        state['weights'][coordinate] = max(-4, min(4, state['weights'][coordinate] +
            ((.01*delta)*state['eligibility'][0][coordinate]+(.05*delta)*state['eligibility'][1][coordinate])))
    state['transitions'] += 1
    state['work']['liveUpdates'] += 1
    state['work']['scalarOperations'] += 8+161*10
    if terminal:
        state['eligibility'] = [[0.]*161, [0.]*161]
    state['pending'] = None
    return dict(agentId=state['agentId'], tick=pending['tick'], duration=1, action=pending['action'],
                initialEnergy=pending['initialEnergy'], finalEnergy=final_energy, reward=reward,
                previousValue=pending['value'], nextValue=next_value, delta=delta, terminal=terminal)


def encoded_bytes(value):
    if value is None or isinstance(value, bool):
        return 1
    if type(value) in (int, float):
        assert math.isfinite(value)
        return 8
    if isinstance(value, str):
        return 4+len(value.encode('utf-8'))
    if isinstance(value, list):
        return 4+sum(encoded_bytes(item) for item in value)
    assert isinstance(value, dict)
    return 4+sum(4+len(key.encode('utf-8'))+encoded_bytes(item) for key, item in value.items())


def bill(state, pricing):
    charge = state['charge']
    operations = state['work']['scalarOperations']-charge['operationsBilled']
    assert operations >= 0
    due = operations*pricing['operationEnergy']
    charge['operationsBilled'] = state['work']['scalarOperations']
    charge['outstandingEnergy'] += due
    charge['incurredEnergy'] += due


def apply_event(state, event, pricing):
    kind = event['type']
    if kind == 'choose':
        own = event['own']
        assert own['agentId'] == state['agentId'] and not state['dead'] and not state['awaitingObservation']
        assert own['tick'] == state['lastObservedTick']+1 and math.isfinite(own['energy'])
        inputs = features(state, own['raw'], own['observation'])
        rows = []
        if state['pending'] is not None:
            assert state['pending']['tick']+1 == own['tick']
            bootstrap = network(state, inputs)
            rows.append(transition(state, own['energy'], bootstrap['value'], False))
        prediction = network(state, inputs)
        state['rngState'] = rng_next(state['rngState'])
        state['work']['scalarOperations'] += 7
        draw, cumulative, action = state['rngState']/4294967296, 0., 3
        for index, probability in enumerate(prediction['probabilities']):
            cumulative += probability
            state['work']['scalarOperations'] += 2
            if draw < cumulative:
                action = index
                break
        assert type(event['action']) is int and event['action'] == action, 'policy choice'
        same(event['transitions'], rows, 'transitions')
        if state['acquisition']:
            gradient = network(state, inputs, action)
            state['pending'] = dict(tick=own['tick'], action=action, initialEnergy=own['energy'],
                                    value=gradient['value'], actorGradient=gradient['actorGradient'], criticGradient=gradient['criticGradient'])
        state['decisions'] += 1
        state['lastDecisionTick'], state['awaitingObservation'] = own['tick'], True
    elif kind == 'observe':
        own = event['own']
        assert own['agentId'] == state['agentId'] and not state['dead'] and state['awaitingObservation']
        assert own['tick'] == state['lastDecisionTick'] == state['lastObservedTick']+1
        assert type(own['terminal']) is bool and math.isfinite(own['energy'])
        rows = [transition(state, own['energy'], 0., True)] if own['terminal'] and state['pending'] is not None else []
        same(event['transitions'], rows, 'terminal transitions')
        state['lastObservedTick'], state['awaitingObservation'], state['dead'] = own['tick'], False, own['terminal']
    elif kind == 'motor':
        raw, action = event['raw'], event['action']
        vector(raw, 17)
        assert type(action) is int and 0 <= action < 4
        accept = action in (0, 2)
        attraction, wall = 2*(raw[2]-raw[1]), 1.8*(raw[10]-raw[11])
        turn = math.tanh((attraction if accept else -attraction+.8*raw[0])+wall)
        same(event['outputs'], [turn, -1 if action >= 2 else 0, 1 if accept else -1, -1, 0], 'motor')
        state['work']['scalarOperations'] += 6 if accept else 9
    elif kind == 'charge':
        bill(state, pricing)
        charge = state['charge']
        if not charge['storageBytes'] or state['lastDecisionTick'] == state['lastObservedTick']+1:
            charge['storageBytes'] = encoded_bytes(state)
        storage = charge['storageBytes']*pricing['byteEnergyPerSecond']*.1
        charge['outstandingEnergy'] += storage
        charge['incurredEnergy'] += storage
        same(event['energyCost'], charge['outstandingEnergy'], 'energyCost')
    elif kind == 'pay':
        charge, paid = state['charge'], event['paid']
        assert math.isfinite(paid) and 0 <= paid <= charge['outstandingEnergy']+1e-10
        charge['outstandingEnergy'] = max(0, charge['outstandingEnergy']-paid)
        charge['paidEnergy'] += paid
    elif kind == 'bill':
        bill(state, pricing)
    elif kind in ('freeze', 'reset'):
        assert not state['awaitingObservation']
        state['pending'], state['eligibility'] = None, [[0.]*161, [0.]*161]
        if kind == 'freeze':
            state['acquisition'] = False
        else:
            state['weights'] = initial_weights()
            state['work']['scalarOperations'] += 132*9+1
    else:
        assert kind == 'restore', kind
    same(event['state'], state, f'{kind}.state')


def audit_record(record, root):
    assert record['schema'] == 1 and record['kind'] == 'tick-actor-critic-engineering-tape'
    assert record['pricing'] == PRICING
    assert set(record['sources']) == set(SOURCES)
    for path, expected in record['sources'].items():
        assert hashlib.sha256((root/path).read_bytes()).hexdigest() == expected, f'source hash {path}'
    roles = {'continuing': (6, 5, False, True), 'frozen-reset': (6, 2, False, False),
             'terminal-debt': (4, 4, True, True), 'neutral': (3, 3, True, True)}
    assert len(record['fixtures']) == len(roles)
    assert {fixture['name'] for fixture in record['fixtures']} == roles.keys()
    covered, totals = set(), dict(fixtures=0, events=0, decisions=0, transitions=0)
    for fixture in record['fixtures']:
        state = create_body(fixture['agentId'], fixture['seed'])
        same(fixture['initialState'], state, 'initialState')
        limit = roles[fixture['name']][0]
        expected_kinds = []
        for tick in range(1, limit+1):
            expected_kinds += ['choose', 'motor', 'charge', 'pay', 'observe']
            if tick == limit and roles[fixture['name']][2]:
                expected_kinds.append('bill')
            if fixture['name'] == 'frozen-reset' and tick in (3, 5):
                expected_kinds.append('freeze' if tick == 3 else 'reset')
            expected_kinds.append('restore')
        assert [event['type'] for event in fixture['events']] == expected_kinds, 'event ordering and coverage'
        choice, raw, requested = None, None, None
        for event in fixture['events']:
            if event['type'] == 'motor':
                assert event['action'] == choice, 'motor did not apply chosen action'
                same(event['raw'], raw, 'motor sensor input')
            if event['type'] == 'pay':
                same(event['paid'], requested/(2 if fixture['name'] == 'terminal-debt' else 1), 'fixture payment')
            apply_event(state, event, record['pricing'])
            if event['type'] == 'choose':
                choice, raw = event['action'], event['own']['raw']
            if event['type'] == 'charge':
                requested = event['energyCost']
            covered.add(event['type'])
        same(fixture['finalState'], state, 'finalState')
        assert (state['decisions'], state['transitions'], state['dead'], state['acquisition']) == roles[fixture['name']]
        totals['fixtures'] += 1
        totals['events'] += len(fixture['events'])
        totals['decisions'] += state['decisions']
        totals['transitions'] += state['transitions']
    assert covered == {'choose', 'motor', 'charge', 'pay', 'observe', 'restore', 'bill', 'freeze', 'reset'}
    return dict(schema=1, passed=True, **totals, scope='Independent synthetic learner arithmetic and byte-time billing; not sensor provenance, physical replay, performance, or RSI.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('record', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    record = json.loads(args.record.read_text(encoding='utf-8'))
    result = audit_record(record, Path(__file__).resolve().parents[1])
    text = json.dumps(result, indent=2)+'\n'
    if args.output:
        with args.output.open('x', encoding='utf-8') as stream:
            stream.write(text)
    else:
        print(text, end='')


if __name__ == '__main__':
    main()
