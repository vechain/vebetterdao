import { FunctionFragment } from "ethers"

import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts"
import localConfig from "@repo/config/local"

import { ThorClient } from "@vechain/sdk-network"

/**
 * Retrieves the signaled counter of the VeBetterPassport contract.
 * @returns The signaled counter of the contract.
 */
export const signaledCounter = async (thor: ThorClient, userAddress: string) => {
  const getSignaledCounter = await thor.contracts.executeContractCall(
    localConfig.veBetterPassportContractAddress,
    VeBetterPassport__factory.createInterface().getFunction("signaledCounter") as FunctionFragment,
    [userAddress],
  )

  return getSignaledCounter[0]
}
