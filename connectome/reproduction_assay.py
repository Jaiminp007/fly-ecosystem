"""Bounded technical assay for full-connectome offspring construction."""
import hashlib
import json
import numpy as np

from arena import Arena, MATING_ENERGY, ROOT

world = Arena(founders=2, capacity=3)
for fly in world.flies:
    fly['x'], fly['y'] = 180., 180.
    fly['age'] = 30.
    fly['energy'] = MATING_ENERGY + 1.
world.step()

if world.births != 1 or len(world.flies) != 3:
    raise AssertionError('Eligible full-connectome pair did not produce one offspring')
child = world.flies[-1]
first = world.controllers[world.flies[0]['id']].brain
brain = world.controllers[child['id']].brain
if not np.array_equal(first.ids, brain.ids) or not np.array_equal(first.post, brain.post):
    raise AssertionError('Offspring did not retain the MaleCNS graph topology')
if np.shares_memory(first.v, brain.v) or np.shares_memory(first.weight, brain.weight):
    raise AssertionError('Offspring neural state is not independent')

result = {
    'model': world.state()['model'],
    'births': world.births,
    'population': len(world.flies),
    'child_id': child['id'],
    'parents': child['parents'],
    'generation': child['generation'],
    'neurons': brain.n,
    'edges': len(brain.post),
    'independent_neural_state': True,
    'full_topology_equal': True,
    'inherited_alleles': child['alleles'],
    'arena_sha256': hashlib.sha256((ROOT / 'connectome/arena.py').read_bytes()).hexdigest(),
    'assay_setup': (
        'Parents were deliberately placed together at maturity with qualifying '
        'energy. This proves the construction path, not spontaneous reproduction '
        'or self-sustaining population growth.'
    ),
}
target = ROOT / 'evidence/malecns-reproduction-assay.json'
target.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
print(json.dumps(result, indent=2, allow_nan=False))
