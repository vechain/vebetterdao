import DB, { Entities } from "@/database"
import soloStaging from "../../../packages/config/solo-staging"
import solo from "../../../packages/config/local"
import {
  b3trContract,
  Contract,
  emissionsContract,
  governorContract,
  nftBadgeContract,
  timeLockContract,
  vot3Contract,
  voterRewardsContract,
  xAllocationPoolContract,
  xAllocationVotingContract,
} from "@/b3tr/contracts"

const importContract = async (contract: Contract, address: string, network: typeof soloStaging) => {
  await DB.contracts.clear()

  const entity: Entities.Contract = {
    abi: contract.abi,
    address: address,
    name: contract.name,
    createdTime: Date.now(),
    network: network.network.genesis.id,
  }

  await DB.contracts.add(entity)
}

const insertForNetwork = async (network: typeof soloStaging) => {
  await importContract(b3trContract, network.b3trContractAddress, network)
  await importContract(vot3Contract, network.vot3ContractAddress, network)
  await importContract(governorContract, network.b3trGovernorAddress, network)
  await importContract(timeLockContract, network.timelockContractAddress, network)
  await importContract(xAllocationPoolContract, network.xAllocationPoolContractAddress, network)
  await importContract(xAllocationVotingContract, network.xAllocationVotingContractAddress, network)
  await importContract(emissionsContract, network.emissionsContractAddress, network)
  await importContract(voterRewardsContract, network.voterRewardsContractAddress, network)
  await importContract(nftBadgeContract, network.nftBadgeContractAddress, network)
}

export const insertB3trContracts = async () => {
  if (window.location.hostname === "localhost") {
    await insertForNetwork(solo)
  } else {
    await insertForNetwork(soloStaging)
  }
}

