import { readFileSync, writeFileSync } from "fs"
import { ethers } from "hardhat"
import BigNumber from "bignumber.js"
import { B3TRGovernor__factory } from "../../../typechain-types"
import { getConfig } from "@repo/config"
import { log } from "console"

const config = getConfig()

export async function clean() {
  const [signer] = await ethers.getSigners()

  const moneyStuck = readFileSync("./scripts/data/remainingProposalDeposits/raw/moneyStuck.json", "utf8")
  const moneyStuckArray = JSON.parse(moneyStuck)

  const moneyStuckCleared: {
    walletAddress: string
    totalDepositAmount: string
    proposalIds: string[]
    correspondingRoundIds: string[]
  }[] = []

  for (const user of moneyStuckArray) {
    const depositer = user.walletAddress
    const depositAmount = user.deposit
    const roundId = await B3TRGovernor__factory.connect(config.b3trGovernorAddress!, signer).proposalStartRound(
      user.proposalId,
    ) // claimable deposit round

    const index = moneyStuckCleared.findIndex(item => item.walletAddress === depositer)
    if (index === -1) {
      moneyStuckCleared.push({
        walletAddress: depositer,
        totalDepositAmount: new BigNumber(depositAmount).toFixed(),
        proposalIds: [user.proposalId],
        correspondingRoundIds: [roundId.toString()],
      })
      continue
    }

    // convert string to bigNumber
    const depositAmountBigNumber = new BigNumber(depositAmount)

    // add the depositAmount to the totalDepositAmount
    const totalDepositAmount = new BigNumber(moneyStuckCleared[index].totalDepositAmount).plus(depositAmountBigNumber)

    // update the totalDepositAmount (use toFixed to avoid scientific notation)
    moneyStuckCleared[index].totalDepositAmount = totalDepositAmount.toFixed()

    // for each proposalId, we look the roundId ( getRoundStart ), and add it to the correspondingRoundId array
    moneyStuckCleared[index].correspondingRoundIds.push(roundId.toString())

    // update the proposalIds
    moneyStuckCleared[index].proposalIds.push(user.proposalId)

    // sanitize the wallet address
    moneyStuckCleared[index].walletAddress = moneyStuckCleared[index].walletAddress.toLowerCase()
  }

  // Validate and analyze data before seeding
  console.log("=== CLEANING AND VALIDATING DATA ===")
  const validationResults = await validateWalletsForSeeding(moneyStuckCleared)

  moneyStuckCleared.forEach((user, index) => {
    const formattedAmount = new BigNumber(user.totalDepositAmount).dividedBy("1e18").toFixed(4)
    const validation = validationResults[user.walletAddress]

    log(`${index + 1}. Wallet: ${user.walletAddress}`)
    log(`   Total Stuck: ${formattedAmount} B3TR (${user.totalDepositAmount} wei)`)
    log(`   ProposalsNo: ${user.proposalIds.length}`)
    log(`   Proposals: ${user.proposalIds.join(", ")}`)
    log(`   RoundsNo: ${user.correspondingRoundIds.length}`)
    log(`   Rounds: ${user.correspondingRoundIds.join(", ")}`)

    // Validation status
    console.log(`   🔍 Validation: ${validation.isValid ? "✅ SAFE" : "❌ RISKY"}`)
    if (!validation.isValid) {
      console.log(`   ⚠️  Issues: ${validation.issues.join(", ")}`)
    }
    console.log(`   📊 Risk Score: ${validation.riskScore}/8`)
    console.log("")
  })
  // Generate safety report for seeding
  const safeWallets = moneyStuckCleared.filter(wallet => validationResults[wallet.walletAddress].isValid)
  const riskyWallets = moneyStuckCleared.filter(wallet => !validationResults[wallet.walletAddress].isValid)

  console.log(`\n📋 SEEDING SAFETY REPORT:`)
  console.log(`   ✅ Safe Wallets: ${safeWallets.length}`)
  console.log(`   ❌ Risky Wallets: ${riskyWallets.length}`)

  if (riskyWallets.length > 0) {
    console.log(`\n⚠️  RISKY WALLETS TO REVIEW:`)
    riskyWallets.forEach((wallet, index) => {
      const validation = validationResults[wallet.walletAddress]
      const amount = new BigNumber(wallet.totalDepositAmount).dividedBy("1e18").toFixed(4)
      console.log(`   ${index + 1}. ${wallet.walletAddress} (${amount} B3TR)`)
      console.log(`      Issues: ${validation.issues.join(", ")}`)
      console.log(`      Risk Score: ${validation.riskScore}/8`)
    })
  }

  // Save both full data and safe-only data
  writeFileSync(
    "./scripts/data/remainingProposalDeposits/cleaned/stuckDeposits.json",
    JSON.stringify(moneyStuckCleared, null, 2),
  )

  console.log(`\n💾 Files saved:`)
  console.log(`   - stuckDeposits.json (all wallets)`)
}

interface WalletValidation {
  isValid: boolean
  riskScore: number
  issues: string[]
  checks: {
    hasValidAddress: boolean
    hasReasonableAmount: boolean
    isNotContract: boolean
  }
}

// Comprehensive wallet validation for seeding safety
async function validateWalletsForSeeding(
  wallets: {
    walletAddress: string
    totalDepositAmount: string
    proposalIds: string[]
    correspondingRoundIds: string[]
  }[],
): Promise<Record<string, WalletValidation>> {
  const results: Record<string, WalletValidation> = {}

  for (const wallet of wallets) {
    const validation: WalletValidation = {
      isValid: true,
      riskScore: 0,
      issues: [],
      checks: {
        hasValidAddress: false,
        hasReasonableAmount: false,
        isNotContract: false,
      },
    }

    // Check 1: Valid Ethereum address format
    try {
      ethers.getAddress(wallet.walletAddress)
      validation.checks.hasValidAddress = true
    } catch {
      validation.issues.push("Invalid address format")
      validation.riskScore += 3
    }

    // Check 2: Reasonable deposit amount (not suspiciously high/low)
    const amountInB3TR = new BigNumber(wallet.totalDepositAmount).dividedBy("1e18")
    if (amountInB3TR.isGreaterThan(10000)) {
      // > 10k B3TR
      validation.issues.push("Suspiciously high amount")
      validation.riskScore += 2
    } else {
      validation.checks.hasReasonableAmount = true
    }

    // Check 3: Not a contract (EOA check)
    try {
      const code = await ethers.provider.getCode(wallet.walletAddress)
      if (code === "0x") {
        validation.checks.isNotContract = true
      } else {
        validation.issues.push("Address is a contract")
        validation.riskScore += 3
      }
    } catch {
      validation.issues.push("Could not verify contract status")
      validation.riskScore += 3
    }

    // Final validation
    validation.isValid =
      validation.riskScore <= 3 &&
      validation.checks.hasValidAddress &&
      validation.checks.hasReasonableAmount &&
      validation.checks.isNotContract
    results[wallet.walletAddress] = validation
  }

  // Summary statistics
  const totalWallets = wallets.length
  const validWallets = Object.values(results).filter(v => v.isValid).length
  const highRiskWallets = Object.values(results).filter(v => v.riskScore >= 3).length // out of 8

  console.log(`\n🔍 VALIDATION SUMMARY:`)
  console.log(`   Total Wallets: ${totalWallets}`)
  console.log(`   Safe for Seeding: ${validWallets} (${((validWallets / totalWallets) * 100).toFixed(1)}%)`)
  console.log(`   High Risk: ${highRiskWallets} (${((highRiskWallets / totalWallets) * 100).toFixed(1)}%)`)
  console.log(`   ⚠️  Review high-risk wallets before seeding!\n`)

  return results
}
