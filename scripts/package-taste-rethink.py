"""Incremental portable research checkpoint; no simulations or full replay."""
import gzip
import json
import runpy
import tarfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT/'handoff/taste-rethink-20261025'
common = runpy.run_path(str(ROOT/'scripts/research-evidence.py'))
sha = common['sha']
start, cpu = time.monotonic(), time.process_time()
files = set()
directories = [ROOT/'evidence/taste-development/diagnostic-greedy-08']
directories += [p for p in (ROOT/'evidence/taste-development').glob('attempt-*')
                if 8 <= int(p.name.split('-')[1]) <= 16]
directories += [ROOT/'evidence'/name/'20261025-v1' for name in
                ['taste-rethink', 'taste-headroom', 'stall-transfer', 'speed-transfer', 'steering-transfer']]
for directory in directories:
    assert directory.is_dir(), directory
    files.update(p for p in directory.rglob('*') if p.is_file())
assert (ROOT/'evidence/taste-rethink/20261025-v1/astra-dialogue.json').is_file()
for name in ['HANDOFF.md', 'docs/HANDOFF_FILE_INDEX.md', 'docs/PROGRESS.md', 'docs/RESEARCH_GOAL.md',
             'docs/ASTRA_RETHINK_20261025.md', 'docs/TASTE_ENERGY_BALANCE.md',
             'docs/TASTE_HEADROOM_DESIGN.md', 'docs/STALL_TRANSFER_DESIGN.md',
             'docs/SPEED_TRANSFER_DESIGN.md', 'docs/STEERING_TRANSFER_DESIGN.md',
             'scripts/package-taste-rethink.py', 'scripts/check-taste-development.py',
             'scripts/describe-stall-transfer.py', 'scripts/diagnose-progress-credit.mjs',
             'scripts/taste-progress.mjs', 'scripts/greedy-taste-probes.mjs',
             'tests/taste-energy.test.mjs', 'tests/taste-experiment.test.mjs']:
    files.add(ROOT/name)
# Preserve current development code as well as the immutable executed snapshots.
for directory in directories:
    protocol = directory/'protocol.json'
    if protocol.is_file():
        data = json.loads(protocol.read_text(encoding='utf8'))
        for name in data.get('sourceSha256', {}):
            files.add(ROOT/name)
for path in ROOT.glob('.*.log'):
    if path.name.startswith(('.taste-development-attempt-', '.taste-development-diagnostic-',
                             '.taste-progress-credit-', '.taste-headroom-', '.stall-transfer-',
                             '.speed-transfer-', '.steering-transfer-')):
        files.add(path)
parents = ['handoff/taste-development-20261025/manifest.json',
           'handoff/taste-continuation-20261025/manifest.json']
files.update(ROOT/name for name in parents)
files = sorted(files)
assert all(p.is_file() and p.resolve().is_relative_to(ROOT.resolve()) for p in files)
OUTPUT.mkdir(exist_ok=False)
archives = OUTPUT/'archives'
archives.mkdir()
records = [dict(path=p.relative_to(ROOT).as_posix(), bytes=p.stat().st_size, sha256=sha(p)) for p in files]
writer = common['ChunkWriter'](archives)
try:
    with gzip.GzipFile(filename='', mode='wb', compresslevel=3, fileobj=writer, mtime=0) as gz:
        with tarfile.open(fileobj=gz, mode='w|') as tar:
            for path, record in zip(files, records):
                info = tar.gettarinfo(str(path), arcname=record['path'])
                info.uid = info.gid = info.mtime = 0
                info.uname = info.gname = ''
                with path.open('rb') as stream:
                    tar.addfile(info, stream)
finally:
    writer.finish()
chunks = [dict(path=p.relative_to(ROOT).as_posix(), bytes=p.stat().st_size, sha256=sha(p)) for p in writer.parts]
manifest = dict(schema=1, format='ordered split gzip-compressed tar', files=records, chunks=chunks,
    uncompressedBytes=sum(r['bytes'] for r in records), compressedBytes=sum(c['bytes'] for c in chunks),
    packingRuntime=dict(wallSeconds=time.monotonic()-start, cpuSeconds=time.process_time()-cpu),
    previousCheckpoints=[dict(path=name, sha256=sha(ROOT/name), chunksIncluded=False) for name in parents],
    scope='Exploratory attempts08--16, all executed source snapshots, anchors, diagnostic-greedy08, credit diagnosis, bounded timing, stall/escape, adaptive speed and full-angle steering, Astra dialogue, brief readbacks and current development code. Failed outcomes preserved. No fresh qualification or RSI. Parent archive chunks stay in their existing locations. Hash verification only; no full archive restore or repeated simulation.')
with (OUTPUT/'manifest.json').open('x', encoding='utf8') as stream:
    json.dump(manifest, stream, indent=2)
    stream.write('\n')
common['verify'](manifest, ROOT)
print(json.dumps(dict(manifest=str(OUTPUT/'manifest.json'), sha256=sha(OUTPUT/'manifest.json'), files=len(records), chunks=len(chunks), compressedBytes=manifest['compressedBytes'], packingRuntime=manifest['packingRuntime'])))
