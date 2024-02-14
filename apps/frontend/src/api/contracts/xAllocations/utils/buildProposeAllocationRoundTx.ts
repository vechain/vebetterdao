import { getConfig } from "@repo/config"
import { XAllocationVotingJson } from "@repo/contracts"
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 * Build the clause to propose a new allocation round
 * @param thor thor instance
 * @returns the clause to propose a new allocation round
 */
export const buildProposeAllocationRoundTx = (thor: Connex.Thor): Connex.Vendor.TxMessage[0] => {
  const functionAbi = XAllocationVotingJson.abi.find(e => e.name === "proposeNewAllocationRound")
  if (!functionAbi) throw new Error("Function abi not found for proposeNewAllocationRound")

  const clause = thor.account(XALLOCATIONVOTING_CONTRACT).method(functionAbi).asClause()

  return {
    ...clause,
    comment: `Propose a new allocation round`,
    abi: functionAbi,
  }
}
