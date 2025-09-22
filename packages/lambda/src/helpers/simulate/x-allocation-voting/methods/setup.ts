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

export const waitForNextRound = async (thorClient: ThorClient, config: AppConfig) => {
  const nextRoundBlock = await thorClient.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getNextCycleBlock"),
    [],
  )

  // Wait for the blockchain to reach the specified block number
  await thorClient.blocks.waitForBlockCompressed(Number(nextRoundBlock.result.array?.[0]), { intervalMs: 10000 })
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
  seedAccounts: any[],
  testAccounts: TestPk[],
  admin: TestPk,
) => {
  console.log("\n=== Setting up accounts for voting ===")

  // Step 1: Whitelist all seed accounts
  console.log("1. Whitelisting seed accounts...")
  await whitelist(
    seedAccounts.map(account => account.key.address.toString()),
    admin,
    config.veBetterPassportContractAddress,
  )
  console.log(`Whitelisted ${seedAccounts.length} seed accounts`)

  // Step 2: Airdrop VTHO
  console.log("2. Airdropping VTHO...")
  await airdropVTHO(
    seedAccounts.map(acct => acct.key.address),
    500n,
    admin,
  )
  console.log(`Airdropped VTHO to ${seedAccounts.length} accounts`)

  // Step 3: Prepare treasury and airdrop B3TR
  console.log("3. Preparing treasury and airdropping B3TR...")
  const migrationAccount = testAccounts[9] // Use account 9 as migration account
  const bal = await thorClient.contracts.executeCall(
    config.b3trContractAddress,
    ABIContract.ofAbi(B3TR__factory.abi).getFunction("balanceOf"),
    [migrationAccount.address.toString()],
  )

  if (bal.result.array && bal.result.array[0] && Number(bal.result.array[0]) > 0) {
    await transferErc20(
      config.b3trContractAddress,
      migrationAccount,
      config.treasuryContractAddress,
      BigInt(bal.result.array[0].toString()),
    )
    console.log(`Transferred B3TR to treasury`)
  }

  await airdropB3trFromTreasury(config.treasuryContractAddress, admin, seedAccounts)
  console.log(`Airdropped B3TR to ${seedAccounts.length} accounts`)

  // Step 4: Convert B3TR to VOT3
  console.log("4. Converting B3TR to VOT3...")
  let successfulConversions = 0
  for (const seedAccount of seedAccounts) {
    try {
      // Get B3TR balance
      const b3trBalance = await thorClient.contracts.executeCall(
        config.b3trContractAddress,
        ABIContract.ofAbi(B3TR__factory.abi).getFunction("balanceOf"),
        [seedAccount.key.address.toString()],
      )

      if (b3trBalance.result.array && b3trBalance.result.array[0] && Number(b3trBalance.result.array[0]) > 0) {
        const balance = BigInt(b3trBalance.result.array[0].toString())
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
          console.log(`${seedAccount.key.address} - Converted B3TR to VOT3`)

          successfulConversions++
        }
      }
    } catch (error) {
      console.log(`Failed to convert B3TR for account ${seedAccount.key.address}: ${error}`)
    }
  }
  console.log(`Successfully converted B3TR to VOT3 for ${successfulConversions}/${seedAccounts.length} accounts`)

  console.log("=== Account setup complete ===")
}
