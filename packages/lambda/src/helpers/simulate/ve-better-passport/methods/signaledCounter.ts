import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import localConfig from "@repo/config/local"

import { ThorClient } from "@vechain/sdk-network"
import { ABIContract } from "@vechain/sdk-core"

/**
 * Retrieves the signaled counter of the VeBetterPassport contract.
 * @returns The signaled counter of the contract.
 */
export const signaledCounter = async (thor: ThorClient, userAddress: string) => {
  const res = await thor.contracts.executeCall(
    localConfig.veBetterPassportContractAddress,
    ABIContract.ofAbi(VeBetterPassport__factory.abi).getFunction("signaledCounter"),
    [userAddress],
  )

  if (!res.success) {
    throw new Error(res.result.errorMessage)
  }

  return res.result.array?.[0]
}
