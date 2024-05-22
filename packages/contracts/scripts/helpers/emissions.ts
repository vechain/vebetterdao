import { Emissions__factory } from "../../typechain-types"
import {
  clauseBuilder,
  type TransactionClause,
  type TransactionBody,
  coder,
  FunctionFragment,
  type IHDNode,
} from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "./txHelper"

export const bootstrapEmissions = async (contractAddress: string, admin: IHDNode) => {
  console.log("Bootstrapping emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    clauseBuilder.functionInteraction(
      contractAddress,
      coder.createInterface(JSON.stringify(Emissions__factory.abi)).getFunction("bootstrap") as FunctionFragment,
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)

  if (!admin.privateKey) {
    throw new Error("Account does not have a private key")
  }
  await signAndSendTx(body, admin.privateKey)
}

export const startEmissions = async (contractAddress: string, acct: IHDNode) => {
  console.log("Starting emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    clauseBuilder.functionInteraction(
      contractAddress,
      coder.createInterface(JSON.stringify(Emissions__factory.abi)).getFunction("start") as FunctionFragment,
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, acct.address, 32)

  if (!acct.privateKey) {
    throw new Error("Account does not have a private key")
  }

  await signAndSendTx(body, acct.privateKey)
}

export const distributeEmissions = async (contractAddress: string, acct: IHDNode) => {
  console.log("Distributing emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    clauseBuilder.functionInteraction(
      contractAddress,
      coder.createInterface(JSON.stringify(Emissions__factory.abi)).getFunction("distribute") as FunctionFragment,
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, acct.address, 32)

  if (!acct.privateKey) {
    throw new Error("Account does not have a private key")
  }

  await signAndSendTx(body, acct.privateKey)
}
