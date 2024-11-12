import mainnetConfig from "@repo/config/mainnet"
import { FunctionFragment, clauseBuilder, coder } from "@vechain/sdk-core"
import { XAllocationPool__factory as XAllocationPool } from "@repo/contracts"

/**
 * Builds the claim clauses for the specified xApps and round.
 * @param xappIds - The xApp IDs to build the claim clauses for.
 * @param roundId - The round ID to build the claim clauses for.
 * @returns an array of claim clauses for the specified xApps and round.
 */
export const buildClaimClauses = (xappIds: string[], roundId: string) => {
  const clauses = xappIds.map(xappId =>
    clauseBuilder.functionInteraction(
      mainnetConfig.xAllocationPoolContractAddress,
      XAllocationPool.createInterface().getFunction("claim") as FunctionFragment,
      [roundId, xappId],
    ),
  )

  return clauses
}
