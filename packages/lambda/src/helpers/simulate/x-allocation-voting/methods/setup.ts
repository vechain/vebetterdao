import { AppConfig } from "@repo/config"
import { TestPk } from "../../../../../../contracts/scripts/helpers/seedAccounts"
import { ThorClient } from "@vechain/sdk-network"
import { whitelist } from "../../../../../../contracts/scripts/helpers/ve-better-passport"
import {
  airdropB3trFromTreasury,
  airdropVTHO,
  transferErc20,
} from "../../../../../../contracts/scripts/helpers/airdrop"
import { B3TR__factory, Emissions__factory } from "../../../../../../contracts/typechain-types"
import { TransactionClause } from "@vechain/sdk-core"
import { Address, ABIContract, Clause } from "@vechain/sdk-core"
import { VOT3__factory } from "../../../../../../contracts/typechain-types"
import { TransactionUtils } from "@repo/utils"
import { SerializableAccount } from "../seededAccounts"

export const waitForNextRound = async (thorClient: ThorClient, config: AppConfig) => {
  const nextRoundBlock = await thorClient.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getNextCycleBlock"),
    [],
  )

  // Wait for the blockchain to reach the specified block number
  await thorClient.blocks.waitForBlockCompressed(Number(nextRoundBlock.result.array?.[0]), { intervalMs: 10000 })
}

export const vot3BalanceOf = async (thorClient: ThorClient, config: AppConfig, account: TestPk) => {
  const balance = await thorClient.contracts.executeCall(
    config.vot3ContractAddress,
    ABIContract.ofAbi(VOT3__factory.abi).getFunction("balanceOf"),
    [account.address.toString()],
  )

  return balance.result.array?.[0]
}

/*
 * Sets up accounts for voting by:
 * 1. Whitelisting all seed accounts
 * 2. Airdropping VTHO to all seed accounts
 * 3. Preparing treasury and airdropping B3TR
 * 4. Converting B3TR to VOT3 tokens
 */
export const setupAccountsForVoting = async (
  thorClient: ThorClient,
  config: AppConfig,
  seedAccounts: { key: TestPk; amount: bigint }[],
  admin: TestPk,
  testAccounts: TestPk[],
): Promise<SerializableAccount[]> => {
  console.log("\n🏗️  === ACCOUNT SETUP ===")

  // Step 1: Whitelist all seed accounts
  console.log("1. 📝 Whitelisting seed accounts...")
  await whitelist(
    seedAccounts.map(account => account.key.address.toString()),
    admin,
    config.veBetterPassportContractAddress,
  )
  console.log(`✅ Whitelisted ${seedAccounts.length} seed accounts`)

  // Step 2: Airdrop VTHO
  console.log("2. 💨 Airdropping VTHO...")
  await airdropVTHO(
    seedAccounts.map(acct => acct.key.address),
    500n,
    admin,
  )
  console.log(`✅ Airdropped VTHO to ${seedAccounts.length} accounts`)

  // Step 3: Prepare treasury and transfer B3TR from migration account
  console.log("3. 🏦 Preparing treasury and transferring B3TR...")
  const migrationAccount = testAccounts[9] // Use account 9 as migration account
  const migrationBal = await thorClient.contracts.executeCall(
    config.b3trContractAddress,
    ABIContract.ofAbi(B3TR__factory.abi).getFunction("balanceOf"),
    [migrationAccount.address.toString()],
  )

  if (migrationBal.result.array && migrationBal.result.array[0] && Number(migrationBal.result.array[0]) > 0) {
    await transferErc20(
      config.b3trContractAddress,
      migrationAccount,
      config.treasuryContractAddress,
      BigInt(migrationBal.result.array[0].toString()),
    )
    console.log(`✅ Transferred B3TR from migration account to treasury: ${migrationBal.result.array[0]}`)
  } else {
    console.log(`ℹ️  Migration account has no B3TR to transfer`)
  }

  // Step 4: Airdrop B3TR from treasury
  console.log("4. 💰 Airdropping B3TR from treasury...")
  await airdropB3trFromTreasury(config.treasuryContractAddress, admin, seedAccounts)
  console.log(`✅ Airdropped B3TR to ${seedAccounts.length} accounts`)

  // Step 5: Convert B3TR to VOT3 and collect final balances
  console.log("5. 🔄 Converting B3TR to VOT3 and collecting balances...")
  const finalAccounts: SerializableAccount[] = []
  let successfulConversions = 0

  for (const seedAccount of seedAccounts) {
    try {
      // Get B3TR balance
      const b3trBalance = await thorClient.contracts.executeCall(
        config.b3trContractAddress,
        ABIContract.ofAbi(B3TR__factory.abi).getFunction("balanceOf"),
        [seedAccount.key.address.toString()],
      )

      let b3trAmount = "0"
      let vot3Amount = "0"
      let setupCompleted = false

      if (b3trBalance.result.array && b3trBalance.result.array[0] && Number(b3trBalance.result.array[0]) > 0) {
        const balance = BigInt(b3trBalance.result.array[0].toString())
        b3trAmount = balance.toString()

        // Convert half of the balance to VOT3
        const amountToConvert = balance / 2n

        if (amountToConvert > 0) {
          const clauses: TransactionClause[] = []

          clauses.push(
            Clause.callFunction(
              Address.of(config.b3trContractAddress),
              ABIContract.ofAbi(B3TR__factory.abi).getFunction("approve"),
              [config.vot3ContractAddress, amountToConvert.toString()],
            ),
          )

          clauses.push(
            Clause.callFunction(
              Address.of(config.vot3ContractAddress),
              ABIContract.ofAbi(VOT3__factory.abi).getFunction("convertToVOT3"),
              [amountToConvert.toString()],
            ),
          )

          await TransactionUtils.sendTx(thorClient as any, clauses, seedAccount.key.pk, 5, true)
          console.log(`✅ ${seedAccount.key.address} - Converted B3TR to VOT3`)

          // Get final VOT3 balance
          const vot3Balance = await thorClient.contracts.executeCall(
            config.vot3ContractAddress,
            ABIContract.ofAbi(VOT3__factory.abi).getFunction("balanceOf"),
            [seedAccount.key.address.toString()],
          )

          if (vot3Balance.result.array && vot3Balance.result.array[0]) {
            vot3Amount = vot3Balance.result.array[0].toString()
          }

          successfulConversions++
          setupCompleted = true
        }
      }

      finalAccounts.push({
        address: seedAccount.key.address.toString(),
        amount: seedAccount.amount.toString(),
        vot3Balance: vot3Amount,
        setupCompleted,
        lastSetupDate: new Date().toISOString(),
      })

      console.log(`📊 ${seedAccount.key.address}: VOT3=${vot3Amount}`)
    } catch (error) {
      console.log(`❌ Failed to setup account ${seedAccount.key.address}: ${error}`)

      finalAccounts.push({
        address: seedAccount.key.address.toString(),
        amount: seedAccount.amount.toString(),
        vot3Balance: "0",
        setupCompleted: false,
        lastSetupDate: new Date().toISOString(),
      })
    }
  }

  console.log(`✅ Successfully set up ${successfulConversions}/${seedAccounts.length} accounts`)
  console.log("🎉 === ACCOUNT SETUP COMPLETE ===\n")

  return finalAccounts
}
