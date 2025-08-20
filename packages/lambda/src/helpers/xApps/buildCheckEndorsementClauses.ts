import { AppConfig } from "@repo/config"
import { X2EarnApps__factory as X2EarnApps } from "@vechain/vebetterdao-contracts"
import { Clause } from "@vechain/sdk-core"
import { Address } from "@vechain/sdk-core"
import { ABIContract } from "@vechain/sdk-core"

/**
 * Builds the check endorsement clauses for the specified xApps and round.
 * @param xappIds - The xApp IDs to build the check endorsement clauses for.
 * @returns an array of check endorsement clauses for the specified xApps.
 */
export const buildCheckEndorsementClauses = (xappIds: string[], config: AppConfig) => {
  const clauses = xappIds.map(xappId =>
    Clause.callFunction(
      Address.of(config.x2EarnAppsContractAddress),
      ABIContract.ofAbi(X2EarnApps.abi).getFunction("checkEndorsement"),
      [xappId],
    ),
  )

  return clauses
}

export const chunk = <T>(array: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(array.length / size) }, (_v, i) => array.slice(i * size, i * size + size))
