import { B3TR, B3TR__factory, VOT3, VOT3__factory } from "../../typechain-types"
import { type TransactionClause, type TransactionBody, Clause, ABIContract, Address } from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "./txHelper"
import { SeedAccount } from "./seedAccounts"
import { chunk } from "./chunk"

export const convertB3trForVot3 = async (b3tr: B3TR, vot3: VOT3, accounts: SeedAccount[]) => {
  console.log(`Converting B3TR for VOT3...`)

  const acctChunks = chunk(accounts, 100)

  const b3trAddr = await b3tr.getAddress()
  const vot3Addr = await vot3.getAddress()

  for (const chunk of acctChunks) {
    await Promise.all(
      chunk.map(async account => {
        const clauses: TransactionClause[] = []

        const b3trAmount = await b3tr.balanceOf(account.key.address)

        clauses.push(
          Clause.callFunction(Address.of(b3trAddr), ABIContract.ofAbi(B3TR__factory.abi).getFunction("approve"), [
            vot3Addr,
            b3trAmount,
          ]),
        )

        clauses.push(
          Clause.callFunction(Address.of(vot3Addr), ABIContract.ofAbi(VOT3__factory.abi).getFunction("convertToVOT3"), [
            b3trAmount,
          ]),
        )

        const body: TransactionBody = await buildTxBody(clauses, account.key.address, 32)

        await signAndSendTx(body, account.key.pk)
      }),
    )
  }
}
