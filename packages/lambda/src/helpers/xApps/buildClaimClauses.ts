import mainnetConfig from "@repo/config/mainnet"
import { XAllocationPool__factory as XAllocationPool } from "@repo/contracts"
import { ABIContract, Address, Clause } from "@vechain/sdk-core"

/**
 * Builds the claim clauses for the specified xApps and round.
 * @param xappIds - The xApp IDs to build the claim clauses for.
 * @param roundId - The round ID to build the claim clauses for.
 * @returns an array of claim clauses for the specified xApps and round.
 */
export const buildClaimClauses = (xappIds: string[], roundId: string) => {
  const clauses = xappIds.map(xappId =>
    Clause.callFunction(
      Address.of(mainnetConfig.xAllocationPoolContractAddress),
      ABIContract.ofAbi(XAllocationPool.abi).getFunction("claim"),
      [roundId, xappId],
    ),
  )

  return clauses
}

/**
 * Builds the claim clause for the specified xApp and round.
 * @param xappId - The xApp ID to build the claim clause for.
 * @param roundId - The round ID to build the claim clause for.
 * @returns the claim clause for the specified xApp and round.
 */
export const buildClaimClause = (xappId: string, roundId: string) => {
  return Clause.callFunction(
    Address.of(mainnetConfig.xAllocationPoolContractAddress),
    ABIContract.ofAbi(XAllocationPool.abi).getFunction("claim"),
    [roundId, xappId],
  )
}
