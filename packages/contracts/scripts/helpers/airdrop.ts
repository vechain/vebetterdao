import { B3TR, Treasury__factory } from "../../typechain-types"
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
 *  Airdrop B3TR from treasury to a list of accounts
 */
export const airdropB3trFromTreasury = async (treasuryAddress: string, admin: IHDNode, accounts: SeedAccount[]) => {
  console.log(`Airdropping B3TR...`)

  const accountChunks = chunk(accounts, 100)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.map(account => {
      clauses.push(
        clauseBuilder.functionInteraction(
          treasuryAddress,
          coder.createInterface(JSON.stringify(Treasury__factory.abi)).getFunction("transferB3TR") as FunctionFragment,
          [account.address, account.amount],
        ),
      )
    })

    const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)

    if (!admin.privateKey) {
      throw new Error("Account does not have a private key")
    }
    await signAndSendTx(body, admin.privateKey)
  }
}

/**
 * Airdrop a percentage of B3TR supply to a specific account
 */
export const airdropB3trPercentage = async (
  treasuryAddress: string,
  admin: IHDNode,
  account: SeedAccount,
  percentage: number,
  b3tr: B3TR,
) => {
  console.log(`Airdropping ${percentage}% of B3TR supply to ${account}...`)

  const b3trSupply: bigint = await b3tr.totalSupply()

  console.log("B3TR Supply: ", b3trSupply.toString())

  const amount = (b3trSupply * BigInt(percentage)) / BigInt(100)

  console.log("Amount: ", amount.toString())

  const clause: TransactionClause = clauseBuilder.functionInteraction(
    treasuryAddress,
    coder.createInterface(JSON.stringify(Treasury__factory.abi)).getFunction("transferB3TR") as FunctionFragment,
    [account.address, amount],
  )

  const body: TransactionBody = await buildTxBody([clause], admin.address, 32)

  if (!admin.privateKey) {
    throw new Error("Account does not have a private key")
  }
  await signAndSendTx(body, admin.privateKey)
}
