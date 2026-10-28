"""Portable incremental development checkpoint; no repeated simulation/audit."""
import gzip
import json
import runpy
import tarfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT/'handoff/taste-continuation-20261025'
common = runpy.run_path(str(ROOT/'scripts/research-evidence.py'))
sha = common['sha']
start, cpu = time.monotonic(), time.process_time()
assert json.loads((ROOT/'evidence/taste-continuation/20261025-v1/summary.json').read_text())['passed']
files = set()
for directory in ['evidence/taste-continuation/20261025-v1',
                  'evidence/taste-development/attempt-05-orthogonal',
                  'evidence/taste-development/attempt-06-appetite',
                  'evidence/taste-development/attempt-07-intake']:
    files.update(p for p in (ROOT/directory).rglob('*') if p.is_file())
for name in ['docs/TASTE_RETENTION_TRANSFER.md', 'docs/TASTE_DEVELOPMENT_PROGRESS.md',
             'docs/DEVELOPMENT_WORKFLOW.md', 'docs/RESEARCH_GOAL.md', 'docs/PROGRESS.md', 'HANDOFF.md',
             'learning/taste-energy.mjs', 'learning/taste-experiment.mjs', 'scripts/taste-development.mjs',
             'scripts/summarize-taste-continuation.py', 'scripts/package-taste-continuation.py',
             'scripts/audit-taste-energy.py', 'tests/taste-energy.test.mjs', 'tests/taste-experiment.test.mjs',
             'handoff/taste-development-20261025/manifest.json',
             '.taste-development-attempt-05-orthogonal.log', '.taste-development-attempt-06-appetite.log',
             '.taste-development-attempt-07-intake.log']:
    files.add(ROOT/name)
files = sorted(files)
assert all(p.is_file() and p.resolve().is_relative_to(ROOT.resolve()) for p in files)
OUTPUT.mkdir(exist_ok=False)
archives = OUTPUT/'archives'
archives.mkdir()
records = [dict(path=p.relative_to(ROOT).as_posix(), bytes=p.stat().st_size, sha256=sha(p)) for p in files]
writer = common['ChunkWriter'](archives)
try:
    with gzip.GzipFile(filename='', mode='wb', compresslevel=6, fileobj=writer, mtime=0) as gz:
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
    previousCheckpoint=dict(path='handoff/taste-development-20261025/manifest.json', sha256=sha(ROOT/'handoff/taste-development-20261025/manifest.json'), chunksIncluded=False),
    scope='Incremental exploratory continuation: all three new attempts, executed source snapshots, rows, results, logs and brief readback. Prior checkpoint chunks remain in their existing archive. No held-out qualification, functional-pressure or RSI result. No old evidence is replaced.')
with (OUTPUT/'manifest.json').open('x', encoding='utf-8') as stream:
    json.dump(manifest, stream, indent=2)
    stream.write('\n')
common['verify'](manifest, ROOT)
print(json.dumps(dict(manifest=str(OUTPUT/'manifest.json'), sha256=sha(OUTPUT/'manifest.json'), files=len(records), chunks=len(chunks), compressedBytes=manifest['compressedBytes'], packingRuntime=manifest['packingRuntime'])))
