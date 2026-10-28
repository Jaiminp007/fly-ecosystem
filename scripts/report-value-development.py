"""Read-only result/ledger summary, written exclusively after both audits pass."""
import hashlib
import json
import sys
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def summarize(directory, phase):
    p = json.loads((directory/'protocol.json').read_text(encoding='utf8'))
    assert p['experiment']=='fixed-contact-value-development-v1' and phase in ('development','confirmation')
    folder = directory/phase
    result_path = folder/'results.json'
    result = json.loads(result_path.read_text(encoding='utf8'))
    protocol_hash, result_hash = sha(directory/'protocol.json'), sha(result_path)
    audits = {}
    for name in ['physical-audit.json', 'numeric-audit.json']:
        a = json.loads((folder/name).read_text(encoding='utf8'))
        assert a['passed'] is True and a['protocolSha256'] == protocol_hash and a['resultsSha256'] == result_hash
        audits[name] = dict(sha256=sha(folder/name), supplemental=a.get('supplemental', False), runtimeTotals=a['runtimeTotals'])
    rows = [json.loads((folder/'rows'/f"{h['seed']}.json").read_text(encoding='utf8')) for h in p[phase+'Histories']]
    for index, row in enumerate(rows):
        assert row['protocolSha256'] == protocol_hash
        assert sha(folder/'rows'/f"{row['history']['seed']}.json") == result['rowSha256'][index]
    n = len(rows)
    founders = n*p['reference']['founders']
    return dict(schema=1, phase=phase, protocolSha256=protocol_hash, resultsSha256=result_hash,
        disposition='failed-development-reserve-closed' if phase == 'development' and not result['promising'] else 'qualified-fixed-learner-only' if result['qualified'] else 'not-qualified',
        qualified=result['qualified'], promising=result['promising'], histories=n,
        mainWorlds=n*len(p['arms']),nominalProbeAndShamSlots=n*(len(p['probes'])+1),
        constructedProbeWorlds=sum('endpoint' in v for row in rows for v in row['probes']+[row['sham']]),
        nonemptyProbeExecutions=sum(not v['skippedAllDead'] for row in rows for v in row['probes']+[row['sham']]),
        comparisonsPassed=sum(c['developmentPass' if phase == 'development' else 'confirmationPass'] for c in result['comparisons']),
        comparisons=len(result['comparisons']), survivalPassed=sum(c['passed'] for c in result['survival']),
        survivalGuards=len(result['survival']), activityPassed=sum(c['passed'] for c in result['activity']),
        nonemptySupportPassed=sum(v['passed'] for v in result['support']),
        candidateMeanEnergy=sum(row['arms']['candidate']['endpoint']['budgetAdjustedEnergyPerFounder'] for row in rows)/n,
        candidateSurvivors=[row['arms']['candidate']['endpoint']['survivors'] for row in rows],
        candidateMeanSurvival=sum(row['arms']['candidate']['endpoint']['survivors'] for row in rows)/founders,
        skippedProbes=sum(v['skippedAllDead'] for row in rows for v in row['probes']+[row['sham']]),
        compressedTraceBytes=sum(row['compressedBytes'] for row in rows),
        uncompressedTraceBytes=sum(row['uncompressedBytes'] for row in rows),
        actualCollectionWorldSteps=sum(sum(v['endpoint']['tick'] for v in row['arms'].values())+
            sum(max(0,v.get('endpoint',{}).get('tick',1536)-1536) for v in row['probes']+[row['sham']]) for row in rows),
        runtimeTotals=result['runtimeTotals'], policyScalarOperations=result['policyScalarOperations'],
        reserveDirectoryExists=(directory/'confirmation').exists(), audits=audits,
        boundary='No RSI, no scientific success from audits, no retained-skill claim without initial acquired skill, no sample extension or opening a failed reserve.')


if __name__ == '__main__':
    directory, phase, output = Path(sys.argv[1]).resolve(), sys.argv[2], Path(sys.argv[3])
    result = summarize(directory, phase)
    with output.open('x', encoding='utf8') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print(json.dumps(result))
