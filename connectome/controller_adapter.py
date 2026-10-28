"""Versioned observer view for the distinct MaleCNS controller contract."""

def controller_view(agent, audit):
    if not agent or not audit:
        return {'schema': 1, 'model': 'malecns-connectome', 'available': False}
    neural = agent.get('neural', {})
    return {
        'schema': 1,
        'model': 'malecns-connectome',
        'available': True,
        'agentId': agent['id'],
        'generation': agent['generation'],
        'parents': list(agent.get('parents', [])),
        'ageSeconds': agent['age'],
        'energy': agent['energy'],
        'offspring': agent.get('offspring', 0),
        'bodyTraits': dict(agent.get('alleles', {})),
        'controller': {
            'neurons': audit['neurons'],
            'connections': audit['edges'],
            'inputs': None,
            'outputs': None,
            'readoutHz': dict(neural.get('readout_hz', {})),
            'topologyMutable': False,
            'acquiredMemoryInherited': False,
        },
        'lastObservation': {
            'spikes': neural.get('spikes', 0),
            'activeNeurons': neural.get('active_neurons', 0),
            'sensoryDrive': dict(neural.get('sensory_drive', {})),
        },
    }
