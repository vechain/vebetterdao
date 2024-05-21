import testnetConfig from "@repo/config/testnet"
import { xallocationsPoolABI } from "../const"
import { FunctionFragment, clauseBuilder, coder } from "@vechain/sdk-core"

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
