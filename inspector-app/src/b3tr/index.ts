import DB, { Entities } from "@/database"
import soloStaging from "../../../packages/config/solo-staging"
import solo from "../../../packages/config/local"
import { b3trContract, vot3Contract } from "@/b3tr/contracts"

const importContract = async (abi: object, name: string, address: string, network: typeof soloStaging) => {
  const existingContracts = await DB.contracts
    .filter((c) => c.address === address)
    .toArray()

  if (existingContracts.length > 0) {
    return
  }

  const contract: Entities.Contract = {
    abi: abi,
    address: address,
    name: name,
    createdTime: Date.now(),
    network: network.network.genesis.id,
  }

  await DB.contracts.add(contract)
}

const networks = [solo, soloStaging]

const insertForNetwork = async (network: typeof soloStaging) => {
  await importContract(b3trContract.abi, b3trContract.name, network.b3trContractAddress, network)
  await importContract(vot3Contract.abi, vot3Contract.name, network.vot3ContractAddress, network)
}

export const insertB3trContracts = async () => {
  if (window.location.hostname === "localhost") {
    await insertForNetwork(solo)
  } else {
    await insertForNetwork(soloStaging)
  }
}

