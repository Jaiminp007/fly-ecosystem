"""Independent sparse expansion, stochastic policy, three-factor plasticity."""
import json
import math
from pathlib import Path
import runpy

base = runpy.run_path(str(Path(__file__).with_name('audit-sarsa-screen.py')))
close, rng = base['close'], base['rng']


def projection():
    random, operations, cells = 0x4d42a11, 0, []
    for _ in range(64):
        indices = []
        while len(indices) < 6:
            random = rng(random)
            index = 1 + math.floor(random / 4294967296 * 39)
            operations += 3
            seen = False
            for old in indices:
                operations += 1
                if old == index:
                    seen = True
                    break
            if not seen:
                indices.append(index)
        cells.append(indices)
    return cells, operations


def features(s, observation):
    sensory = base['features'](s, observation)
    scores = [sum(float(sensory[index]) for index in indices) for indices in s['projection']]
    s['operations'] += 64 * 6
    phi, selected = [0.0] * 64, set()
    for _ in range(8):
        best = -1
        for j in range(64):
            s['operations'] += 2
            if j not in selected and (best < 0 or scores[j] > scores[best]):
                best = j
        selected.add(best)
        phi[best] = 1 / math.sqrt(8)
        s['operations'] += 3
    return phi


def policy(s, phi):
    logit = sum((s['weights'][0][j] + s['weights'][1][j]) * phi[j] for j in range(64))
    sigmoid = 1 / (1 + math.exp(-logit))
    probability = .05 + .9 * sigmoid
    slope = .9 * sigmoid * (1 - sigmoid) / (probability * (1 - probability))
    s['operations'] += 64 * 3 + 14
    return probability, slope


def update(s, tr):
    assert tr['agentId'] == s['agentId'] and s['acquisition']
    assert tr['experience'] == s['transitions'] + 1 and 0 < tr['duration'] <= 8
    close([tr['probability'], tr['gradientFactor']], [s['lastProbability'], s['lastGradient']], 'saved policy and score gradient')
    close(tr['phi'], s['lastPhi'], 'own factual KC activity')
    close(tr['reward'], (tr['finalEnergy'] - tr['initialEnergy']) / 120, 'actual net reward')
    assert sum(v != 0 for v in tr['phi']) == 8
    dopamine = max(-1, min(1, (tr['reward'] - s['rewardBaseline']) / .01))
    decay = math.exp(-tr['duration'] / 128) * s['config']['lambda']
    fast_decay = math.exp(-tr['duration'] / 512)
    for j in range(64):
        s['eligibility'][0][j] = decay * s['eligibility'][0][j] + tr['gradientFactor'] * tr['phi'][j]
        s['weights'][0][j] = max(-2, min(2, fast_decay * s['weights'][0][j] + .1 * dopamine * s['eligibility'][0][j]))
        s['operations'] += 9
        if tr['phi'][j] != 0:
            transfer = s['config']['consolidationRate'] * s['weights'][0][j]
            before = s['weights'][1][j]
            s['weights'][1][j] = max(-2, min(2, before + transfer))
            accepted = s['weights'][1][j] - before
            s['weights'][0][j] -= accepted
            if accepted != 0:
                s['plasticityDiagnostics']['transfers'] += 1
                s['plasticityDiagnostics']['absoluteTransfer'] += abs(accepted)
            s['operations'] += 10
    s['rewardBaseline'] += .05 * (tr['reward'] - s['rewardBaseline'])
    s['transitions'] += 1
    s['plasticityDiagnostics']['updates'] += 1
    s['plasticityDiagnostics']['nonzeroDopamine'] += int(dopamine != 0)
    s['operations'] += 20
    s['recent'] = (s['recent'] + [tr])[-16:]
    if tr['terminal']:
        s['eligibility'][0] = [0.0] * 64


def audit_trace(path, seed, program):
    states, decisions, transitions, bodies = {}, 0, 0, 0
    expected_projection, initial_operations = projection()
    with path.open(encoding='utf8') as stream:
        for line in stream:
            event = json.loads(line)
            if event.get('program') != program:
                continue
            arm = event['arm']
            if event['type'] == 'start':
                assert event['seed'] == seed
                states[arm] = {}
                for original in event['learners']:
                    assert original['config']['mechanism'] == 'sparse-dopamine-policy-v1'
                    assert original['config']['lambda'] == (0 if arm == 'lambda0' else .9)
                    assert original['config']['consolidationRate'] == (0 if program == 'fastOnly' else .02)
                    assert original['projection'] == expected_projection
                    s = dict(original)
                    s.update(weights=[[0.0] * 64 for _ in range(2)], eligibility=[[0.0] * 64], history=[], recent=[], operations=initial_operations,
                             rewardBaseline=0.0, plasticityDiagnostics={'updates': 0, 'nonzeroDopamine': 0, 'transfers': 0, 'absoluteTransfer': 0.0})
                    expected = (seed ^ ((s['agentId'] * 2654435761) & 0xffffffff)) & 0xffffffff or 1
                    assert s['rngState'] == expected and original['work']['scalarOperations'] == initial_operations
                    close(original['weights'], s['weights'], 'initial MB weights')
                    states[arm][s['agentId']] = s
            elif event['type'] == 'intervention':
                for s in states[arm].values():
                    s['eligibility'] = [[0.0] * 64]
                    if event['action'] == 'freeze':
                        s['acquisition'] = False
                    else:
                        s['weights'], s['history'], s['recent'], s['rewardBaseline'] = [[0.0] * 64 for _ in range(2)], [], [], 0.0
            elif event['type'] == 'experience':
                s = states[arm][event['agentId']]
                decision, records = event['decision'], event['transitions']
                phi = features(s, decision['observation']) if decision else None
                for tr in [v for v in records if not decision or v['tick'] < event['tick']]:
                    close(tr['nextPhi'], [0.0] * 64 if tr['terminal'] else phi, 'matured successor features')
                    update(s, tr)
                    transitions += 1
                if decision:
                    probability, slope = policy(s, phi)
                    s['rngState'] = rng(s['rngState'])
                    action = 1 if s['rngState'] / 4294967296 < probability else -1
                    assert action == decision['choice'], 'independent MB sampled policy'
                    s['lastProbability'], s['lastGradient'] = probability, (int(action > 0) - probability) * slope
                    s['lastPhi'] = phi
                    s['operations'] += 5
                    s['history'] = (s['history'] + [decision])[-3:]
                    s['decisions'] += 1
                    decisions += 1
                for tr in [v for v in records if decision and v['tick'] == event['tick']]:
                    assert tr['terminal'] and tr['duration'] == 1
                    close(tr['nextPhi'], [0.0] * 64, 'terminal MB bootstrap-free record')
                    update(s, tr)
                    transitions += 1
            elif event['type'] == 'end':
                for original in event['learners']:
                    s = states[arm][original['agentId']]
                    for key in ['weights', 'eligibility', 'rewardBaseline']:
                        close(original[key], s[key], 'final MB ' + key)
                    for key, value in s['plasticityDiagnostics'].items():
                        close(original['plasticityDiagnostics'][key], value, 'plasticity diagnostic ' + key)
                    for key in ['rngState', 'retentionRngState', 'replayRngState', 'olderSeen', 'decisions', 'transitions', 'acquisition']:
                        assert original[key] == s[key], key
                    assert original['work']['scalarOperations'] == s['operations'], (arm, 'modeled work')
                    assert original['work']['liveUpdates'] == s['transitions'] and original['work']['replayUpdates'] == original['replayUpdates'] == 0
                    assert original['recentExperiences'] == [tr['experience'] for tr in s['recent']] and original['olderExperiences'] == []
                    c = original['charge']
                    close(c['incurredEnergy'] - c['paidEnergy'], c['outstandingEnergy'], 'MB paid/debt ledger')
                    bodies += 1
            else:
                raise AssertionError(event['type'])
    assert bodies > 0, ('Empty MB audit', program)
    return {'factualTransitions': transitions, 'decisions': decisions, 'learnerBodies': bodies}
