"""Preserve the two fixed local investigations and all replay inputs."""
import gzip
import hashlib
import json
import runpy
import tarfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'handoff/pursuit-social-20261025'
common = runpy.run_path(str(ROOT / 'scripts/research-evidence.py'))
sha = common['sha']
start = time.monotonic()
files = set()
for name in ['pursuit-census', 'social-yield']:
    files.update(path for path in (ROOT / 'evidence' / name / '20261025-v1').rglob('*') if path.is_file())
original = ROOT / 'evidence/taste-development/attempt-15-progress'
attempt = json.loads((original / 'attempt.json').read_bytes())
census = json.loads((ROOT / 'evidence/pursuit-census/20261025-v1/protocol.json').read_bytes())
files.update(original / name for name in ['attempt.json', 'protocol.json'])
files.update(original / 'sources' / name for name in attempt['sourceSha256'])
for source in census['inputs']:
    seed = str(source['history']['seed'])
    files.add(original / 'anchors' / (seed + '-C.json'))
    files.add(original / 'rows' / (seed + '.json'))
    files.add(ROOT / 'evidence/escape-commitment/20261025-v1/rows' / (seed + '.json'))
for name in ['HANDOFF.md', 'docs/PROGRESS.md', 'docs/RESEARCH_GOAL.md', 'docs/HANDOFF_FILE_INDEX.md',
             'docs/PURSUIT_CENSUS_DESIGN.md', 'docs/SOCIAL_YIELD_DESIGN.md', 'docs/PURSUIT_SOCIAL_RESULTS.md',
             'learning/pursuit-census.mjs', 'learning/social-yield.mjs', 'scripts/pursuit-census.mjs', 'scripts/social-yield.mjs',
             'tests/pursuit-census.test.mjs', 'tests/social-yield.test.mjs', 'scripts/check-pursuit-social.py',
             'scripts/package-pursuit-social.py', 'scripts/research-evidence.py',
             '.pursuit-census-20261025-v1.log', '.social-yield-20261025-v1.log', '.pursuit-social-readback-20261025.log']:
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
                scope='Exact factual pursuit census and failed fixed social-yield information test. All raw tapes/episodes/models, captured sources, independent evaluation and original replay inputs. No new control gain, qualification or RSI.')
common['verify'](manifest, ROOT)
expected, seen = {record['path']: record for record in records}, set()
with common['ChunkReader']([ROOT / chunk['path'] for chunk in chunks]) as stream:
    with gzip.GzipFile(fileobj=stream, mode='rb') as compressed:
        with tarfile.open(fileobj=compressed, mode='r|') as archive:
            for member in archive:
                assert member.isfile() and member.name in expected and member.name not in seen
                seen.add(member.name)
                assert member.size == expected[member.name]['bytes']
                hashed = hashlib.sha256()
                with archive.extractfile(member) as source:
                    for block in iter(lambda: source.read(1024 * 1024), b''):
                        hashed.update(block)
                assert hashed.hexdigest() == expected[member.name]['sha256']
assert seen == set(expected)
manifest['streamedArchiveContentVerified'] = len(seen)
manifest['wallSeconds'] = time.monotonic() - start
with (OUTPUT / 'manifest.json').open('x', encoding='utf8') as stream:
    json.dump(manifest, stream, indent=2)
    stream.write('\n')
print(json.dumps(dict(files=len(records), chunks=len(chunks), compressedBytes=manifest['compressedBytes'], verified=len(seen), wallSeconds=manifest['wallSeconds'])))
