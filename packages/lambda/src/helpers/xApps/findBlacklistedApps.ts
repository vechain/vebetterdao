import { ThorClient } from "@vechain/sdk-network"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { ABIContract, Address, Clause } from "@vechain/sdk-core"

/**
 * Finds the blacklisted applications from a list of application IDs.
 *
 * @param thor - The ThorClient instance used to interact with the blockchain.
 * @param appIds - An array of app IDs to check for blacklisting.
 * @param contractAddress - The contract address.
 * @returns A promise that resolves to an array of blacklisted application IDs.
 * @throws An error if any contract call reverts.
 */
export const findBlacklistedApps = async (thor: ThorClient, appIds: string[], contractAddress: string) => {
  // Prepare the clauses to check if the xApps are blacklisted
  const clauses = appIds.map(appId =>
    Clause.callFunction(Address.of(contractAddress), ABIContract.ofAbi(X2EarnApps.abi).getFunction("isBlacklisted"), [
      appId,
    ]),
  )
  const res = await thor.transactions.simulateTransaction(clauses)

  // Identify the blacklisted apps
  const blacklistedAppIds: string[] = []
  res.forEach((r, index) => {
    if (r.reverted) {
      throw new Error(
        `Error in contract call to X2EarnApps::isBlacklisted at ${contractAddress}. Clause ${index + 1} for appId ${
          appIds[index]
        } reverted with reason ${r.vmError}`,
      )
    }

    const decoded = X2EarnApps.createInterface().decodeFunctionResult("isBlacklisted", r.data)

    if (decoded[0]) blacklistedAppIds.push(appIds[index])
  })

  return blacklistedAppIds
}
