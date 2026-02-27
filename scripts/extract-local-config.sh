#!/usr/bin/env bash
# Extract contract addresses from packages/config/local.ts and export as env vars.
# Usage: source scripts/extract-local-config.sh

set -euo pipefail

LOCAL_CONFIG="packages/config/local.ts"

if [ ! -f "$LOCAL_CONFIG" ]; then
  echo "ERROR: $LOCAL_CONFIG not found. Deploy contracts first (yarn dev)." >&2
  exit 1
fi

extract() {
  local key="$1"
  node -e "
    const fs = require('fs');
    const src = fs.readFileSync('$LOCAL_CONFIG', 'utf8');
    const m = src.match(/[\"']${key}[\"']\\s*:\\s*[\"'](0x[0-9a-fA-F]+)[\"']/);
    if (m) process.stdout.write(m[1]);
    else { process.stderr.write('WARN: ${key} not found\n'); process.exit(1); }
  "
}

export B3TR_CONTRACT="$(extract b3trContractAddress)"
export VOT3_CONTRACT="$(extract vot3ContractAddress)"
export EMISSIONS_CONTRACT="$(extract emissionsContractAddress)"
export B3TR_GOVERNOR_CONTRACT="$(extract b3trGovernorAddress)"
export B3TR_DBA_POOL_CONTRACT="$(extract dbaPoolContractAddress)"
export GM_NFT_CONTRACT="$(extract galaxyMemberContractAddress)"
export X_ALLOC_VOTING_CONTRACT="$(extract xAllocationVotingContractAddress)"
export X_ALLOC_POOL_CONTRACT="$(extract xAllocationPoolContractAddress)"
export X2EARN_REWARDS_POOL_CONTRACT="$(extract x2EarnRewardsPoolContractAddress)"
export VOTER_REWARDS_CONTRACT="$(extract voterRewardsContractAddress)"
export TREASURY_CONTRACT="$(extract treasuryContractAddress)"

echo "Extracted contract addresses from $LOCAL_CONFIG"
