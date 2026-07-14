import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { DBAPool } from "../../../../typechain-types"
import { ethers } from "hardhat"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const veBetterPassportAddress = config.veBetterPassportContractAddress
  const xAllocationVotingAddress = config.xAllocationVotingContractAddress

  console.log(
    `Upgrading DBAPool contract at address: ${config.dbaPoolContractAddress} on network: ${config.network.name}`,
  )

  const dbaPoolBefore = (await ethers.getContractAt("DBAPoolV3", config.dbaPoolContractAddress)) as any
  const versionBefore = await dbaPoolBefore.version()
  console.log(`Current DBAPool version: ${versionBefore}`)

  if (parseInt(versionBefore) !== 3) {
    throw new Error(`Expected DBAPool version 3, got: ${versionBefore}`)
  }

  console.log("\n=== Upgrading Contract ===")
  const dbaPool = (await upgradeProxy(
    "DBAPoolV3",
    "DBAPool",
    config.dbaPoolContractAddress,
    [veBetterPassportAddress, xAllocationVotingAddress],
    {
      version: 4,
    },
  )) as DBAPool

  console.log(`DBAPool upgraded successfully`)

  const version = await dbaPool.version()
  console.log(`New DBAPool version: ${version}`)

  if (parseInt(version) !== 4) {
    throw new Error(`DBAPool version is not 4: ${version}`)
  }

  const wiredPassport = await dbaPool.veBetterPassport()
  const wiredVoting = await dbaPool.xAllocationVoting()
  console.log(`VeBetterPassport set to: ${wiredPassport}`)
  console.log(`XAllocationVoting set to: ${wiredVoting}`)

  if (wiredPassport.toLowerCase() !== veBetterPassportAddress.toLowerCase()) {
    throw new Error(`VeBetterPassport mismatch: expected ${veBetterPassportAddress}, got ${wiredPassport}`)
  }
  if (wiredVoting.toLowerCase() !== xAllocationVotingAddress.toLowerCase()) {
    throw new Error(`XAllocationVoting mismatch: expected ${xAllocationVotingAddress}, got ${wiredVoting}`)
  }

  console.log("\n=== Upgrade Completed Successfully ===")
  process.exit(0)
}

main()
