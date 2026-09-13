"""Bounded whole-connectome food-approach assay with generated evidence."""
import hashlib
import json
import math

from arena import Arena, ROOT

STEPS = 80
TARGET = (180., 180.)

world = Arena(founders=1, capacity=2)
fly = world.flies[0]
fly['x'], fly['y'], fly['heading'] = 120., 180., 0.
world.food = [{'x': TARGET[0], 'y': TARGET[1], 'amount': 5.}]

def distance():
    return math.hypot(fly['x'] - TARGET[0], fly['y'] - TARGET[1])

start_distance = distance()
minimum_distance = start_distance
moving_steps = 0
total_spikes = 0
food_eaten = 0.
for _ in range(STEPS):
    before = world.food[0]['amount']
    world.step()
    minimum_distance = min(minimum_distance, distance())
    moving_steps += fly['neural']['speed'] > 0
    total_spikes += fly['neural']['spikes']
    food_eaten += max(0., before - world.food[0]['amount'])

if moving_steps == 0 or minimum_distance >= start_distance:
    raise AssertionError('Full-connectome output did not approach the target')

source = ROOT / 'connectome/arena.py'
result = {
    'model': world.state()['model'],
    'steps': STEPS,
    'simulated_seconds': STEPS * .1,
    'start_distance': start_distance,
    'final_distance': distance(),
    'minimum_distance': minimum_distance,
    'moving_steps': moving_steps,
    'food_eaten': food_eaten,
    'total_spikes': total_spikes,
    'last_action': fly['neural'],
    'arena_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'interpretation': (
        'A single deterministic calibration run approached the target using '
        'LC9-to-DNp09 activity. It does not establish biological validity, '
        'learning, robust navigation, feeding success, or reproduction.'
    ),
}
target = ROOT / 'evidence/malecns-behavior-assay.json'
target.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
print(json.dumps(result, indent=2, allow_nan=False))
