import vot3Artifact from "../../../packages/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import b3trArtifact from "../../../packages/contracts/artifacts/contracts/B3TR.sol/B3TR.json"

type Contract = {
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
