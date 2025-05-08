import { VoterRewards, VoterRewards__factory } from "../../typechain-types"
import { type TransactionClause, type TransactionBody, Clause, ABIContract, Address } from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "./txHelper"
import { SeedAccount, TestPk } from "./seedAccounts"
import { chunk } from "./chunk"

export const claimVoterRewards = async (
  voterRewards: VoterRewards,
  roundId: number,
  signingAcct: TestPk,
  accounts: SeedAccount[],
  ignoreErrors: boolean = false,
) => {
  console.log("Claiming voter rewards...")

  const contractAddress = await voterRewards.getAddress()
  const accountChunks = chunk(accounts, 50)

  for (const accountChunk of accountChunks) {
    try {
      const clauses: TransactionClause[] = []

      accountChunk.forEach(account => {
        clauses.push(
          Clause.callFunction(
            Address.of(contractAddress),
            ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("claimReward"),
            [roundId, account.key.address],
          ),
        )
      })

      const body: TransactionBody = await buildTxBody(clauses, signingAcct.address, 32)

      if (!signingAcct.pk) {
        throw new Error("Account does not have a private key")
      }

      await signAndSendTx(body, signingAcct.pk)
      console.log(`Rewards claimed for chunk starting with account ${accountChunk[0]?.key.address}`)
    } catch (e) {
      if (ignoreErrors) {
        console.error(`Error claiming rewards for chunk starting with account ${accountChunk[0]?.key.address}:`, e)
      } else {
        throw e
      }
    }
  }
  console.log("Finished attempting to claim voter rewards.")
}
