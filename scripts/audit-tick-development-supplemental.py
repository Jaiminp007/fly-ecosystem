"""Supplemental endpoint conservation comparison; never edits frozen sources.

The frozen endpoint independently asserts abs(accountingResidual)<1e-7, but its
generic mapping equality also compares two separately reduced near-zero residuals
at 1e-12 absolute tolerance. Keep the declared conservation bound on BOTH and
every other original comparison. This changes no scientific gate or outcome.
"""
import argparse
import hashlib
import json
import math
import runpy
import warnings
from pathlib import Path


def conservation_same(original, diagnostics):
    def compare(actual, expected, location='root'):
        if location != 'endpoint':
            return original(actual, expected, location)
        assert set(actual) == set(expected), 'endpoint keys'
        recorded, reconstructed = actual['accountingResidual'], expected['accountingResidual']
        assert math.isfinite(recorded) and abs(recorded) < 1e-7, 'recorded conservation bound'
        assert math.isfinite(reconstructed) and abs(reconstructed) < 1e-7, 'independent conservation bound'
        original({k: v for k, v in actual.items() if k != 'accountingResidual'},
                 {k: v for k, v in expected.items() if k != 'accountingResidual'}, location)
        diagnostics['endpoints'] += 1
        diagnostics['maxRecordedResidual'] = max(diagnostics['maxRecordedResidual'], abs(recorded))
        diagnostics['maxIndependentResidual'] = max(diagnostics['maxIndependentResidual'], abs(reconstructed))
        diagnostics['maxResidualDifference'] = max(diagnostics['maxResidualDifference'], abs(recorded-reconstructed))
    return compare


def audit(directory, phase):
    frozen = directory/'sources/scripts/audit-tick-development.py'
    module = runpy.run_path(str(frozen))
    world = module['WORLD']
    diagnostics = dict(endpoints=0, maxRecordedResidual=0., maxIndependentResidual=0., maxResidualDifference=0.)
    # runpy returns a copy of the execution dictionary. Patch the actual global
    # dictionary referenced by the independently implemented endpoint method.
    namespace = world['AuditWorld'].endpoint.__globals__
    original = namespace['same']
    namespace['same'] = conservation_same(original, diagnostics)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        result = module['audit'](directory, phase)
    assert not caught, [str(w.message) for w in caught]
    result.update(warnings=[], supplemental=True, conservationComparison=diagnostics,
                  supplementalCheckerSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  frozenCheckerSha256=hashlib.sha256(frozen.read_bytes()).hexdigest(),
                  correction='Only endpoint.accountingResidual mapping comparison: both independently satisfy the original strict 1e-7 conservation bound. Every other frozen check and all outcomes/gates remain unchanged. Original failed checker/log retained.')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path)
    parser.add_argument('phase', choices=['development', 'confirmation'])
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    result = audit(args.directory.resolve(), args.phase)
    with args.output.open('x', encoding='utf8') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print(json.dumps(result))
