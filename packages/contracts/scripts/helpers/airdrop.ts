import { Treasury__factory } from "../../typechain-types"
import {
  clauseBuilder,
  type TransactionClause,
  type TransactionBody,
  coder,
  FunctionFragment,
  type IHDNode,
  VTHO_ADDRESS,
  unitsUtils,
} from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "./txHelper"
import { SeedAccount } from "./seedAccounts"
import { chunk } from "./chunk"

export const airdropVTHO = async (accounts: SeedAccount[], signingAcct: IHDNode) => {
  console.log(`Airdropping VTHO...`)

  const accountChunks = chunk(accounts, 200)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.map(account => {
      clauses.push(clauseBuilder.transferToken(VTHO_ADDRESS, account.address, unitsUtils.parseVET("200000")))
    })

    const body: TransactionBody = await buildTxBody(clauses, signingAcct.address, 32)

    if (!signingAcct.privateKey) {
      throw new Error("Account does not have a private key")
    }
    await signAndSendTx(body, signingAcct.privateKey)
  }
}

/**
 *  Transfer B3TR to a list of accounts
 */
export const airdropB3tr = async (source: IHDNode, b3trAddress: string, accounts: SeedAccount[]) => {
  console.log(`Airdropping B3TR...`)

  const accountChunks = chunk(accounts, 100)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.map(account => {
      clauses.push(clauseBuilder.transferToken(b3trAddress, account.address, account.amount))
    })

    const body: TransactionBody = await buildTxBody(clauses, source.address, 32)

    if (!source.privateKey) {
      throw new Error("Account does not have a private key")
    }
    await signAndSendTx(body, source.privateKey)
  }
}
