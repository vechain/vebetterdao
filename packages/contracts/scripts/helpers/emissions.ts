import { Emissions__factory, VoterRewards, VoterRewards__factory } from "../../typechain-types"
import { type TransactionClause, type TransactionBody, Clause, Address, ABIContract } from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "./txHelper"
import { TestPk } from "./seedAccounts"

export const bootstrapEmissions = async (contractAddress: string, admin: TestPk) => {
  console.log("Bootstrapping emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(Emissions__factory.abi).getFunction("bootstrap"),
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)

  if (!admin.pk) {
    throw new Error("Account does not have a private key")
  }
  await signAndSendTx(body, admin.pk)
}

export const startEmissions = async (contractAddress: string, acct: TestPk) => {
  console.log("Starting emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(Emissions__factory.abi).getFunction("start"),
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, acct.address, 32)

  if (!acct.pk) {
    throw new Error("Account does not have a private key")
  }

  await signAndSendTx(body, acct.pk)
}

export const toggleQuadraticRewarding = async (voterRewards: VoterRewards, acct: TestPk) => {
  console.log("Toggling quadratic rewarding...")

  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(await voterRewards.getAddress()),
      ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("toggleQuadraticRewarding"),
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, acct.address, 32)

  if (!acct.pk) {
    throw new Error("Account does not have a private key")
  }

  await signAndSendTx(body, acct.pk)
}

export const distributeEmissions = async (contractAddress: string, acct: TestPk) => {
  console.log("Distributing emissions...")

  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(Emissions__factory.abi).getFunction("distribute"),
      [],
    ),
  )

  const body: TransactionBody = await buildTxBody(clauses, acct.address, 32)

  if (!acct.pk) {
    throw new Error("Account does not have a private key")
  }

  await signAndSendTx(body, acct.pk)
}
