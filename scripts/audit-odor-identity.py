"""Independent exact recorded-code audit; no learner or performance qualification."""
import argparse
from fractions import Fraction
import hashlib
import itertools
import json
from pathlib import Path


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def number(value):
    require(type(value) in (int, float), 'Expected a finite numeric coordinate')
    try:
        return Fraction(value)
    except (ValueError, OverflowError) as error:
        raise ValueError('Expected a finite numeric coordinate') from error


def rank(rows):
    matrix = [list(row) for row in rows]
    pivot_row = 0
    for column in range(16):
        pivot = next((index for index in range(pivot_row, len(matrix)) if matrix[index][column]), None)
        if pivot is None:
            continue
        matrix[pivot_row], matrix[pivot] = matrix[pivot], matrix[pivot_row]
        divisor = matrix[pivot_row][column]
        matrix[pivot_row] = [value / divisor for value in matrix[pivot_row]]
        for index in range(pivot_row + 1, len(matrix)):
            factor = matrix[index][column]
            if factor:
                matrix[index] = [value - factor * basis for value, basis in zip(matrix[index], matrix[pivot_row])]
        pivot_row += 1
        if pivot_row == len(matrix):
            break
    return pivot_row


def audit_codes(record):
    require(isinstance(record, dict), 'Expected a codes object')
    contexts = record.get('contexts')
    require(isinstance(contexts, list) and len(contexts) == 243, 'Expected all 243 prior nuisance contexts')
    neutral = record.get('neutral')
    require(isinstance(neutral, list) and len(neutral) == 16, 'Expected sixteen neutral coordinates')
    require(all(number(value) == 0 for value in neutral), 'Neutral must be zero')
    expected_contexts = set(itertools.product(
        (.1, .5, .9), (0, .5, 1), (-1, 0, 1), ((0, 0), (1, 0), (0, 1)), ('empty', 'neutral', 'fixed-cue')))
    expected_bits = set(itertools.product((-1, 1), repeat=4))
    seen_contexts = set()
    ranks = []
    for context in contexts:
        walls = context.get('walls')
        require(isinstance(walls, list) and len(walls) == 2, 'Invalid walls')
        for value in [context.get('energy'), context.get('proximity'), context.get('previousIntake'), *walls]:
            number(value)
        key = (context['energy'], context['proximity'], context['previousIntake'], tuple(walls), context.get('history'))
        require(key in expected_contexts and key not in seen_contexts, 'Invalid or duplicate nuisance context')
        seen_contexts.add(key)
        patterns = context.get('patterns')
        require(isinstance(patterns, list) and len(patterns) == 16, 'Expected sixteen patterns per context')
        seen_bits = set()
        rows = []
        for pattern in patterns:
            if 'operations' in pattern:
                require(type(pattern['operations']) is int and pattern['operations'] == 21,
                        'Expected six sign-extraction operations and fifteen parity multiplications')
            bits = pattern.get('bits')
            require(isinstance(bits, list) and len(bits) == 4, 'Expected four signed bits')
            signed = tuple(number(value) for value in bits)
            require(signed in expected_bits and signed not in seen_bits, 'Invalid or duplicate odor signs')
            seen_bits.add(signed)
            features = pattern.get('features')
            require(isinstance(features, list) and len(features) == 16, 'Expected sixteen features')
            row = [number(value) for value in features]
            reconstructed = []
            for subset in range(16):
                parity = Fraction(1, 4)
                for index, sign in enumerate(signed):
                    if subset & (1 << index):
                        parity *= sign
                reconstructed.append(parity)
            require(row == reconstructed, 'Recorded features differ from exact Walsh reconstruction')
            require(all(abs(value) == Fraction(1, 4) for value in row), 'All sixteen coordinates must be active')
            rows.append(row)
        require(seen_bits == expected_bits, 'Incomplete odor enumeration')
        for left_index, left in enumerate(rows):
            for right_index, right in enumerate(rows):
                require(sum(value * other for value, other in zip(left, right)) == int(left_index == right_index),
                        'Recorded codes must have identity Gram matrix')
        exact_rank = rank(rows)
        require(exact_rank == 16, 'Expected full rank sixteen')
        ranks.append(exact_rank)
    require(seen_contexts == expected_contexts, 'Incomplete nuisance enumeration')
    return {'schema': 1, 'kind': 'odor-identity-algebra-v1', 'passed': True,
            'contexts': len(contexts), 'featureEvaluations': len(contexts) * 16,
            'minimumRank': min(ranks), 'contextsBelowFullRank': 0,
            'unitNorm': True, 'pairwiseOrthogonal': True, 'sharedSupport': list(range(16)), 'neutralZero': True,
            'scope': 'Prospective fixed representation only; no learner integration, rewards, fitting, performance qualification '
                     'or explanation of past failure. This is an orthogonal rotation of one-hot codes; shared support does not '
                     'prove functional interference or memory pressure. A direct update along B leaves other odor logits '
                     'unchanged absent decay or traces. Actual pressure requires separate diagnosis. '
                     'No learned transfer can come from the zero neutral block alone.'}


def audit(path):
    directory = Path(path).resolve()
    protocol_path = directory / 'protocol.json'
    codes_path = directory / 'codes.json'
    protocol = json.loads(protocol_path.read_text(encoding='utf8'))
    record = json.loads(codes_path.read_text(encoding='utf8'))
    require(protocol.get('kind') == 'odor-identity-algebra-v1', 'Wrong protocol kind')
    require(isinstance(protocol.get('scope'), str) and protocol['scope'].strip(), 'Protocol must declare its scope')
    require(record.get('protocolSha256') == sha(protocol_path), 'Protocol hash mismatch')
    sources = protocol.get('sourceSha256')
    require(isinstance(sources, dict) and sources, 'Expected source hashes')
    source_root = (directory / 'sources').resolve()
    for name, expected in sources.items():
        source = (source_root / name).resolve()
        require(source.is_relative_to(source_root), 'Source path escapes sources directory')
        require(sha(source) == expected, 'Source hash mismatch: ' + name)
    return {**audit_codes(record), 'protocolSha256': sha(protocol_path), 'codesSha256': sha(codes_path),
            'sourceSha256': sources, 'sourceFilesVerified': len(sources)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--output', type=Path, help='Create a new summary file; refuse to overwrite')
    args = parser.parse_args()
    summary = audit(args.directory)
    if args.output is not None:
        with args.output.open('x', encoding='utf8', newline='\n') as stream:
            json.dump(summary, stream, indent=2)
            stream.write('\n')
    print(json.dumps(summary))


if __name__ == '__main__':
    main()
