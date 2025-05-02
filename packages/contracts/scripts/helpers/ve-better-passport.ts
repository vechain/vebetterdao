import { VeBetterPassport, VeBetterPassport__factory } from "../../typechain-types"
import { chunk } from "./chunk"
import { clauseBuilder, type TransactionClause, type TransactionBody, coder, FunctionFragment } from "@vechain/sdk-core"
import { buildTxBody } from "./txHelper"
import { signAndSendTx } from "./txHelper"
import { TestPk } from "./seedAccounts"

export const whitelist = async (accounts: string[], admin: TestPk, veBetterPassportAddress: string) => {
  console.log(`Whitelisting accounts...`)

  const accountChunks = chunk(accounts, 200)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.forEach(account => {
      clauses.push(
        clauseBuilder.functionInteraction(
          veBetterPassportAddress,
          coder
            .createInterface(JSON.stringify(VeBetterPassport__factory.abi))
            .getFunction("whitelist") as FunctionFragment,
          [account],
        ),
      )
    })
    const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)

    if (!admin.pk) {
      throw new Error("Account does not have a private key")
    }
    await signAndSendTx(body, admin.pk)
  }
}
