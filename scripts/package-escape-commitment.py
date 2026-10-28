"""Self-contained split archive with streamed content verification; no simulation."""
import gzip
import hashlib
import json
import runpy
import tarfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'evidence/escape-commitment/20261025-v1'
OUTPUT = ROOT / 'handoff/escape-commitment-20261025'
common = runpy.run_path(str(ROOT / 'scripts/research-evidence.py'))
sha = common['sha']
start = time.monotonic()
protocol = json.loads((BASE / 'protocol.json').read_text(encoding='utf8'))
files = set(path for path in BASE.rglob('*') if path.is_file())
files.update(ROOT / source['anchor'] for source in protocol['inputs'])
files.add(ROOT / 'evidence/taste-development/attempt-15-progress/protocol.json')
for name in ['HANDOFF.md', 'docs/PROGRESS.md', 'docs/RESEARCH_GOAL.md',
             'docs/HANDOFF_FILE_INDEX.md', 'docs/ASTRA_RETHINK_20261025.md',
             'docs/ESCAPE_COMMITMENT_RESULTS.md', 'docs/ESCAPE_COMMITMENT_DESIGN.md',
             'scripts/check-escape-commitment.py', 'scripts/package-escape-commitment.py',
             'scripts/research-evidence.py', '.escape-commitment-20261025-v1.log']:
    files.add(ROOT / name)
files = sorted(files)
assert all(path.is_file() and path.resolve().is_relative_to(ROOT.resolve()) for path in files)
OUTPUT.mkdir(exist_ok=False)
archives = OUTPUT / 'archives'
archives.mkdir()
records = [dict(path=path.relative_to(ROOT).as_posix(), bytes=path.stat().st_size, sha256=sha(path)) for path in files]
writer = common['ChunkWriter'](archives)
try:
    with gzip.GzipFile(filename='', mode='wb', compresslevel=3, fileobj=writer, mtime=0) as compressed:
        with tarfile.open(fileobj=compressed, mode='w|') as archive:
            for path, record in zip(files, records):
                info = archive.gettarinfo(str(path), arcname=record['path'])
                info.uid = info.gid = info.mtime = 0
                info.uname = info.gname = ''
                with path.open('rb') as stream:
                    archive.addfile(info, stream)
finally:
    writer.finish()
chunks = [dict(path=path.relative_to(ROOT).as_posix(), bytes=path.stat().st_size, sha256=sha(path)) for path in writer.parts]
manifest = dict(schema=1, format='ordered split gzip-compressed tar', files=records, chunks=chunks,
                uncompressedBytes=sum(record['bytes'] for record in records), compressedBytes=sum(chunk['bytes'] for chunk in chunks),
                scope='Failed fixed escape commitment, all raw traces/checkpoints/captured sources and input anchors. No previous-bank modification, fresh qualification or RSI.')
common['verify'](manifest, ROOT)
expected = {record['path']: record for record in records}
seen = set()
with common['ChunkReader']([ROOT / chunk['path'] for chunk in chunks]) as stream:
    with gzip.GzipFile(fileobj=stream, mode='rb') as compressed:
        with tarfile.open(fileobj=compressed, mode='r|') as archive:
            for member in archive:
                assert member.isfile() and member.name in expected and member.name not in seen
                seen.add(member.name)
                record = expected[member.name]
                assert member.size == record['bytes']
                hashed = hashlib.sha256()
                with archive.extractfile(member) as source:
                    for block in iter(lambda: source.read(1024 * 1024), b''):
                        hashed.update(block)
                assert hashed.hexdigest() == record['sha256']
assert seen == set(expected)
manifest['streamedArchiveContentVerified'] = len(seen)
manifest['wallSeconds'] = time.monotonic() - start
with (OUTPUT / 'manifest.json').open('x', encoding='utf8') as stream:
    json.dump(manifest, stream, indent=2)
    stream.write('\n')
print(json.dumps(dict(files=len(records), chunks=len(chunks), compressedBytes=manifest['compressedBytes'], verified=len(seen), wallSeconds=manifest['wallSeconds'])))
