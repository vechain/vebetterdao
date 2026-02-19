import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { SeedStrategy, getSeedAccounts, getTestKeys } from "@vechain/vebetterdao-contracts/scripts/helpers/seedAccounts"
import type { SeedAccount } from "@vechain/vebetterdao-contracts/scripts/helpers/seedAccounts"
import {
  airdropVTHO,
  airdropB3trFromTreasury,
  transferErc20,
} from "@vechain/vebetterdao-contracts/scripts/helpers/airdrop"
import { convertB3trForVot3 } from "@vechain/vebetterdao-contracts/scripts/helpers/swap"
import { whitelist } from "@vechain/vebetterdao-contracts/scripts/helpers/ve-better-passport"
import type { B3TR, VOT3, VeBetterPassport } from "@vechain/vebetterdao-contracts/typechain-types"
import type { SimulationConfig, SeedStrategyName } from "../simulation.config"
import { elapsed } from "./utils"

const strategyMap: Record<SeedStrategyName, SeedStrategy> = {
  random: SeedStrategy.RANDOM,
  fixed: SeedStrategy.FIXED,
  linear: SeedStrategy.LINEAR,
}

export const seed = async (simConfig: SimulationConfig, b3tr: B3TR, vot3: VOT3): Promise<SeedAccount[]> => {
  const config = getConfig()
  const strategy = strategyMap[simConfig.seedStrategy]
  const seedAccts = getSeedAccounts(strategy, simConfig.numAccounts, simConfig.accountOffset)
  const accounts = getTestKeys(10)
  const admin = accounts[0]
  const migrationAccount = accounts[9]

  const start = performance.now()
  console.log(
    `\n--- Seeding ${simConfig.numAccounts} accounts (offset=${simConfig.accountOffset}, strategy=${simConfig.seedStrategy}) ---`,
  )

  // Enable whitelist check on VeBetterPassport (deployment only enables participation score)
  const passport = (await ethers.getContractAt(
    "VeBetterPassport",
    config.veBetterPassportContractAddress,
  )) as unknown as VeBetterPassport
  const WHITELIST_CHECK = 1
  if (!(await passport.isCheckEnabled(WHITELIST_CHECK))) {
    await (await passport.toggleCheck(WHITELIST_CHECK)).wait()
    console.log(`  Whitelist check enabled on VeBetterPassport (${elapsed(start)})`)
  }

  console.log(`  [1/5] Whitelisting ${seedAccts.length} accounts on VeBetterPassport...`)
  await whitelist(
    seedAccts.map(a => a.key.address.toString()),
    admin,
    config.veBetterPassportContractAddress,
  )
  console.log(`  [1/5] Whitelisting done (${elapsed(start)})`)

  console.log(`  [2/5] Airdropping VTHO to ${seedAccts.length} accounts...`)
  await airdropVTHO(
    seedAccts.map(a => a.key.address),
    500n,
    admin,
  )
  console.log(`  [2/5] VTHO airdrop done (${elapsed(start)})`)

  console.log(`  [3/5] Transferring migration account B3TR to treasury...`)
  const bal = await b3tr.balanceOf(migrationAccount.address.toString())
  await transferErc20(await b3tr.getAddress(), migrationAccount, config.treasuryContractAddress, bal)
  console.log(`  [3/5] Transfer done — bal=${bal} (${elapsed(start)})`)

  console.log(`  [4/5] Airdropping B3TR from treasury...`)
  await airdropB3trFromTreasury(config.treasuryContractAddress, admin, seedAccts)
  console.log(`  [4/5] B3TR airdrop done (${elapsed(start)})`)

  // Sub-batch to avoid "tx rejected: expired" — convertB3trForVot3 sends
  // parallel per-account txs; too many exceed the 32-block expiration window.
  const convertBatch = 20
  const totalBatches = Math.ceil(seedAccts.length / convertBatch)
  console.log(`  [5/5] Converting B3TR -> VOT3 (${totalBatches} batches of ${convertBatch})...`)
  for (let i = 0; i < seedAccts.length; i += convertBatch) {
    const batchNum = Math.floor(i / convertBatch) + 1
    await convertB3trForVot3(b3tr, vot3, seedAccts.slice(i, i + convertBatch))
    if (batchNum % 5 === 0 || batchNum === totalBatches) {
      console.log(`    batch ${batchNum}/${totalBatches} (${elapsed(start)})`)
    }
  }

  console.log(`--- Seeding complete (${elapsed(start)}) ---\n`)
  return seedAccts
}
