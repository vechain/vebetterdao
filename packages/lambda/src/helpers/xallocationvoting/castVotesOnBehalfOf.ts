import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { buildGasEstimate, buildTxBody } from "../transaction"

/**
 * Casts votes on behalf of users with auto-voting enabled
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param users - Array of user addresses to vote on behalf of
 * @param roundId - The round ID to cast votes for
 * @param walletAddress - The wallet address to use for signing
 * @param privateKey - The private key for signing (as hex string or Uint8Array)
 * @returns Transaction receipt and gas result
 */
export const castVotesOnBehalfOf = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  roundId: number,
  walletAddress: string,
  privateKey: string | Uint8Array,
) => {
  console.log(`Preparing to cast votes for ${users.length} users in round ${roundId}`)

  // Build clauses for each user
  const clauses: Clause[] = users.map(user =>
    Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVoteOnBehalfOf"),
      [user, roundId],
    ),
  )

  console.log(`Built ${clauses.length} clauses for batch voting`)

  const gasResult = await buildGasEstimate(thor, clauses, walletAddress)

  if (gasResult.reverted) {
    console.error("Gas estimation reverted:", gasResult.revertReasons, gasResult.vmErrors)
    return { receipt: null, gasResult }
  }

  console.log(`Estimated gas: ${gasResult.totalGas}`)

  const txBody = await buildTxBody(thor, clauses, gasResult.totalGas)

  // Handle both string (hex) and Uint8Array private keys
  const signedTx =
    typeof privateKey === "string"
      ? Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
      : Transaction.of(txBody).sign(privateKey)

  const tx = await thor.transactions.sendTransaction(signedTx)

  console.log(`Transaction sent: ${tx.id}`)

  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}
