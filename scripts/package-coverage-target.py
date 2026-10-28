import gzip
import hashlib
import json
import runpy
import tarfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'handoff/coverage-target-20261026'
common = runpy.run_path(str(ROOT / 'scripts/research-evidence.py'))
start = time.monotonic()
files = set()
for name in ['alternative-target', 'coverage-development']:
    files.update(path for path in (ROOT / 'evidence' / name / '20261026-v1').rglob('*') if path.is_file())
protocol = json.loads((ROOT / 'evidence/alternative-target/20261026-v1/protocol.json').read_bytes())
for source in protocol['inputs']:
    files.update(ROOT / source[field] for field in ['anchor', 'bare'])
files.add(ROOT / 'evidence/taste-development/attempt-15-progress/protocol.json')
for name in ['HANDOFF.md', 'docs/PROGRESS.md', 'docs/RESEARCH_GOAL.md', 'docs/HANDOFF_FILE_INDEX.md',
             'docs/ALTERNATIVE_TARGET_DESIGN.md', 'docs/FULL_SPEED_ACQUISITION_DESIGN.md', 'docs/COVERAGE_TARGET_RESULTS.md',
             'learning/alternative-target.mjs', 'learning/coverage-sarsa.mjs', 'learning/coverage-taste.mjs', 'learning/coverage-experiment.mjs',
             'scripts/alternative-target.mjs', 'scripts/coverage-development.mjs', 'scripts/check-alternative-target.py', 'scripts/check-coverage-development.py',
             'scripts/package-coverage-target.py', 'scripts/research-evidence.py', 'tests/alternative-target.test.mjs', 'tests/coverage-sarsa.test.mjs', 'tests/coverage-experiment.test.mjs',
             '.alternative-target-20261026-v1.log', '.coverage-development-20261026-v1.log', '.coverage-readback-20261026-v1.log', '.alternative-target-readback-20261026-v1.log']:
    files.add(ROOT / name)
files = sorted(files)
assert all(path.is_file() and path.resolve().is_relative_to(ROOT.resolve()) for path in files)
OUTPUT.mkdir(exist_ok=False)
archives = OUTPUT / 'archives'
archives.mkdir()
records = [dict(path=path.relative_to(ROOT).as_posix(), bytes=path.stat().st_size, sha256=common['sha'](path)) for path in files]
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
chunks = [dict(path=path.relative_to(ROOT).as_posix(), bytes=path.stat().st_size, sha256=common['sha'](path)) for path in writer.parts]
manifest = dict(schema=1, format='ordered split gzip-compressed tar', files=records, chunks=chunks,
                uncompressedBytes=sum(record['bytes'] for record in records), compressedBytes=sum(chunk['bytes'] for chunk in chunks),
                scope='Two failed fixed development tests: alternative-target witness and actual three-speed own-experience acquisition. Includes frozen sources, full tapes, own-memory provenance readback and original inputs. Pricing caveat and working-only constant correction disclosed. No qualification or RSI.')
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
