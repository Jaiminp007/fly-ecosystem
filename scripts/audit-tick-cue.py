import argparse
import copy
import hashlib
import json
import math
import re
import runpy
from pathlib import Path


CORE = runpy.run_path(str(Path(__file__).with_name('audit-tick-actor-critic.py')))
same, vector = CORE['same'], CORE['vector']
ARMS = ['candidate', 'frozen', 'reset', 'cueBlind', 'shuffled', 'nullCandidate', 'nullBlind',
        'incumbent', 'acceptCruise', 'refuseCruise', 'acceptStationary', 'refuseStationary', 'random']
LEARNED = set(ARMS[:7])
SPECS = [('A', 'A'), ('A', 'C'), ('A', 'reset'), ('B', 'A'), ('B', 'B'), ('B', 'C'),
         ('B', 'reset'), ('C', 'B'), ('C', 'C')] + [('transfer', version) for version in ['A', 'C', 'reset', 'accept', 'acceptStationary']]
SEEDS = ['scripts/tick-cue-engineering.mjs', 'scripts/audit-tick-cue.py',
         'scripts/audit-tick-actor-critic.py', 'tests/tick-cue-world-audit.test.mjs']


def verify_sources(record, root):
    found = {}
    def visit(path):
        path = path.resolve()
        name = path.relative_to(root.resolve()).as_posix()
        if name in found:
            return
        data = path.read_bytes()
        found[name] = hashlib.sha256(data).hexdigest()
        if path.suffix in ('.mjs', '.js'):
            for imported in re.findall(r'''(?:from|import)\s+['"](\.[^'"]+)['"]''', data.decode('utf-8')):
                visit(path.parent/imported)
    for seed in SEEDS:
        visit(root/seed)
    same(record['sources'], found, 'source closure')


def codebook(seed):
    rng = seed
    def shuffle(values):
        nonlocal rng
        values = copy.deepcopy(values)
        for index in range(len(values)-1, 0, -1):
            rng = CORE['rng_next'](rng)
            other = math.floor(rng/4294967296*(index+1))
            values[index], values[other] = values[other], values[index]
        return values
    patterns = shuffle([dict(id=index+1, bits=[1 if index & (1 << bit) else -1 for bit in range(4)]) for index in range(16)])
    result = {}
    for index, family in enumerate(['A', 'B', 'C']):
        labels = shuffle([-1, -1, 1, 1])
        result[family] = [dict(**pattern, valence=labels[offset]) for offset, pattern in enumerate(patterns[index*4:index*4+4])]
    return result


def fixed_state(agent_id, seed, arm, tick=0):
    return dict(schema=1, kind='native-tick-reference-observer' if arm == 'incumbent' else 'fixed-tick-menu-control',
                agentId=agent_id, arm=arm, rngState=seed, dead=False, decisions=tick, lastDecisionTick=tick, lastObservedTick=tick,
                work=dict(scalarOperations=0, liveUpdates=0, replayUpdates=0),
                charge=dict(operationsBilled=0, outstandingEnergy=0, incurredEnergy=0, paidEnergy=0, storageBytes=0))


def choose(state, own):
    assert own['agentId'] == state['agentId'] and not state['dead'] and not state['awaitingObservation']
    assert own['tick'] == state['lastObservedTick']+1
    inputs = CORE['features'](state, own['raw'], own['observation'])
    transitions = []
    if state['pending'] is not None:
        assert state['pending']['tick']+1 == own['tick']
        bootstrap = CORE['network'](state, inputs)
        transitions.append(CORE['transition'](state, own['energy'], bootstrap['value'], False))
    prediction = CORE['network'](state, inputs)
    state['rngState'] = CORE['rng_next'](state['rngState'])
    state['work']['scalarOperations'] += 7
    draw, cumulative, action = state['rngState']/4294967296, 0., 3
    for index, probability in enumerate(prediction['probabilities']):
        cumulative += probability
        state['work']['scalarOperations'] += 2
        if draw < cumulative:
            action = index
            break
    if state['acquisition']:
        gradient = CORE['network'](state, inputs, action)
        state['pending'] = dict(tick=own['tick'], action=action, initialEnergy=own['energy'], value=gradient['value'],
                                actorGradient=gradient['actorGradient'], criticGradient=gradient['criticGradient'])
    state['decisions'] += 1
    state['lastDecisionTick'], state['awaitingObservation'] = own['tick'], True
    return action, transitions


def freeze(state):
    state['acquisition'], state['pending'], state['eligibility'] = False, None, [[0.]*161, [0.]*161]


def reset(state):
    state['weights'], state['pending'], state['eligibility'] = CORE['initial_weights'](), None, [[0.]*161, [0.]*161]
    state['work']['scalarOperations'] += 1189


class AuditWorld:
    def __init__(self, checkpoint, states=None):
        self.wrapper = copy.deepcopy(checkpoint['state'])
        self.world = checkpoint['world']['world']
        self.arm, self.pricing = self.wrapper['arm'], self.wrapper['pricing']
        self.states = copy.deepcopy(self.wrapper['learners'] if states is None else states)
        self.ids = self.wrapper['founderIds']
        assert set(self.states) == {str(agent_id) for agent_id in self.ids}
        self.flies = {str(fly['id']): fly for fly in self.world['flies']}
        self.live = set(self.flies)
        self.energy = {key: fly['energy'] for key, fly in self.flies.items()}
        self.food_signal = {key: fly['lastFood'] for key, fly in self.flies.items()}
        self.age = {key: fly['age'] for key, fly in self.flies.items()}
        self.completed = self.world['tick']
        self.current = None
        self.actions, self.native, self.receipts, self.observed, self.buffer = {}, {}, {}, set(), {}
        self.sums = dict(cost=0., beneficial=0., harmful=0., damage=0., discarded=0., deaths=0, age=0, energy=0,
                         signalCost=0., signalExposure=0.)
        self.counts = dict(decisions=0, physicalReceipts=0, terminalObservations=0, transitions=0)
        self.saved, self.phase_rows, self.anchor = {}, [], None
        self.interventions = set()
        self.family = ['A', 'B', 'C', 'return-A'][min(self.wrapper['phaseIndex'], 3)]

    def tick(self, value):
        if self.current is None:
            assert value == self.completed+1
            self.current, self.tick_live = value, set(self.live)
            self.actions, self.native, self.receipts, self.observed = {}, {}, {}, set()
        assert value == self.current

    def raw(self, key, raw):
        vector(raw, 17)
        same(raw[4], self.energy[key]/120, 'own energy sensor')
        same(raw[13], self.food_signal[key], 'previous intake sensor')
        same(raw[16], 1, 'bias sensor')
        self.sums['signalExposure'] += raw[12]

    def verify_observation(self, event):
        own, cue = event['own'], event['sourceCue']
        vector(cue, 4)
        assert all(value in (-1, 0, 1) for value in cue)
        if self.wrapper['transfer'] or self.arm in ('cueBlind', 'nullBlind'):
            cue = [0, 0, 0, 0]
        elif self.arm == 'shuffled':
            family = 'A' if self.family == 'return-A' else self.family
            text = f"{self.wrapper['historySpec']['shuffleSeed']}:{own['agentId']}:{own['tick']}"
            index = int(hashlib.sha256(text.encode()).hexdigest()[:8], 16) % 4
            cue = self.wrapper['codebook'][family][index]['bits']
        expected = list(own['raw'])
        expected[:4] = [cue[0]]+[(value+1)/2 for value in cue[1:]]
        expected[12] = own['raw'][3]
        same(own['observation'], expected, 'cue observation')

    def decision(self, event):
        own = event['own']
        self.tick(own['tick'])
        key = str(own['agentId'])
        assert key in self.tick_live and key not in self.actions
        state = self.states[key]
        self.raw(key, own['raw'])
        same(event['physicalEnergy'], self.energy[key], 'decision physical energy')
        same(own['energy'], self.energy[key]-state['charge']['outstandingEnergy'], 'budget-adjusted own energy')
        self.verify_observation(event)
        if self.arm in LEARNED:
            action, rows = choose(state, own)
            same(self.buffer.pop(key, []), rows, 'matured transitions')
        else:
            assert state['lastObservedTick']+1 == own['tick'] and not state['dead']
            state['work']['scalarOperations'] += 1
            if self.arm == 'random':
                state['rngState'] = CORE['rng_next'](state['rngState'])
                action = math.floor(state['rngState']/4294967296*4)
                state['work']['scalarOperations'] += 9
            else:
                action = ['acceptCruise', 'refuseCruise', 'acceptStationary', 'refuseStationary'].index(self.arm)
            state['decisions'] += 1
            state['lastDecisionTick'] = own['tick']
        same(event['choice'], action, 'chosen menu action')
        accept, raw = action in (0, 2), own['raw']
        attraction, wall = 2*(raw[2]-raw[1]), 1.8*(raw[10]-raw[11])
        outputs = [math.tanh((attraction if accept else -attraction+.8*raw[0])+wall),
                   -1 if action >= 2 else 0, 1 if accept else -1, -1, 0]
        same(event['outputs'], outputs, 'motor output')
        state['work']['scalarOperations'] += 6 if accept else 9
        CORE['bill'](state, self.pricing)
        charge = state['charge']
        charge['storageBytes'] = CORE['encoded_bytes'](state)
        storage = charge['storageBytes']*self.pricing['byteEnergyPerSecond']*.1
        charge['outstandingEnergy'] += storage
        charge['incurredEnergy'] += storage
        same(event['rngState'], state['rngState'], 'body RNG')
        same(event['scalarOperations'], state['work']['scalarOperations'], 'decision work')
        same(event['storageBytes'], charge['storageBytes'], 'state byte-time')
        same(event['requestedExtra'], charge['outstandingEnergy'], 'requested charge')
        self.actions[key] = dict(outputs=outputs, requested=charge['outstandingEnergy'])
        self.counts['decisions'] += 1

    def native_cost(self, event):
        self.tick(event['tick'])
        key = str(event['agentId'])
        assert key in self.tick_live and key not in self.native
        if event['type'] == 'native-motor':
            assert self.arm == 'incumbent' and key not in self.actions
            self.raw(key, event['raw'])
            vector(event['outputs'], 5)
            state = self.states[key]
            state['decisions'] += 1
            state['lastDecisionTick'] = event['tick']
            self.actions[key] = dict(outputs=event['outputs'], requested=0.)
            self.counts['decisions'] += 1
        else:
            assert self.arm != 'incumbent' and key in self.actions
            same(event['outputs'], self.actions[key]['outputs'], 'applied motor')
        for field in ['nativeMemoryRecords', 'nativeLookupRecords']:
            assert type(event[field]) is int and event[field] >= 0
        parameters = self.world['config']['episodicParameters']
        memory = (2 if parameters['reserveRisk'] else 1)*(event['nativeMemoryRecords']*parameters['memoryEnergyPerRecordSecond']*.1 +
                   event['nativeLookupRecords']*parameters['lookupEnergyPerRecord'])
        fly, outputs = self.flies[key], self.actions[key]['outputs']
        speed = (outputs[1]+1)/2*fly['genome']['traits']['speed']
        signal = 0 if self.world['config']['signalMode'] == 'disabled' else (outputs[4]+1)/2
        signal_cost = signal*.015*.1
        baseline = (fly['genome']['traits']['metabolism']+speed*.008+len(fly['genome']['nodes'])*.0007+signal_cost/.1)*.1+memory
        self.sums['signalCost'] += signal_cost
        self.native[key] = baseline

    def physical(self, event):
        self.tick(event['tick'])
        key = str(event['agentId'])
        assert set(self.actions) == self.tick_live == set(self.native)
        assert key in self.tick_live and key not in self.receipts
        initial, requested = self.energy[key], self.actions[key]['requested']
        baseline = self.native[key]
        cost = min(initial, baseline+requested)
        paid = max(0, cost-min(initial, baseline))
        same(event['initialEnergy'], initial, 'receipt initial body energy')
        same(event['cost'], cost, 'native plus experimental physical cost')
        same(event['paidExtra'], paid, 'paid experimental cost')
        same(event['requestedExtra'], requested, 'receipt requested extra')
        for field in ['beneficialEaten', 'harmfulEaten', 'toxinDamage', 'finalEnergy']:
            assert math.isfinite(event[field]) and event[field] >= 0
        assert event['toxinDamage'] <= event['harmfulEaten']+1e-10
        if not self.world['config']['cueForaging']:
            same(event['harmfulEaten'], 0.)
            same(event['toxinDamage'], 0.)
        final = initial-cost+event['beneficialEaten']-event['toxinDamage']
        same(event['finalEnergy'], final, 'physical ledger')
        assert -1e-10 <= final <= 120+1e-10
        state, charge = self.states[key], self.states[key]['charge']
        if self.arm != 'incumbent':
            charge['outstandingEnergy'] = max(0, charge['outstandingEnergy']-paid)
            charge['paidEnergy'] += paid
            same(event['incurredEnergy'], charge['incurredEnergy'], 'incurred energy')
            same(event['paidEnergy'], charge['paidEnergy'], 'paid energy')
        same(event['storageBytes'], charge['storageBytes'])
        same(event['outstandingEnergy'], charge['outstandingEnergy'], 'unpaid energy')
        self.energy[key] = final
        net = event['beneficialEaten']-event['toxinDamage']
        self.food_signal[key] = max(-1, min(1, net)) if self.world['config']['cueForaging'] else min(1, event['beneficialEaten'])
        self.age[key] += .1
        for total, field in [('cost', 'cost'), ('beneficial', 'beneficialEaten'), ('harmful', 'harmfulEaten'), ('damage', 'toxinDamage')]:
            self.sums[total] += event[field]
        self.receipts[key] = event
        self.counts['physicalReceipts'] += 1

    def observe(self, event):
        own, key = event['own'], str(event['own']['agentId'])
        assert own['tick'] == self.current and key in self.receipts and key not in self.observed
        assert set(self.receipts) == self.tick_live
        terminal = self.energy[key] <= 0 or self.age[key] > self.flies[key]['genome']['traits']['lifespan']
        same(own['terminal'], terminal, 'physical death condition')
        physical = 0. if terminal else self.energy[key]
        discarded = self.energy[key] if terminal else 0.
        state = self.states[key]
        same(event['physicalEnergy'], physical, 'observed physical energy')
        same(event['discardedEnergy'], discarded, 'discarded age-death energy')
        same(own['energy'], physical-state['charge']['outstandingEnergy'], 'own terminal/current energy')
        rows = []
        if self.arm in LEARNED:
            assert state['awaitingObservation'] and state['lastDecisionTick'] == own['tick']
            if terminal and state['pending'] is not None:
                rows.append(CORE['transition'](state, own['energy'], 0., True))
            state['awaitingObservation'] = False
        same(self.buffer.pop(key, []), rows, 'terminal transitions')
        state['lastObservedTick'], state['dead'] = own['tick'], terminal
        if terminal:
            self.live.remove(key)
            self.sums['discarded'] += discarded
            self.sums['deaths'] += 1
            self.sums['energy' if self.energy[key] <= 0 else 'age'] += 1
            self.energy[key] = 0.
            if self.arm != 'incumbent':
                CORE['bill'](state, self.pricing)
            self.counts['terminalObservations'] += 1
        for field in ['outstandingEnergy', 'incurredEnergy', 'paidEnergy']:
            same(event[field], state['charge'][field], f'observe {field}')
        same(event['scalarOperations'], state['work']['scalarOperations'], 'terminal/lifetime work')
        self.observed.add(key)
        if self.observed == self.tick_live:
            self.completed, self.current = self.current, None
            assert not self.buffer

    def endpoint(self, actual):
        assert self.current is None
        energy = sum(self.energy[key] for key in self.live)
        debt = sum(state['charge']['outstandingEnergy'] for state in self.states.values())
        operations = sum(state['work']['scalarOperations'] for state in self.states.values())
        totals = copy.deepcopy(self.world['totals'])
        totals['foodEaten'] += self.sums['beneficial']+self.sums['harmful']
        totals['dissipated'] += self.sums['cost']+self.sums['harmful']+self.sums['damage']+self.sums['discarded']
        totals['signalCost'] += self.sums['signalCost']
        totals['signalExposure'] += self.sums['signalExposure']
        totals['deaths'] += self.sums['deaths']
        for cause in ['energy', 'age']:
            totals['deathCauses'][cause] += self.sums[cause]
        if self.world['config']['cueForaging']:
            for field, total in [('beneficialEaten', 'beneficial'), ('harmfulEaten', 'harmful'), ('toxinDamage', 'damage')]:
                totals[field] += self.sums[total]
        external = actual['totals']['externalEnergy']
        assert math.isfinite(external) and external >= self.world['totals']['externalEnergy']-1e-10
        totals['externalEnergy'] = external
        inventory = sum(patch['amount'] for patch in self.world['food'])+(external-self.world['totals']['externalEnergy'])-self.sums['beneficial']-self.sums['harmful']
        same(actual['foodInventory'], inventory, 'resource conservation conditioned on external supply')
        residual = actual['foodInventory']+energy+totals['dissipated']-self.world['initialEnergy']-external
        expected = dict(tick=self.completed, founders=len(self.ids), survivors=len(self.live), survival=len(self.live)/len(self.ids),
                        physicalEnergy=energy, startingEnergy=self.wrapper['startingEnergy'], startingDebt=self.wrapper['startingDebt'],
                        outstandingEnergy=debt, budgetAdjustedEnergyPerFounder=(energy-self.wrapper['startingEnergy']-(debt-self.wrapper['startingDebt']))/len(self.ids),
                        accountingResidual=residual, foodInventory=actual['foodInventory'], totals=totals, scalarOperations=operations,
                        additionalScalarOperations=operations-self.wrapper['startingOperations'],
                        learnerEncodedBytes=0 if self.arm == 'incumbent' else sum(CORE['encoded_bytes'](state) for state in self.states.values()))
        same(actual, expected, 'endpoint')
        assert abs(actual['accountingResidual']) < 1e-7

    def events(self, events, complete=True):
        for event in events:
            assert event['arm'] == self.arm
            kind = event['type']
            if kind == 'transition':
                key = str(event['agentId'])
                assert key in self.live and key not in self.buffer
                self.buffer[key] = [{field: value for field, value in event.items() if field not in ('arm', 'type')}]
                self.counts['transitions'] += 1
            elif kind == 'decision':
                self.decision(event)
            elif kind in ('native-cost', 'native-motor'):
                self.native_cost(event)
            elif kind == 'physical':
                self.physical(event)
            elif kind == 'observe':
                self.observe(event)
            elif kind == 'intervention':
                assert self.current is None and event['tick'] == self.completed and self.arm in ('frozen', 'reset')
                assert event['phase'] == {512: 'B', 1024: 'C'}.get(self.completed) and event['action'] == self.arm
                assert self.completed not in self.interventions
                self.interventions.add(self.completed)
                for key in self.live:
                    freeze(self.states[key]) if self.arm == 'frozen' else reset(self.states[key])
            elif kind == 'phase':
                assert self.current is None and event['tick'] == self.completed
                assert event['phase'] == {512: 'B', 1024: 'C', 1536: 'return-A'}.get(self.completed)
                if self.arm in ('frozen', 'reset') and self.completed in (512, 1024):
                    assert self.completed in self.interventions
                self.family = event['phase']
                assert event['resource']['family'] == self.family
                index = ['A', 'B', 'C', 'return-A'].index(self.family)
                assert event['resource']['seed'] == self.wrapper['historySpec']['resourceSeeds'][index]
            else:
                assert kind == 'phase-end' and self.current is None and event['tick'] == self.completed
                assert event['phase'] == self.family
                assert event['phase'] == {512: 'A', 1024: 'B', 1536: 'C', 1792: 'return-A'}.get(self.completed)
                self.endpoint(event['endpoint'])
                self.phase_rows.append(dict(phase=event['phase'], **event['endpoint']))
                if self.arm in LEARNED and self.family in ('A', 'B'):
                    self.saved[self.family] = {key: copy.deepcopy(state['weights']) for key, state in self.states.items()}
                if self.arm == 'candidate' and self.family == 'C':
                    self.anchor = copy.deepcopy(self.states)
        if complete:
            assert self.current is None and not self.buffer


def audit_case(case, config):
    if case['name'].startswith('short-'):
        assert (case['arm'], case['profile'], case['ticks']) == (case['name'][6:], 'quiet', 4)
    else:
        expected = {'mixed-intake': ('acceptCruise', 'mixed', 3), 'age-extinction': ('candidate', 'extinct', 1),
                    'partial-mortality': ('candidate', 'partial', 2), 'phase-candidate': ('candidate', 'quiet', 1792),
                    'phase-frozen': ('frozen', 'quiet', 1025), 'phase-reset': ('reset', 'quiet', 1025)}
        assert (case['arm'], case['profile'], case['ticks']) == expected[case['name']]
    checkpoint = case['initialCheckpoint']
    wrapper, world = checkpoint['state'], checkpoint['world']['world']
    assert case['arm'] == wrapper['arm'] and world['tick'] == 0
    same(wrapper['historySpec'], config['history'])
    same(wrapper['pricing'], CORE['PRICING'])
    same(wrapper['codebook'], codebook(config['history']['cueSeed']), 'codebook')
    assert not world['config']['reproduction'] and not world['config']['mutation']
    assert world['config']['challenges'] == 'off'
    assert world['config']['learning'] == (case['arm'] == 'incumbent')
    assert wrapper['founderIds'] == [1, 2]
    for key, state in wrapper['learners'].items():
        agent_id = int(key)
        seed = (config['history']['seed'] ^ ((agent_id*2654435761) & 0xffffffff)) & 0xffffffff or 1
        expected = CORE['create_body'](agent_id, seed) if case['arm'] in LEARNED else fixed_state(agent_id, seed, case['arm'])
        same(state, expected, 'initial learner')
    audit = AuditWorld(checkpoint)
    audit.events(case['events'])
    assert audit.completed == case['ticks'] or not audit.live, 'missing live-body ticks'
    audit.endpoint(case['endpoint'])
    final = case['finalCheckpoint']
    same(final['state']['learners'], audit.states, 'final learner states')
    same(final['state']['savedModels'], audit.saved, 'saved skill weights')
    same(final['state']['phaseRows'], audit.phase_rows, 'phase endpoints')
    final_world = final['world']['world']
    assert {str(fly['id']) for fly in final_world['flies']} == audit.live
    same(final_world['tick'], audit.completed)
    same(final_world['totals'], case['endpoint']['totals'])
    for fly in final_world['flies']:
        same(fly['energy'], audit.energy[str(fly['id'])], 'final physical body energy')
    if final['atC'] is not None:
        assert audit.anchor is not None
        same(final['atC']['state']['learners'], audit.anchor, 'end-C anchor')
    return audit


def audit_probe(probe, parent, parent_audit):
    spec, result = probe['spec'], probe['result']
    assert probe['ticks'] == 2 and probe['resourceSeed'] == 17049
    if parent is None:
        assert probe['events'] == []
        same(result, dict(**spec, resourceSeed=probe['resourceSeed'], founders=2, survivors=0, survival=0, value=0,
                          skippedAllDead=True, startWorldSha256=None, resetInitializationOperations=0, resetInitializationEnergyPerFounder=0))
        return dict(decisions=0, physicalReceipts=0, terminalObservations=0, transitions=0)
    checkpoint = parent['finalCheckpoint']['atC'] if probe['parent'] == 'phase-candidate' else parent['finalCheckpoint']
    states = copy.deepcopy(parent_audit.anchor if probe['parent'] == 'phase-candidate' else parent_audit.states)
    fixed_arm = 'acceptCruise' if spec['version'] == 'accept' else 'acceptStationary' if spec['version'] == 'acceptStationary' else None
    starting_operations, reset_operations = 0, 0
    for key, current in list(states.items()):
        if fixed_arm:
            fixed = fixed_state(current['agentId'], current['rngState'], fixed_arm, current['lastObservedTick'])
            fixed['dead'], fixed['charge'] = current['dead'], copy.deepcopy(current['charge'])
            fixed['charge']['operationsBilled'], fixed['charge']['storageBytes'] = 0, 0
            states[key] = fixed
        else:
            starting_operations += current['work']['scalarOperations']
            if spec['version'] in ('A', 'B'):
                current['weights'] = copy.deepcopy(parent_audit.saved[spec['version']][key])
            if spec['version'] == 'reset' and not current['dead']:
                reset(current)
                reset_operations += 1189
            freeze(current)
    events = probe['events']
    assert events[0]['type'] == 'probe-start' and events[-1]['type'] == 'probe-end'
    start, end = events[0], events[-1]
    same(start['learners'], states, 'probe starting model/debt')
    same(start['spec'], spec)
    same(start['resourceSeed'], probe['resourceSeed'])
    same(start['ticks'], probe['ticks'])
    same(start['resetInitializationOperations'], reset_operations)
    same(start['world']['world']['flies'], checkpoint['world']['world']['flies'], 'common probe bodies')
    same(start['world']['world']['rng'], checkpoint['world']['world']['rng'], 'common physical RNG')
    same(start['world']['world']['ecologyRng'], checkpoint['world']['world']['ecologyRng'])
    same(sum(patch['amount'] for patch in start['world']['world']['food']),
         sum(patch['amount'] for patch in checkpoint['world']['world']['food']), 'probe inventory not refilled')
    assert start['world']['world']['config']['cueForaging'] == (spec['family'] != 'transfer')
    debt = sum(state['charge']['outstandingEnergy'] for state in states.values())
    energy = sum(fly['energy'] for fly in checkpoint['world']['world']['flies'])
    same(start['startingDebt'], debt)
    same(start['startingEnergy'], energy)
    wrapper = copy.deepcopy(checkpoint['state'])
    wrapper.update(arm=fixed_arm or 'frozen', learners=states, startingEnergy=energy, startingDebt=debt,
                   startingOperations=starting_operations, probe=True, transfer=spec['family'] == 'transfer',
                   phaseIndex=['A', 'B', 'C'].index('A' if spec['family'] == 'transfer' else spec['family']))
    assert start['arm'] == end['arm'] == wrapper['arm']
    audit = AuditWorld(dict(state=wrapper, world=start['world']), states)
    audit.events(events[1:-1])
    assert audit.completed == start['world']['world']['tick']+probe['ticks'] or not audit.live
    audit.endpoint(end['endpoint'])
    same(end['learners'], audit.states, 'probe final states')
    same(result['endpoint'], end['endpoint'])
    for field in ['founders', 'survivors', 'survival']:
        same(result[field], end['endpoint'][field])
    same(result['value'], end['endpoint']['budgetAdjustedEnergyPerFounder'])
    same(result['resetInitializationOperations'], reset_operations)
    same(result['resetInitializationEnergyPerFounder'], reset_operations*CORE['PRICING']['operationEnergy']/2)
    same(result['skippedAllDead'], not bool(checkpoint['world']['world']['flies']))
    assert result['startWorldSha256'] == start['startWorldSha256']
    assert result['acquisitionDisabled'] and result['learnedWeightsUnchanged']
    assert audit.counts['transitions'] == 0
    for key, state in audit.states.items():
        if not fixed_arm:
            same(state['weights'], states[key]['weights'], 'probe weights frozen')
    return audit.counts


def audit_record(record, root):
    assert record['schema'] == 1 and record['kind'] == 'tick-cue-world-engineering'
    verify_sources(record, root)
    same(record['config']['pricing'], CORE['PRICING'])
    expected_names = {f'short-{arm}' for arm in ARMS} | {'mixed-intake', 'age-extinction', 'partial-mortality', 'phase-candidate', 'phase-frozen', 'phase-reset'}
    assert len(record['cases']) == len(expected_names) and {case['name'] for case in record['cases']} == expected_names
    cases, audits = {}, {}
    totals = dict(cases=0, probes=0, decisions=0, physicalReceipts=0, terminalObservations=0, transitions=0)
    for case in record['cases']:
        cases[case['name']] = case
        audit = audit_case(case, record['config'])
        audits[case['name']] = audit
        totals['cases'] += 1
        for key, value in audit.counts.items():
            totals[key] += value
    common = [case['initialCheckpoint']['world'] for case in record['cases'] if case['profile'] == 'quiet' and case['arm'] not in ('incumbent', 'nullCandidate', 'nullBlind')]
    assert all(world == common[0] for world in common), 'unmatched initial physical states'
    expected_probes = {('phase-candidate', family, version) for family, version in SPECS}
    expected_probes |= {(parent, 'transfer', version) for parent in ['partial-mortality', 'age-extinction'] for version in ['C', 'reset', 'accept', 'acceptStationary']}
    expected_probes.add(('absent-end-C', 'A', 'C'))
    assert len(record['probes']) == len(expected_probes)
    assert {(probe['parent'], probe['spec']['family'], probe['spec']['version']) for probe in record['probes']} == expected_probes
    hashes, starts = {}, {}
    for probe in record['probes']:
        counts = audit_probe(probe, cases.get(probe['parent']), audits.get(probe['parent']))
        totals['probes'] += 1
        for key, value in counts.items():
            totals[key] += value
        if probe['parent'] != 'absent-end-C':
            key = (probe['parent'], probe['spec']['family'])
            hashes.setdefault(key, set()).add(probe['result']['startWorldSha256'])
            world = probe['events'][0]['world']
            if key in starts:
                assert world == starts[key], 'unpaired full physical checkpoints'
            starts[key] = world
    assert all(len(values) == 1 for values in hashes.values()), 'unpaired physical starts'
    assert totals['physicalReceipts'] > 0 and totals['terminalObservations'] > 0 and totals['transitions'] > 0
    return dict(schema=1, passed=True, **totals,
                scope='Independent wrapper policy/price/energy-ledger and paired-probe arithmetic; full sensor/physics/native-controller provenance and resource supply require exact Node replay. No performance statistics or qualification.')


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
