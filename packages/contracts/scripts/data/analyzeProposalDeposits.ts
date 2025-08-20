import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"

interface DepositEvent {
  depositor: string
  proposalId: string
  amount: bigint
  blockNumber: number
  transactionHash: string
}

interface WithdrawEvent {
  withdrawer: string
  proposalId: string
  amount: bigint
  blockNumber: number
  transactionHash: string
}

interface ProposalAnalysis {
  proposalId: string
  totalDeposited: bigint
  totalWithdrawn: bigint
  remainingToWithdraw: bigint
  depositors: {
    [address: string]: {
      deposited: bigint
      withdrawn: bigint
      remaining: bigint
    }
  }
}

/**
 * Script to analyze ProposalDeposit and ProposalWithdraw events
 * Identifies remaining withdrawable amounts per address per proposal
 */
async function analyzeProposalDeposits() {
  console.log("🔍 Starting analysis of proposal deposits and withdrawals...")

  // Get environment config
  const envName = (process.env.NEXT_PUBLIC_APP_ENV as EnvConfig) || "testnet-staging"
  const config = getConfig(envName)
  console.log(`📋 Using config for environment: ${envName}`)
  console.log(`🏛️  B3TR Governor address: ${config.b3trGovernorAddress}`)

  try {
    // Get the B3TRGovernor contract instance
    const b3trGovernor = await ethers.getContractAt("B3TRGovernor", config.b3trGovernorAddress)
    console.log("✅ Connected to B3TRGovernor contract")

    // Get the current block number to determine range
    const latestBlock = await ethers.provider.getBlockNumber()
    console.log(`📦 Latest block: ${latestBlock}`)

    console.log("🔄 Querying ProposalDeposit events...")
    // Query all ProposalDeposit events
    const depositFilter = b3trGovernor.filters.ProposalDeposit()
    const depositEvents = await b3trGovernor.queryFilter(depositFilter, 0, latestBlock)
    console.log(`💰 Found ${depositEvents.length} deposit events`)

    console.log("🔄 Querying ProposalWithdraw events...")
    // ProposalWithdraw event is not exposed in IB3TRGovernor interface, so we query by event signature
    // event ProposalWithdraw(address indexed withdrawer, uint256 indexed proposalId, uint256 amount)
    const withdrawEventSignature = "ProposalWithdraw(address,uint256,uint256)"
    const withdrawEventTopic = ethers.id(withdrawEventSignature)

    const withdrawLogs = await ethers.provider.getLogs({
      address: config.b3trGovernorAddress,
      topics: [withdrawEventTopic],
      fromBlock: 0,
      toBlock: latestBlock,
    })

    // Parse the withdraw events manually
    const withdrawEvents = withdrawLogs.map(log => {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256"], // amount (non-indexed)
        log.data,
      )
      return {
        args: {
          withdrawer: ethers.getAddress("0x" + log.topics[1].slice(26)), // Remove 0x and leading zeros
          proposalId: BigInt(log.topics[2]),
          amount: decoded[0],
        },
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      }
    })
    console.log(`💸 Found ${withdrawEvents.length} withdraw events`)

    // Process deposit events
    const deposits: DepositEvent[] = depositEvents.map(event => ({
      depositor: event.args.depositor,
      proposalId: event.args.proposalId.toString(),
      amount: event.args.amount,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }))

    // Process withdraw events
    const withdrawals: WithdrawEvent[] = withdrawEvents.map(event => ({
      withdrawer: event.args.withdrawer,
      proposalId: event.args.proposalId.toString(),
      amount: event.args.amount,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }))

    console.log("📊 Analyzing deposits and withdrawals by proposal...")

    // Group by proposalId and analyze
    const proposalAnalyses: { [proposalId: string]: ProposalAnalysis } = {}

    // Process deposits
    for (const deposit of deposits) {
      if (!proposalAnalyses[deposit.proposalId]) {
        proposalAnalyses[deposit.proposalId] = {
          proposalId: deposit.proposalId,
          totalDeposited: 0n,
          totalWithdrawn: 0n,
          remainingToWithdraw: 0n,
          depositors: {},
        }
      }

      const analysis = proposalAnalyses[deposit.proposalId]
      analysis.totalDeposited += deposit.amount

      if (!analysis.depositors[deposit.depositor]) {
        analysis.depositors[deposit.depositor] = {
          deposited: 0n,
          withdrawn: 0n,
          remaining: 0n,
        }
      }

      analysis.depositors[deposit.depositor].deposited += deposit.amount
    }

    // Process withdrawals
    for (const withdrawal of withdrawals) {
      if (!proposalAnalyses[withdrawal.proposalId]) {
        // This shouldn't happen if data is consistent, but handle gracefully
        console.warn(`⚠️  Found withdrawal for proposal ${withdrawal.proposalId} without corresponding deposits`)
        continue
      }

      const analysis = proposalAnalyses[withdrawal.proposalId]
      analysis.totalWithdrawn += withdrawal.amount

      if (!analysis.depositors[withdrawal.withdrawer]) {
        // This shouldn't happen if data is consistent, but handle gracefully
        console.warn(
          `⚠️  Found withdrawal by ${withdrawal.withdrawer} for proposal ${withdrawal.proposalId} without corresponding deposit`,
        )
        analysis.depositors[withdrawal.withdrawer] = {
          deposited: 0n,
          withdrawn: 0n,
          remaining: 0n,
        }
      }

      analysis.depositors[withdrawal.withdrawer].withdrawn += withdrawal.amount
    }

    // Calculate remaining amounts
    for (const proposalId in proposalAnalyses) {
      const analysis = proposalAnalyses[proposalId]

      for (const address in analysis.depositors) {
        const depositor = analysis.depositors[address]
        depositor.remaining = depositor.deposited - depositor.withdrawn
      }

      analysis.remainingToWithdraw = analysis.totalDeposited - analysis.totalWithdrawn
    }

    // Display results
    console.log("\n" + "=".repeat(80))
    console.log("📋 PROPOSAL DEPOSITS AND WITHDRAWALS ANALYSIS")
    console.log("=".repeat(80))

    let totalWithdrawableFound = false

    for (const proposalId in proposalAnalyses) {
      const analysis = proposalAnalyses[proposalId]

      // Only show proposals that have remaining withdrawable amounts
      const hasRemainingFunds = analysis.remainingToWithdraw > 0n
      const addressesWithFunds = Object.entries(analysis.depositors).filter(([, data]) => data.remaining > 0n)

      if (hasRemainingFunds && addressesWithFunds.length > 0) {
        totalWithdrawableFound = true

        console.log(`\n📝 Proposal ID: ${proposalId}`)
        console.log(`💰 Total Deposited: ${ethers.formatEther(analysis.totalDeposited)} B3TR`)
        console.log(`💸 Total Withdrawn: ${ethers.formatEther(analysis.totalWithdrawn)} B3TR`)
        console.log(`🏦 Remaining to Withdraw: ${ethers.formatEther(analysis.remainingToWithdraw)} B3TR`)
        console.log(`👥 Addresses with withdrawable funds:`)

        for (const [address, data] of addressesWithFunds) {
          console.log(`   🔹 ${address}`)
          console.log(`      Deposited: ${ethers.formatEther(data.deposited)} B3TR`)
          console.log(`      Withdrawn: ${ethers.formatEther(data.withdrawn)} B3TR`)
          console.log(`      Remaining: ${ethers.formatEther(data.remaining)} B3TR`)
        }
        console.log("-".repeat(60))
      }
    }

    if (!totalWithdrawableFound) {
      console.log("\n✅ No remaining withdrawable funds found across all proposals!")
      console.log("All depositors have successfully withdrawn their deposits.")
    }

    // Summary statistics
    const totalProposals = Object.keys(proposalAnalyses).length
    const proposalsWithFunds = Object.values(proposalAnalyses).filter(p => p.remainingToWithdraw > 0n).length
    const totalRemainingAcrossAll = Object.values(proposalAnalyses).reduce((sum, p) => sum + p.remainingToWithdraw, 0n)

    console.log("\n" + "=".repeat(80))
    console.log("📊 SUMMARY STATISTICS")
    console.log("=".repeat(80))
    console.log(`📝 Total Proposals Analyzed: ${totalProposals}`)
    console.log(`🏦 Proposals with Remaining Funds: ${proposalsWithFunds}`)
    console.log(`💰 Total Remaining Across All Proposals: ${ethers.formatEther(totalRemainingAcrossAll)} B3TR`)
    console.log(`📈 Total Deposit Events: ${deposits.length}`)
    console.log(`📉 Total Withdraw Events: ${withdrawals.length}`)
  } catch (error) {
    console.error("❌ Error analyzing proposal deposits:", error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  analyzeProposalDeposits()
    .then(() => {
      console.log("\n✅ Analysis completed successfully!")
      process.exit(0)
    })
    .catch(error => {
      console.error("❌ Script failed:", error)
      process.exit(1)
    })
}

export { analyzeProposalDeposits }
