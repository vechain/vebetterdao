import Vot3ContractJson from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import B3trContractJson from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import GovernorContractJson from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import TimelockContractJson from "@repo/contracts/artifacts/contracts/governance/Timelock.sol/Timelock.json"
import XAllocationPoolJson from "@repo/contracts/artifacts/contracts/XAllocationPool.sol/XAllocationPool.json"
import XAllocationVotingJson from "@repo/contracts/artifacts/contracts/XAllocationVoting.sol/XAllocationVoting.json"
import { getConfig } from "@repo/config"

const config = getConfig()

export type ExecutorAvailableContracts = {
  abi: typeof B3trContractJson | typeof Vot3ContractJson | typeof GovernorContractJson | typeof TimelockContractJson
  address: string
}

export const governanceAvailableContracts: ExecutorAvailableContracts[] = [
  { abi: B3trContractJson, address: config.b3trContractAddress },
  { abi: Vot3ContractJson, address: config.vot3ContractAddress },
  { abi: GovernorContractJson, address: config.governorContractAddress },
  { abi: TimelockContractJson, address: config.timelockContractAddress },
  { abi: XAllocationPoolJson, address: config.xAllocationPoolContractAddress },
  { abi: XAllocationVotingJson, address: config.xAllocationVotingContractAddress },
]
