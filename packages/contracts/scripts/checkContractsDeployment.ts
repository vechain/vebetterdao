import { ethers, network } from "hardhat"
import { getConfig, getContractsConfig } from "@repo/config"
import { AppConfig } from "@repo/config"
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

// Non-local entrypoint: deploy-if-missing for testnet, no-op for staging/mainnet.
// On LOCAL the shared dev-stack drives this — `vechain-dev up` calls
// isProjectDeployed() against the project's registration and only invokes the
// deploy command when needed, so the in-repo getCode check is intentionally
// absent here (it relied on `local.ts` which is not part of the shared state).
export async function checkContractsDeployment() {
  let finalConfig: AppConfig = config
  try {
    if (env === AppEnv.LOCAL) {
      const newAddresses = await deployAll(getContractsConfig(env))
      finalConfig = await overrideLocalConfigWithNewContracts(newAddresses)
    } else {
      const code = config.b3trContractAddress === "" ? "0x" : await ethers.provider.getCode(config.b3trContractAddress)
      if (code === "0x") {
        console.log(`B3tr contract not deployed at address ${config.b3trContractAddress}`)
        if (isTestnetEnv) {
          const newAddresses = await deployAll(getContractsConfig(env))
          finalConfig = await overrideLocalConfigWithNewContracts(newAddresses)
        } else console.log(`Skipping deployment on ${network.name}`)
      } else console.log(`B3tr contract already deployed`)
    }
  } catch (e) {
    console.log(e)
  }

  if (env === AppEnv.LOCAL) {
    await registerWithDevStack(finalConfig)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
