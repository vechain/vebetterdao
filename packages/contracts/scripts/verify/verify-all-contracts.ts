#!/usr/bin/env ts-node

/**
 * Automated contract verification script for B3TR
 *
 * This script reads contract addresses from the configuration files and verifies them on Sourcify.
 *
 * Usage: ts-node verify-all-contracts.ts <network>
 * Example: ts-node verify-all-contracts.ts mainnet
 */

import { execSync } from "child_process"
import { ethers } from "ethers"
import * as fs from "fs"
import * as path from "path"

import { mainnetImplementations, testnetImplementations } from "./contract-implementations"

// Import configs dynamically to avoid TypeScript resolution issues
const mainnetConfig = require("@repo/config/mainnet").default
const testnetConfig = require("@repo/config/testnet").default

// Contract name mappings
interface ContractVerification {
  address: string
  contractName: string
  isProxy?: boolean
  implementationAddress?: string
}

interface VerificationResult {
  address: string
  name: string
  success: boolean
  error?: string
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length < 1 || (args[0] !== "mainnet" && args[0] !== "testnet")) {
  console.error("Usage: ts-node verify-all-contracts.ts <network>")
  console.error("network: mainnet or testnet")
  process.exit(1)
}

const network = args[0] as "mainnet" | "testnet"
const config = network === "mainnet" ? mainnetConfig : testnetConfig
const implementations = network === "mainnet" ? mainnetImplementations : testnetImplementations

console.log(`\n🚀 Starting verification process for ${network}...\n`)

// Setup provider based on network
const rpcUrl = network === "mainnet" ? "https://mainnet.vechain.org" : "https://testnet.vechain.org"
const provider = new ethers.JsonRpcProvider(rpcUrl)

// Event signature for Upgraded(address indexed implementation)
const UPGRADED_EVENT_SIGNATURE = "0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b"

/**
 * Get the implementation address for a proxy contract by querying the Upgraded event
 * @param proxyAddress The proxy contract address
 * @returns The implementation address or null if not found
 */
async function getImplementationAddress(proxyAddress: string): Promise<string | null> {
  try {
    console.log(`🔍 Querying implementation address for proxy ${proxyAddress}...`)

    // Query for Upgraded events
    const logs = await provider.getLogs({
      address: proxyAddress,
      topics: [UPGRADED_EVENT_SIGNATURE],
      fromBlock: 0,
      toBlock: "latest",
    })

    if (logs.length === 0) {
      console.warn(`⚠️  No Upgraded events found for ${proxyAddress}`)
      return null
    }

    // Get the latest upgrade event (last in the array)
    const latestLog = logs[logs.length - 1]

    // Implementation address is in topics[1]
    if (latestLog.topics.length < 2) {
      console.warn(`⚠️  Invalid Upgraded event format for ${proxyAddress}`)
      return null
    }

    // Extract address from topics[1] (remove leading zeros and 0x prefix, then add 0x back)
    const implementationAddress = ethers.getAddress(`0x${latestLog.topics[1].slice(-40)}`)

    console.log(`✅ Found implementation address: ${implementationAddress}`)
    return implementationAddress
  } catch (error) {
    console.error(`❌ Error querying implementation address for ${proxyAddress}:`, error)
    return null
  }
}

/**
 * Verify a single contract
 */
async function verifyContract(
  address: string,
  contractName: string,
  isProxy: boolean = false,
): Promise<VerificationResult> {
  console.log(`\n${"=".repeat(80)}`)
  console.log(`Verifying ${contractName}${isProxy ? " (Proxy)" : ""} at ${address}...`)
  console.log("=".repeat(80))

  try {
    const verifyScriptPath = path.join(__dirname, "verify-contract.ts")

    // First try exact match
    try {
      execSync(`ts-node "${verifyScriptPath}" "${address}" ${network} "${contractName}"`, {
        stdio: "inherit",
        env: { ...process.env, VITE_APP_ENV: network },
      })
      console.log(`✅ Successfully verified ${contractName}`)
      return { address, name: contractName, success: true }
    } catch (error) {
      // If exact match fails, try partial match
      console.log("Exact match failed, trying partial match...")
      execSync(`ts-node "${verifyScriptPath}" "${address}" ${network} "${contractName}" --partial-match`, {
        stdio: "inherit",
        env: { ...process.env, VITE_APP_ENV: network },
      })
      console.log(`✅ Successfully verified ${contractName} (partial match)`)
      return { address, name: contractName, success: true }
    }
  } catch (error) {
    console.error(`❌ Failed to verify ${contractName}`)
    return { address, name: contractName, success: false, error: String(error) }
  }
}

/**
 * Verify a proxy and its implementation
 */
async function verifyProxyAndImplementation(
  proxyAddress: string,
  implementationAddress: string,
  contractName: string,
): Promise<VerificationResult[]> {
  const results: VerificationResult[] = []

  // Verify proxy
  console.log("\n📦 Verifying proxy contract...")
  results.push(await verifyContract(proxyAddress, "B3TRProxy", true))

  // Verify implementation
  console.log("\n📄 Verifying implementation contract...")
  results.push(await verifyContract(implementationAddress, contractName, false))

  return results
}

/**
 * Main verification process
 */
async function main() {
  const allResults: VerificationResult[] = []

  // ===========================================
  // 1. Verify B3TR Governor Libraries
  // ===========================================
  console.log("\n" + "=".repeat(80))
  console.log("📚 VERIFYING B3TR GOVERNOR LIBRARIES")
  console.log("=".repeat(80))

  const governorLibraries = [
    { address: config.b3trGovernorLibraries.governorClockLogicAddress, name: "GovernorClockLogic" },
    { address: config.b3trGovernorLibraries.governorConfiguratorAddress, name: "GovernorConfigurator" },
    { address: config.b3trGovernorLibraries.governorDepositLogicAddress, name: "GovernorDepositLogic" },
    {
      address: config.b3trGovernorLibraries.governorFunctionRestrictionsLogicAddress,
      name: "GovernorFunctionRestrictionsLogic",
    },
    { address: config.b3trGovernorLibraries.governorProposalLogicAddressAddress, name: "GovernorProposalLogic" },
    { address: config.b3trGovernorLibraries.governorQuorumLogicAddress, name: "GovernorQuorumLogic" },
    { address: config.b3trGovernorLibraries.governorStateLogicAddress, name: "GovernorStateLogic" },
    { address: config.b3trGovernorLibraries.governorVotesLogicAddress, name: "GovernorVotesLogic" },
  ]

  for (const lib of governorLibraries) {
    allResults.push(await verifyContract(lib.address, lib.name))
  }

  // ===========================================
  // 2. Verify Passport Libraries
  // ===========================================
  console.log("\n" + "=".repeat(80))
  console.log("📚 VERIFYING PASSPORT LIBRARIES")
  console.log("=".repeat(80))

  const passportLibraries = [
    { address: config.passportLibraries.passportChecksLogicAddress, name: "PassportChecksLogic" },
    { address: config.passportLibraries.passportConfiguratorAddress, name: "PassportConfigurator" },
    { address: config.passportLibraries.passportEntityLogicAddress, name: "PassportEntityLogic" },
    { address: config.passportLibraries.passportDelegationLogicAddress, name: "PassportDelegationLogic" },
    { address: config.passportLibraries.passportPersonhoodLogicAddress, name: "PassportPersonhoodLogic" },
    { address: config.passportLibraries.passportPoPScoreLogicAddress, name: "PassportPoPScoreLogic" },
    { address: config.passportLibraries.passportSignalingLogicAddress, name: "PassportSignalingLogic" },
    {
      address: config.passportLibraries.passportWhitelistAndBlacklistLogicAddress,
      name: "PassportWhitelistAndBlacklistLogic",
    },
  ]

  for (const lib of passportLibraries) {
    allResults.push(await verifyContract(lib.address, lib.name))
  }

  // ===========================================
  // 3. Verify Main Contracts (Proxies + Implementations)
  // ===========================================
  console.log("\n" + "=".repeat(80))
  console.log("📦 VERIFYING MAIN CONTRACTS")
  console.log("=".repeat(80))

  const contracts = [
    { proxy: config.vot3ContractAddress, name: "VOT3" },
    { proxy: config.b3trGovernorAddress, name: "B3TRGovernor" },
    { proxy: config.galaxyMemberContractAddress, name: "GalaxyMember" },
    { proxy: config.x2EarnAppsContractAddress, name: "X2EarnApps" },
    { proxy: config.veBetterPassportContractAddress, name: "VeBetterPassport" },
    { proxy: config.emissionsContractAddress, name: "Emissions" },
    { proxy: config.timelockContractAddress, name: "TimeLock" },
    { proxy: config.xAllocationPoolContractAddress, name: "XAllocationPool" },
    { proxy: config.xAllocationVotingContractAddress, name: "XAllocationVoting" },
    { proxy: config.voterRewardsContractAddress, name: "VoterRewards" },
    { proxy: config.treasuryContractAddress, name: "Treasury" },
    { proxy: config.x2EarnRewardsPoolContractAddress, name: "X2EarnRewardsPool" },
    { proxy: config.x2EarnCreatorContractAddress, name: "X2EarnCreator" },
    { proxy: config.grantsManagerContractAddress, name: "GrantsManager" },
  ]

  for (const contract of contracts) {
    // Try to get implementation address dynamically from the Upgraded event
    let implementationAddress = await getImplementationAddress(contract.proxy)

    // Fallback to static implementations mapping if dynamic fetch fails
    if (!implementationAddress) {
      console.log(`⚠️  Could not fetch implementation dynamically, trying static mapping...`)
      implementationAddress = implementations[contract.proxy]
    }

    if (!implementationAddress) {
      console.warn(`⚠️  Warning: No implementation address found for ${contract.name} (${contract.proxy})`)
      console.warn(`   Skipping verification for this contract. Please update contract-implementations.ts`)
      continue
    }

    const results = await verifyProxyAndImplementation(contract.proxy, implementationAddress, contract.name)
    allResults.push(...results)
  }

  // ===========================================
  // Summary
  // ===========================================
  console.log("\n" + "=".repeat(80))
  console.log("📊 VERIFICATION SUMMARY")
  console.log("=".repeat(80))

  const successful = allResults.filter(r => r.success).length
  const failed = allResults.filter(r => !r.success).length
  const total = allResults.length

  console.log(`\nTotal contracts: ${total}`)
  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed > 0) {
    console.log("\n❌ Failed verifications:")
    allResults
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.name} (${r.address})`)
      })
  }

  console.log("\n" + "=".repeat(80))
  console.log("🎉 Verification process completed!")
  console.log("=".repeat(80) + "\n")

  // Exit with error code if any verifications failed
  if (failed > 0) {
    process.exit(1)
  }
}

// Run the script
main().catch(error => {
  console.error("\n❌ Fatal error during verification:", error)
  process.exit(1)
})
