"""Package/restore a new SARSA study without changing the original handoff.

Uses the existing standard-library checked archive format. Paths in the new
manifest are repository-relative; the original evidence manifest/chunks remain
unchanged. Every new output is exclusive.
"""
import gzip
import json
from pathlib import Path
import runpy
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]
common = runpy.run_path(str(ROOT / 'scripts/research-evidence.py'))


def build(study, output):
    study, output = study.resolve(), output.resolve()
    assert ROOT in study.parents and ROOT in output.parents
    output.mkdir(parents=True, exist_ok=False)
    archives = output / 'archives'
    archives.mkdir()
    files = sorted(p for p in study.rglob('*') if p.is_file())
    files += sorted(p for p in (ROOT / 'runs').glob('resume-*.log') if p.is_file())
    files += sorted(p for p in (ROOT / 'runs').glob('sarsa-screen-*.log') if p.is_file())
    prior_numeric = ROOT / 'runs/resumed-intervention-numeric-audit.json'
    if prior_numeric.exists():
        files.append(prior_numeric)
    records = [{'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size, 'sha256': common['sha'](p)} for p in files]
    writer = common['ChunkWriter'](archives)
    try:
        with gzip.GzipFile(filename='', mode='wb', compresslevel=6, fileobj=writer, mtime=0) as gz:
            with tarfile.open(fileobj=gz, mode='w|') as tar:
                for p in files:
                    tar.add(p, arcname=p.relative_to(ROOT).as_posix(), recursive=False)
    finally:
        writer.finish()
    chunks = [{'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size, 'sha256': common['sha'](p)} for p in writer.parts]
    manifest = {'schema': 1, 'format': 'ordered split gzip-compressed tar', 'files': records, 'chunks': chunks,
                'uncompressedBytes': sum(r['bytes'] for r in records), 'compressedBytes': sum(r['bytes'] for r in chunks),
                'scope': 'Complete new fixed Expected SARSA screen, including protocol, frozen sources, seed exclusion inputs, factual traces, results, audits and actual continuation/test logs. Original handoff archives remain unchanged.'}
    with (output / 'manifest.json').open('x', encoding='utf8', newline='\n') as f:
        json.dump(manifest, f, indent=2)
        f.write('\n')
    print(json.dumps({'manifest': str(output / 'manifest.json'), 'files': len(files), 'chunks': len(chunks),
                      'uncompressedBytes': manifest['uncompressedBytes'], 'compressedBytes': manifest['compressedBytes']}))


if __name__ == '__main__':
    command, source, *rest = sys.argv[1:]
    if command == 'build':
        build(Path(source), Path(rest[0]))
    else:
        assert command in ['restore', 'verify']
        manifest = json.loads(Path(source).read_text(encoding='utf8'))
        destination = Path(rest[0]).resolve() if rest else ROOT
        for r in manifest['chunks']:
            assert common['sha'](ROOT / r['path']) == r['sha256']
        common[command](manifest, destination)
