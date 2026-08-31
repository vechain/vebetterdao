import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import localConfig from "@repo/config/local"

import { ThorClient } from "@vechain/sdk-network"
import { ABIContract } from "@vechain/sdk-core"

/**
 * Retrieves the version of the VeBetterPassport contract.
 * @returns The version of the contract.
 */
export const version = async (thor: ThorClient) => {
  const res = await thor.contracts.executeCall(
    localConfig.veBetterPassportContractAddress,
    ABIContract.ofAbi(VeBetterPassport__factory.abi).getFunction("version"),
    [],
  )

  if (!res.success) {
    throw new Error(res.result.errorMessage)
  }

  return res.result.array?.[0]
}
