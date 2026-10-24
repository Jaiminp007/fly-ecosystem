#!/usr/bin/env python3
"""Pack/restore the complete evidence handoff with stdlib-only integrity checks."""
import argparse
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'handoff/evidence-manifest.json'
CHUNK_BYTES = 24 * 1024 * 1024

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

class ChunkWriter(io.RawIOBase):
    def __init__(self, directory):
        self.directory = directory
        self.stream = None
        self.size = 0
        self.parts = []
    def writable(self):
        return True
    def write(self, data):
        original = len(data)
        while data:
            if self.stream is None or self.size == CHUNK_BYTES:
                if self.stream:
                    self.stream.close()
                path = self.directory / ('research-evidence.tar.gz.part-%03d' % len(self.parts))
                self.parts.append(path)
                self.stream = path.open('xb')
                self.size = 0
            take = min(len(data), CHUNK_BYTES - self.size)
            self.stream.write(data[:take])
            data = data[take:]
            self.size += take
        return original
    def finish(self):
        if self.stream:
            self.stream.close()

class ChunkReader(io.RawIOBase):
    def __init__(self, paths):
        self.paths = iter(paths)
        self.stream = None
    def readable(self):
        return True
    def read(self, size=-1):
        if size < 0:
            raise ValueError('Unbounded archive reads are disabled')
        blocks = []
        remaining = size
        while remaining:
            if self.stream is None:
                try:
                    self.stream = next(self.paths).open('rb')
                except StopIteration:
                    break
            block = self.stream.read(remaining)
            if block:
                blocks.append(block)
                remaining -= len(block)
            else:
                self.stream.close()
                self.stream = None
        return b''.join(blocks)

def build():
    files = sorted(p for base in [ROOT / 'evidence', ROOT / 'handoff/runtime-snapshot'] for p in base.rglob('*') if p.is_file())
    records = [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': sha(p)} for p in files]
    directory = ROOT / 'handoff/archives'
    directory.mkdir(parents=True, exist_ok=True)
    writer = ChunkWriter(directory)
    try:
        with gzip.GzipFile(filename='', mode='wb', compresslevel=6, fileobj=writer, mtime=0) as gz:
            with tarfile.open(fileobj=gz, mode='w|') as archive:
                for path, record in zip(files, records):
                    info = archive.gettarinfo(str(path), arcname=record['path'])
                    info.uid = info.gid = info.mtime = 0
                    info.uname = info.gname = ''
                    with path.open('rb') as f:
                        archive.addfile(info, f)
    finally:
        writer.finish()
    chunks = [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': sha(p)} for p in writer.parts]
    manifest = {'schema': 1, 'format': 'ordered split gzip-compressed tar', 'uncompressedBytes': sum(r['bytes'] for r in records),
                'compressedBytes': sum(r['bytes'] for r in chunks), 'files': records, 'chunks': chunks,
                'scope': 'All local evidence files, including failed attempts, archived sources and logs, plus read-only paused-habitat exports and autonomy state. No datasets, virtualenvs or model downloads.'}
    INDEX.write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({k: manifest[k] for k in ['format', 'uncompressedBytes', 'compressedBytes']} | {'files': len(records), 'chunks': len(chunks)}))

def safe_path(base, name):
    candidate = (base / name).resolve()
    if base.resolve() not in candidate.parents:
        raise ValueError('Unsafe archive path: ' + name)
    return candidate

def restore(manifest, destination):
    for chunk in manifest['chunks']:
        path = ROOT / chunk['path']
        if path.stat().st_size != chunk['bytes'] or sha(path) != chunk['sha256']:
            raise ValueError('Archive chunk failed integrity check: ' + str(path))
    expected = {r['path']: r for r in manifest['files']}
    seen = set()
    reader = ChunkReader([ROOT / r['path'] for r in manifest['chunks']])
    with gzip.GzipFile(fileobj=reader, mode='rb') as gz:
        with tarfile.open(fileobj=gz, mode='r|') as archive:
            for member in archive:
                if not member.isfile() or member.name not in expected or member.name in seen:
                    raise ValueError('Unexpected archive member: ' + member.name)
                record = expected[member.name]
                if member.size != record['bytes']:
                    raise ValueError('Unexpected member size: ' + member.name)
                target = safe_path(destination, member.name)
                if target.exists() and sha(target) != record['sha256']:
                    raise ValueError('Refusing to replace different existing file: ' + str(target))
                target.parent.mkdir(parents=True, exist_ok=True)
                h = hashlib.sha256()
                with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as output:
                    temporary = Path(output.name)
                    stream = archive.extractfile(member)
                    for block in iter(lambda: stream.read(1024 * 1024), b''):
                        output.write(block)
                        h.update(block)
                if h.hexdigest() != record['sha256']:
                    temporary.unlink()
                    raise ValueError('Evidence content failed integrity check: ' + member.name)
                if target.exists():
                    temporary.unlink()
                else:
                    os.replace(temporary, target)
                    target.chmod(member.mode & 0o777)
                seen.add(member.name)
    if seen != set(expected):
        raise ValueError('Archive did not contain every registered file')
    print(json.dumps({'restoredAndVerifiedFiles': len(seen), 'destination': str(destination)}))

def verify(manifest, destination):
    failures = [r['path'] for r in manifest['files'] if not (destination / r['path']).is_file() or (destination / r['path']).stat().st_size != r['bytes'] or sha(destination / r['path']) != r['sha256']]
    print(json.dumps({'files': len(manifest['files']), 'failedCount': len(failures), 'firstFailures': failures[:20]}))
    if failures:
        raise SystemExit(1)

def install_runtime(destination):
    snapshot = destination / 'handoff/runtime-snapshot'
    count = 0
    for kind in ['platform', 'autonomy']:
        for source in (snapshot / kind).rglob('*'):
            if not source.is_file():
                continue
            target = destination / 'runs' / kind / source.relative_to(snapshot / kind)
            if target.exists() and sha(source) != sha(target):
                raise ValueError('Refusing to replace existing runtime data: ' + str(target))
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                shutil.copyfile(source, target)
            count += 1
    print(json.dumps({'installedPausedRuntimeFiles': count, 'startedProcesses': 0}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['build', 'restore', 'verify'])
    parser.add_argument('--destination', type=Path, default=ROOT)
    parser.add_argument('--runtime', action='store_true', help='Also install saved paused habitats/autonomy state into ignored runs/')
    args = parser.parse_args()
    if args.command == 'build':
        build()
    else:
        manifest = json.loads(INDEX.read_text())
        if args.command == 'restore':
            restore(manifest, args.destination.resolve())
        else:
            verify(manifest, args.destination.resolve())
        if args.runtime:
            install_runtime(args.destination.resolve())
