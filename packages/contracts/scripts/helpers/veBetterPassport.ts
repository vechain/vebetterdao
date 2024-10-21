import { VeBetterPassport, VeBetterPassport__factory } from "../../typechain-types"
import { clauseBuilder, type TransactionClause, type TransactionBody, coder, FunctionFragment } from "@vechain/sdk-core"
import { buildTxBody, signAndSendTx } from "./txHelper"
import { SeedAccount, TestPk } from "./seedAccounts"
import { ethers } from "hardhat"
import { App } from "./xApp"

// Set apps security level to LOW in veBetterPassport
export const setSecurityLevel = async (veBetterPassport: VeBetterPassport, admin: TestPk, apps: App[]) => {
  console.log("Setting security level to LOW for all apps")

  // build clauses
  const clauses: TransactionClause[] = []
  for (const app of apps) {
    const appId = ethers.keccak256(ethers.toUtf8Bytes(app.name))
    clauses.push(
      clauseBuilder.functionInteraction(
        await veBetterPassport.getAddress(),
        coder
          .createInterface(JSON.stringify(VeBetterPassport__factory.abi))
          .getFunction("setAppSecurity") as FunctionFragment,
        [appId, 1],
      ),
    )
  }

  const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)
  await signAndSendTx(body, admin.pk)
}

// register fake app interaction in veBetterPassport for the providing accounts
export const simulateAppInteractions = async (
  veBetterPassport: VeBetterPassport,
  admin: TestPk,
  accounts: SeedAccount[],
  apps: App[],
) => {
  console.log("Simulating app interactions...")
  const clauses: TransactionClause[] = []

  // for each account register a random amount of actions with random apps
  for (const account of accounts) {
    const randomAmount = Math.floor(Math.random() * 10) + 1
    for (let i = 0; i < randomAmount; i++) {
      // a random integer between 1 and 5
      const randomRound = Math.floor(Math.random() * 5) + 1

      for (let j = 0; j < randomRound; j++) {
        // choose a random app
        const randomApp = apps[Math.floor(Math.random() * apps.length)]
        const appId = ethers.keccak256(ethers.toUtf8Bytes(randomApp.name))

        clauses.push(
          clauseBuilder.functionInteraction(
            await veBetterPassport.getAddress(),
            coder
              .createInterface(JSON.stringify(VeBetterPassport__factory.abi))
              .getFunction("registerAction") as FunctionFragment,
            [account.key.address, appId],
          ),
        )
      }
    }
  }

  const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)
  await signAndSendTx(body, admin.pk)
}

// set threshold to 300
export const setThreshold = async (veBetterPassport: VeBetterPassport, admin: TestPk, threshold: number) => {
  console.log(`Setting passport threshold to ${threshold}`)

  const clauses: TransactionClause[] = []
  clauses.push(
    clauseBuilder.functionInteraction(
      await veBetterPassport.getAddress(),
      coder
        .createInterface(JSON.stringify(VeBetterPassport__factory.abi))
        .getFunction("setThresholdPoPScore") as FunctionFragment,
      [threshold],
    ),
  )
  const body: TransactionBody = await buildTxBody(clauses, admin.address, 32)
  await signAndSendTx(body, admin.pk)
}
