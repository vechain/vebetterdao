import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationPool__factory"
import { EnhancedClause } from "@vechain/vechain-kit"

const XAllocationPoolInterface = XAllocationPool__factory.createInterface()
/**
 * Builds a transaction to claim rewards for a given set of rounds.
 *
 */
export const buildClaimXAppAllocationTx = (roundId: string, appIds: string[]): EnhancedClause[] => {
  const clauses = []
  for (const id of appIds) {
    const clause: EnhancedClause = {
      to: getConfig().xAllocationPoolContractAddress,
      value: 0,
      data: XAllocationPoolInterface.encodeFunctionData("claim", [roundId, id]),
      comment: "Claiming allocation rewards for round " + roundId,
      abi: JSON.parse(JSON.stringify(XAllocationPoolInterface.getFunction("claim"))),
    }
    clauses.push(clause)
  }
  return clauses
}
