import vot3Artifact from "../../../packages/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import b3trArtifact from "../../../packages/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import governorArtifact from "../../../packages/contracts/artifacts/contracts/governance/B3TRGovernor.sol/B3TRGovernor.json"
import timeLockArtifact from "../../../packages/contracts/artifacts/contracts/governance/TimeLock.sol/TimeLock.json"
import xAllocationPoolArtifact from "../../../packages/contracts/artifacts/contracts/XAllocationPool.sol/XAllocationPool.json"
import xAllocationVotingArtifact from "../../../packages/contracts/artifacts/contracts/XAllocationVoting.sol/XAllocationVoting.json"
import emissionsArtifact from "../../../packages/contracts/artifacts/contracts/Emissions.sol/Emissions.json"
import voterRewardsArtifact from "../../../packages/contracts/artifacts/contracts/VoterRewards.sol/VoterRewards.json"
import nftBadeArtifact from "../../../packages/contracts/artifacts/contracts/B3TRBadge.sol/B3TRBadge.json"

export type Contract = {
  abi: object
  name: string
}

export const vot3Contract: Contract = {
  abi: vot3Artifact.abi,
  name: vot3Artifact.contractName,
}

export const b3trContract: Contract = {
  abi: b3trArtifact.abi,
  name: b3trArtifact.contractName,
}

export const governorContract: Contract = {
  abi: governorArtifact.abi,
  name: governorArtifact.contractName,
}

export const timeLockContract: Contract = {
  abi: timeLockArtifact.abi,
  name: timeLockArtifact.contractName,
}

export const xAllocationPoolContract: Contract = {
  abi: xAllocationPoolArtifact.abi,
  name: xAllocationPoolArtifact.contractName,
}

export const xAllocationVotingContract: Contract = {
  abi: xAllocationVotingArtifact.abi,
  name: xAllocationVotingArtifact.contractName,
}

export const emissionsContract: Contract = {
  abi: emissionsArtifact.abi,
  name: emissionsArtifact.contractName,
}

export const voterRewardsContract: Contract = {
  abi: voterRewardsArtifact.abi,
  name: voterRewardsArtifact.contractName,
}

export const nftBadgeContract: Contract = {
  abi: nftBadeArtifact.abi,
  name: nftBadeArtifact.contractName,
}
