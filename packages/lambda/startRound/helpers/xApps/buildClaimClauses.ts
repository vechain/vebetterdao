import testnetConfig from "@repo/config/testnet"
import { xallocationsPoolABI } from "../const"
import { FunctionFragment, clauseBuilder, coder } from "@vechain/sdk-core"

/**
 * Builds the claim clauses for the specified xApps and round.
 * @param xappIds - The xApp IDs to build the claim clauses for.
 * @param roundId - The round ID to build the claim clauses for.
 * @returns an array of claim clauses for the specified xApps and round.
 */
export const buildClaimClauses = (xappIds: string[], roundId: string) => {
  const clauses = xappIds.map(xappId =>
    clauseBuilder.functionInteraction(
      testnetConfig.xAllocationPoolContractAddress,
      coder.createInterface(xallocationsPoolABI).getFunction("claim") as FunctionFragment,
      [roundId, xappId],
    ),
  )

  return clauses
}
