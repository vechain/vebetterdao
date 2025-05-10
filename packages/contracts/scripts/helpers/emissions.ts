import { Emissions__factory, VoterRewards, VoterRewards__factory } from "../../typechain-types"
import { type TransactionClause, type TransactionBody, Clause, Address, ABIContract } from "@vechain/sdk-core"
import { sendTx } from "./txHelper"
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

  await sendTx(clauses, admin)
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

  await sendTx(clauses, acct)
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

  await sendTx(clauses, acct)
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

  await sendTx(clauses, acct)
}
