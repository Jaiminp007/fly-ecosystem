"""Capture the current read-only observer response as provenance-bearing evidence."""
import hashlib
import json
import urllib.request

from arena import MODEL, ROOT

with urllib.request.urlopen('http://127.0.0.1:8766/api/state', timeout=5) as response:
    state = json.load(response)
if state['model'] != MODEL or state['error']:
    raise RuntimeError('Observer is not a healthy current MaleCNS run')

state['capture'] = {
    'endpoint': 'http://127.0.0.1:8766/api/state',
    'arena_sha256': hashlib.sha256((ROOT / 'connectome/arena.py').read_bytes()).hexdigest(),
    'server_sha256': hashlib.sha256((ROOT / 'connectome/server.py').read_bytes()).hexdigest(),
    'interpretation': (
        'Point-in-time state from the local process. A birth in this file is '
        'evidence for this run, not proof of a self-sustaining population.'
    ),
}
target = ROOT / 'evidence/malecns-live-state.json'
target.write_text(json.dumps(state, indent=2, allow_nan=False) + '\n')
print(json.dumps({
    'model': state['model'], 'tick': state['tick'], 'population': state['population'],
    'births': state['births'], 'deaths': state['deaths'], 'error': state['error'],
    'captured': str(target),
}, indent=2))
