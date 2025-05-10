import { Treasury__factory } from "../../typechain-types"
import { type TransactionClause, Clause, Address, VTHO, ERC20_ABI, ABIContract } from "@vechain/sdk-core"
import { sendTx } from "./txHelper"
import { SeedAccount, TestPk } from "./seedAccounts"
import { chunk } from "./chunk"

export const airdropVTHO = async (accounts: Address[], amount: bigint, sourceAccount: TestPk) => {
  console.log(`Airdropping VTHO...`)

  const accountChunks = chunk(accounts, 200)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.forEach(address => {
      clauses.push(Clause.transferVTHOToken(address, VTHO.of(amount)))
    })

    await sendTx(clauses, sourceAccount)
  }
}

/**
 * Transfer ERC20 tokens
 */
export const transferErc20 = async (tokenAddress: string, sender: TestPk, recipient: string, amount: bigint) => {
  console.log(`Transferring ${amount} ${tokenAddress} tokens from ${sender.address} to ${recipient}`)
  if (amount === 0n) {
    console.log(`Skipping transfer of 0 tokens from ${sender.address} to ${recipient}`)
    return
  }
  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(Address.of(tokenAddress), ABIContract.ofAbi(ERC20_ABI).getFunction("transfer"), [
      recipient,
      amount,
    ]),
  )

  await sendTx(clauses, sender)
}

/**
 *  Airdrop B3TR from treasury to a list of accounts
 */
export const airdropB3trFromTreasury = async (treasuryAddress: string, admin: TestPk, accounts: SeedAccount[]) => {
  console.log(`Airdropping B3TR...`)

  const accountChunks = chunk(accounts, 100)

  for (const accountChunk of accountChunks) {
    const clauses: TransactionClause[] = []

    accountChunk.forEach(account => {
      clauses.push(
        Clause.callFunction(
          Address.of(treasuryAddress),
          ABIContract.ofAbi(Treasury__factory.abi).getFunction("transferB3TR"),
          [account.key.address.toString(), account.amount],
        ),
      )
    })

    await sendTx(clauses, admin)
  }
}
