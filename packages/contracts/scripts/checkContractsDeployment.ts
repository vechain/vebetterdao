import { ethers, network } from "hardhat"
import { getConfig, getContractsConfig } from "@repo/config"
import { AppEnv } from "@repo/config/contracts"
import { deployAll } from "./deploy/deployAll"
import { overrideLocalConfigWithNewContracts, registerWithDevStack } from "./helpers/devStack"

const config = getConfig()
const env = config.environment
if (!env) throw new Error("NEXT_PUBLIC_APP_ENV env variable must be set")

const isTestnetEnv = process.env.NEXT_PUBLIC_APP_ENV === AppEnv.TESTNET

async function main() {
  console.log(`Checking contracts deployment on ${network.name} (${config.network.urls[0]})...`)
  await checkContractsDeployment()
  process.exit(0)
}

// Source of truth for the "is deployed?" question is the address in
// packages/config/<env>.ts. If the on-chain bytecode at that address is empty,
// redeploy and rewrite the config. The shared dev-stack registration is only
// touched when SKIP_DEV_STACK_REGISTER is unset (i.e. from `dev:up`/`dev:deploy`),
// so a redeploy triggered by `dev:local` updates only local.ts and leaves
// the shared indexer/explorer registration alone.
export async function checkContractsDeployment() {
  const code = config.b3trContractAddress === "" ? "0x" : await ethers.provider.getCode(config.b3trContractAddress)
  if (code !== "0x") {
    console.log(`B3tr contract already deployed`)
    return
  }

  console.log(`B3tr contract not deployed at address ${config.b3trContractAddress} deploying...`)

  if (env === AppEnv.LOCAL) {
    const newAddresses = await deployAll(getContractsConfig(env))
    const finalConfig = await overrideLocalConfigWithNewContracts(newAddresses)
    await registerWithDevStack(finalConfig)
    return
  }

  if (isTestnetEnv) {
    const newAddresses = await deployAll(getContractsConfig(env))
    await overrideLocalConfigWithNewContracts(newAddresses)
  } else {
    console.log(`Skipping deployment on ${network.name}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
