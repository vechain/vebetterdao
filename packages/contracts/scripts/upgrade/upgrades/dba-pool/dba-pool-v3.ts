import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { DBAPool } from "../../../../typechain-types"
import { ethers } from "hardhat"

const VBD_TREASURY_ADDRESS = "0xD5903BCc66e439c753e525F8AF2FeC7be2429593"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(
    `Upgrading DBAPool contract at address: ${config.dbaPoolContractAddress} on network: ${config.network.name}`,
  )

  const dbaPoolBefore = (await ethers.getContractAt("DBAPoolV2", config.dbaPoolContractAddress)) as any
  const versionBefore = await dbaPoolBefore.version()
  console.log(`Current DBAPool version: ${versionBefore}`)

  if (parseInt(versionBefore) !== 2) {
    throw new Error(`Expected DBAPool version 2, got: ${versionBefore}`)
  }

  console.log("\n=== Upgrading Contract ===")
  const dbaPool = (await upgradeProxy("DBAPoolV2", "DBAPool", config.dbaPoolContractAddress, [VBD_TREASURY_ADDRESS], {
    version: 3,
  })) as DBAPool

  console.log(`DBAPool upgraded successfully`)

  const version = await dbaPool.version()
  console.log(`New DBAPool version: ${version}`)

  if (parseInt(version) !== 3) {
    throw new Error(`DBAPool version is not 3: ${version}`)
  }

  const treasuryAddr = await dbaPool.treasuryAddress()
  console.log(`Treasury address set to: ${treasuryAddr}`)

  if (treasuryAddr.toLowerCase() !== VBD_TREASURY_ADDRESS.toLowerCase()) {
    throw new Error(`Treasury address mismatch: expected ${VBD_TREASURY_ADDRESS}, got ${treasuryAddr}`)
  }

  console.log("\n=== Upgrade Completed Successfully ===")
  process.exit(0)
}

main()
