"""Start/resume a checkpointed, matched learning campaign through the live platform."""
import argparse
import hashlib
import json
import os
import time
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('PLATFORM_BASE_URL', 'http://127.0.0.1:' + os.environ.get('PLATFORM_PORT', '8767')).rstrip('/')
OUTPUT = ROOT / 'runs/training'

def request(path, data=None):
    payload = None if data is None else json.dumps(data).encode()
    headers = {} if data is None else {'Content-Type': 'application/json'}
    req = urllib.request.Request(BASE + path, data=payload, headers=headers)
    with urllib.request.urlopen(req, timeout=180) as response:
        return json.load(response)

def write_json(path, data):
    temporary = path.with_suffix('.partial')
    temporary.write_text(json.dumps(data, indent=2) + '\n')
    temporary.replace(path)

def digest(data):
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

def source_hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
            for name in ['engine.mjs', 'challenges.mjs', 'platform/manager.mjs']}

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--new', action='store_true', help='Create a new campaign instead of resuming the latest one')
parser.add_argument('--output-dir', type=Path, default=OUTPUT, help='Campaign metadata and result directory')
parser.add_argument('--horizon-ticks', type=int, default=7200, help='Simulation ticks for a new campaign (default: one challenge cycle)')
parser.add_argument('--pause-after', action='store_true', help='Leave completed campaign habitats paused')
args = parser.parse_args()
if args.horizon_ticks < 1:
    parser.error('--horizon-ticks must be positive')
OUTPUT = args.output_dir.resolve()
OUTPUT.mkdir(parents=True, exist_ok=True)
assert request('/healthz')['ok'], 'Resolve platform errors before starting training'
latest = OUTPUT / 'latest'
if latest.exists() and not args.new:
    campaign_id = latest.read_text().strip()
    assert str(uuid.UUID(campaign_id)) == campaign_id
    directory = OUTPUT / campaign_id
    manifest = json.loads((directory / 'campaign.json').read_text())
    assert manifest['source_sha256'] == source_hashes(), 'Model source changed; use a new campaign'
else:
    campaign_id = str(uuid.uuid4())
    directory = OUTPUT / campaign_id
    directory.mkdir()
    manifest = {'id': campaign_id, 'source_sha256': source_hashes(),
                'runner_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                'horizon_ticks': args.horizon_ticks, 'sample_interval_ticks': 1000,
                'protocol': f'Three matched seed pairs from fresh founders. Learning is enabled or disabled from birth; mutation and reproduction remain enabled. Requested horizon {args.horizon_ticks} ticks ({args.horizon_ticks / 10:g} artificial seconds), with extinction/capacity recorded as terminal outcomes. The default horizon covers one full challenge cycle. Fixed observations precede any live continuation.',
                'status': 'preparing', 'jobs': []}
    for seed in [7, 23, 111]:
        for learning in [True, False]:
            manifest['jobs'].append({'name': f'Train {campaign_id[:8]} · seed {seed} · {"learning" if learning else "frozen"}',
                'config': {'seed': seed, 'founders': 24, 'capacity': 240, 'learning': learning,
                           'mutation': True, 'nutrient': 3, 'seasonal': True, 'challenges': 'cycle'},
                'id': None, 'samples': [], 'result': None})
    write_json(directory / 'campaign.json', manifest)
    temporary = OUTPUT / 'latest.partial'
    temporary.write_text(campaign_id)
    temporary.replace(latest)

def save():
    write_json(directory / 'campaign.json', manifest)

def control(job, command):
    return request(f'/api/ecosystems/{job["id"]}/control', command)

def observation(state):
    return {'metrics': state['metrics'], 'phase': state['challenge']['name'] if state['challenge'] else None,
            'deepest_ever': state['telemetry']['deepestEver']}

try:
    # Record each successful creation immediately and recover uniquely named orphans.
    existing = request('/api/ecosystems')
    for job in manifest['jobs']:
        if job['id'] is None:
            matches = [item for item in existing if item['name'] == job['name']]
            assert len(matches) <= 1, 'Ambiguous campaign habitat name'
            if matches:
                job['id'] = matches[0]['id']
                state = request(f'/api/ecosystems/{job["id"]}')
            else:
                state = request('/api/ecosystems', {'name': job['name'], 'config': job['config']})
                job['id'] = state['ecosystem']['id']
            checkpoint = request(f'/api/ecosystems/{job["id"]}/checkpoint')
            assert checkpoint['world']['tick'] == 0, 'Fresh campaign must begin at tick zero'
            job['founders_sha256'] = digest(checkpoint['world']['flies'])
            job['initial_rng'] = checkpoint['world']['rng']['state']
            job['samples'].append(observation(state))
            save()
    for seed in [7, 23, 111]:
        pair = [job for job in manifest['jobs'] if job['config']['seed'] == seed]
        assert pair[0]['founders_sha256'] == pair[1]['founders_sha256'], 'Founders are not matched'
        assert pair[0]['initial_rng'] == pair[1]['initial_rng'], 'Initial RNG states are not matched'
    manifest['status'] = 'training'
    save()
    start = time.monotonic()
    for job in manifest['jobs']:
        if job['result'] is not None:
            continue
        state = request(f'/api/ecosystems/{job["id"]}')
        assert all(state['config'][key] == value for key, value in job['config'].items()), 'Campaign configuration was changed'
        control(job, {'action': 'pause'})
        while state['metrics']['tick'] < manifest['horizon_ticks'] and state['metrics']['status'] == 'running':
            remaining = manifest['horizon_ticks'] - state['metrics']['tick']
            state = control(job, {'action': 'step', 'ticks': min(manifest['sample_interval_ticks'], remaining)})
            assert state['ecosystem']['error'] is None
            assert abs(state['metrics']['accountingError']) < 1e-6, 'Energy balance failed'
            job['samples'].append(observation(state))
            save()
            print(job['name'], 'tick', state['metrics']['tick'], 'population', state['metrics']['population'],
                  'births', state['metrics']['births'], 'acquired', round(state['metrics']['learnedMagnitude'], 6), flush=True)
        final = control(job, {'action': 'checkpoint'})
        checkpoint = request(f'/api/ecosystems/{job["id"]}/checkpoint')
        write_json(directory / f'{job["id"]}-horizon.json', checkpoint)
        job['result'] = {**observation(final), 'checkpoint_name': final['savedCheckpoint'],
                         'checkpoint_sha256': digest(checkpoint),
                         'food_eaten': checkpoint['world']['totals']['foodEaten']}
        if not job['config']['learning']:
            assert final['metrics']['learnedMagnitude'] == 0, 'Frozen control weights changed'
        save()
    manifest['fixed_horizon_complete'] = True
    manifest['wall_seconds_this_invocation'] = time.monotonic() - start
    rows = [{**job['config'], 'id': job['id'], **job['result']} for job in manifest['jobs']]
    summary = {'campaign_id': campaign_id, 'source_sha256': manifest['source_sha256'],
               'protocol': manifest['protocol'], 'rows': rows,
               'interpretation': 'Descriptive results from three seed pairs. Acquired weight changes verify the learning mechanism is active; useful learning, human cognition and indefinite survival require further evaluation.'}
    write_json(directory / 'results.json', summary)
    active = []
    for job in manifest['jobs']:
        state = request(f'/api/ecosystems/{job["id"]}')
        if args.pause_after:
            control(job, {'action': 'pause'})
        elif state['metrics']['status'] == 'running' and state['ecosystem']['error'] is None:
            control(job, {'action': 'speed', 'value': 10})
            state = control(job, {'action': 'run'})
            active.append({'id': job['id'], 'name': job['name'], 'tick': state['metrics']['tick']})
    manifest['status'] = 'paused' if args.pause_after else 'live'
    manifest['active'] = active
    save()
    print('Fixed-horizon results:', directory / 'results.json', flush=True)
    print('Live training habitats:', len(active), flush=True)
except BaseException as error:
    manifest['status'] = 'interrupted'
    manifest['error'] = f'{type(error).__name__}: {error}'
    save()
    raise
