import { FunctionFragment } from "ethers"

import { VeBetterPassport__factory } from "@repo/contracts"
import localConfig from "@repo/config/local"

import { ThorClient } from "@vechain/sdk-network"

/**
 * Retrieves the version of the VeBetterPassport contract.
 * @returns The version of the contract.
 */
export const version = async (thor: ThorClient) => {
  const getVersion = await thor.contracts.executeContractCall(
    localConfig.veBetterPassportContractAddress,
    VeBetterPassport__factory.createInterface().getFunction("version") as FunctionFragment,
    [],
  )

  return getVersion[0]
}
