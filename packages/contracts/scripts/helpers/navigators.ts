import { B3TR, B3TR__factory, NavigatorRegistry__factory, VOT3, VOT3__factory } from "../../typechain-types"
import { type TransactionClause, Clause, ABIContract, Address } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { TestPk } from "./seedAccounts"
import { getConfig, AppConfig } from "@repo/config"
import { ThorClient } from "@vechain/sdk-network"

const thorClient = ThorClient.at(getConfig().nodeUrl)

const NAV_METADATA_URIS = [
  "ipfs://bafkreigvg5ylnewzgknwloglhpaaog5ywq7f7wd6fdo75j3sx5vbh3ngoe",
  "ipfs://bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenasqhntm",
]

/**
 * Seed 2 navigators using accounts[1] and accounts[2].
 * Mints B3TR to the admin, creates VOT3 supply, funds navigators, and registers them.
 */
export const seedNavigators = async (b3tr: B3TR, vot3: VOT3, accounts: TestPk[], config: AppConfig) => {
  console.log("================")
  console.log("Seeding navigators...")

  const admin = accounts[0]
  const nav1 = accounts[1]
  const nav2 = accounts[2]

  const navigatorRegistryAddr = config.navigatorRegistryContractAddress
  if (!navigatorRegistryAddr) {
    console.log("  NavigatorRegistry address not found in config, skipping navigator seeding")
    return
  }

  const b3trAddr = await b3tr.getAddress()
  const vot3Addr = await vot3.getAddress()
  const navRegAbi = ABIContract.ofAbi(NavigatorRegistry__factory.abi)
  const b3trAbi = ABIContract.ofAbi(B3TR__factory.abi)
  const vot3Abi = ABIContract.ofAbi(VOT3__factory.abi)

  // Read min stake from contract
  const minStakeResult = await thorClient.contracts.executeCall(
    Address.of(navigatorRegistryAddr).toString(),
    navRegAbi.getFunction("getMinStake"),
    [],
  )
  const minStake = BigInt((minStakeResult as unknown as bigint[])[0].toString())
  const stakeAmount = minStake * 2n // Stake double the minimum
  console.log(`  Min stake: ${minStake.toString()}, staking: ${stakeAmount.toString()}`)

  // Mint B3TR to admin for distribution + VOT3 supply
  const totalNeeded = stakeAmount * 2n + stakeAmount * 4n // 2 navigators + VOT3 supply buffer
  await TransactionUtils.sendTx(
    thorClient,
    [Clause.callFunction(Address.of(b3trAddr), b3trAbi.getFunction("mint"), [admin.address.toString(), totalNeeded])],
    admin.pk,
  )
  console.log(`  Minted ${totalNeeded.toString()} B3TR to admin`)

  // Create VOT3 supply (needed for maxStake check: vot3Supply * maxPercentage / 10000)
  const vot3Supply = stakeAmount * 4n
  await TransactionUtils.sendTx(
    thorClient,
    [Clause.callFunction(Address.of(b3trAddr), b3trAbi.getFunction("approve"), [vot3Addr, vot3Supply])],
    admin.pk,
  )
  await TransactionUtils.sendTx(
    thorClient,
    [Clause.callFunction(Address.of(vot3Addr), vot3Abi.getFunction("convertToVOT3"), [vot3Supply])],
    admin.pk,
  )
  console.log(`  Created ${vot3Supply.toString()} VOT3 supply`)

  // Register navigators
  for (let i = 0; i < 2; i++) {
    const nav = i === 0 ? nav1 : nav2
    const uri = NAV_METADATA_URIS[i]

    // Transfer B3TR from admin to navigator
    await TransactionUtils.sendTx(
      thorClient,
      [
        Clause.callFunction(Address.of(b3trAddr), b3trAbi.getFunction("transfer"), [
          nav.address.toString(),
          stakeAmount,
        ]),
      ],
      admin.pk,
    )

    // Approve + Register in one multi-clause tx
    await TransactionUtils.sendTx(
      thorClient,
      [
        Clause.callFunction(Address.of(b3trAddr), b3trAbi.getFunction("approve"), [navigatorRegistryAddr, stakeAmount]),
        Clause.callFunction(Address.of(navigatorRegistryAddr), navRegAbi.getFunction("register"), [stakeAmount, uri]),
      ],
      nav.pk,
    )

    console.log(`  Navigator ${i + 1} registered: ${nav.address.toString()} (stake: ${stakeAmount.toString()})`)
  }

  console.log("Navigator seeding complete!")
}
