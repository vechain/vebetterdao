import mainnetConfig from "@repo/config/mainnet"
import { clauseBuilder } from "@vechain/sdk-core"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 * Builds the check endorsement clauses for the specified xApps and round.
 * @param xappIds - The xApp IDs to build the check endorsement clauses for.
 * @returns an array of check endorsement clauses for the specified xApps.
 */
export const buildCheckEndorsementClauses = (xappIds: string[]) => {
  const clauses = xappIds.map(xappId =>
    clauseBuilder.functionInteraction(
      mainnetConfig.x2EarnAppsContractAddress,
      X2EarnApps.createInterface().getFunction("checkEndorsement"),
      [xappId],
    ),
  )

  return clauses
}

export const chunk = <T>(array: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(array.length / size) }, (_v, i) => array.slice(i * size, i * size + size))
