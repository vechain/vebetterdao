import { B3TRBadge, B3TRBadge__factory } from "../../typechain-types"
import { clauseBuilder, type TransactionClause, type TransactionBody, coder, FunctionFragment } from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "./txHelper"
import { SeedAccount } from "./seedAccounts"
import { chunk } from "./chunk"

export const claimGmNfts = async (gmNft: B3TRBadge, accounts: SeedAccount[]) => {
  console.log("Claiming GM NFTs...")

  const acctChunks = chunk(accounts, 100)
  const contractAddress = await gmNft.getAddress()

  for (const acctChunk of acctChunks) {
    await Promise.all(
      acctChunk.map(async account => {
        const clauses: TransactionClause[] = []
        clauses.push(
          clauseBuilder.functionInteraction(
            contractAddress,
            coder.createInterface(JSON.stringify(B3TRBadge__factory.abi)).getFunction("freeMint") as FunctionFragment,
            [],
          ),
        )

        const body: TransactionBody = await buildTxBody(clauses, account.key.address, 32)

        if (!account.key.pk) {
          throw new Error("Account does not have a private key")
        }

        await signAndSendTx(body, account.key.pk)
      }),
    )
  }
}
