import { ethers, network } from "hardhat"
import { getConfig } from "@repo/config"
import { B3TRGovernor, B3TRGovernor__factory } from "../../typechain-types"
import { readFileSync, writeFileSync } from "fs"
import BigNumber from "bignumber.js"
const config = getConfig()
const VERBOSE = true

// Conditional logging function
const log = (...args: any[]) => {
  if (VERBOSE) {
    console.log(...args)
  }
}

const stuckDeposits: { walletAddress: string; proposalId: string; depositAmount: string }[] = []

const getUserDeposit = async (walletAddress: string, proposalId: string) => {
  const [signer] = await ethers.getSigners()

  const deposit = await B3TRGovernor__factory.connect(config.b3trGovernorAddress!, signer).getUserDeposit(
    proposalId,
    walletAddress,
  )
  if (deposit.toString() !== "0") {
    stuckDeposits.push({
      walletAddress,
      proposalId,
      depositAmount: deposit.toString(),
    })
    writeFileSync("stuckDeposits.json", JSON.stringify(stuckDeposits, null, 2))
    log(
      `💰 User ${walletAddress} has ${BigNumber(deposit.toString()).dividedBy("1e18").toFixed(4)} B3TR stuck in proposal ${proposalId}`,
    )
  }
  return deposit
}

// Helper function to fetch events in blocks chunks
async function fetchEventsInChunks(
  contract: any,
  filter: any,
  fromBlock: number,
  toBlock: number,
  chunkSize: number = 100000,
): Promise<any[]> {
  const allEvents: any[] = []
  let currentBlock = fromBlock
  const totalBlocks = toBlock - fromBlock + 1
  let processedBlocks = 0

  log(`    📊 Processing ${totalBlocks} blocks in chunks of ${chunkSize}...`)

  while (currentBlock <= toBlock) {
    const endChunk = Math.min(currentBlock + chunkSize - 1, toBlock)
    const chunkBlocks = endChunk - currentBlock + 1
    processedBlocks += chunkBlocks

    const progress = ((processedBlocks / totalBlocks) * 100).toFixed(1)
    log(`    📡 [${progress}%] Fetching events from block ${currentBlock} to ${endChunk}...`)

    const events = await contract.queryFilter(filter, currentBlock, endChunk)
    allEvents.push(...events)

    if (events.length > 0) {
      log(`    ✅ Found ${events.length} events in this chunk`)
    }

    currentBlock = endChunk + 1
  }

  return allEvents
}

export async function main() {
  const startTime = Date.now()

  // Display startup banner
  log(`\n${"=".repeat(80)}`)
  log(`🔍 B3TR GOVERNANCE STUCK DEPOSITS ANALYSIS`)
  log(`${"=".repeat(80)}`)
  log(`🔗 Network: ${network.name}`)
  log(`📋 Environment: ${config.environment}`)
  log(`🏛️ Governor Address: ${config.b3trGovernorAddress}`)

  // Environment variables
  const startBlock = 18868871 // B3TRGovernor was deployed at 18,868,871, but only on 19,820,936 (V4 Upgrade) the withdraw event was added
  const currentBlock = await ethers.provider.getBlockNumber()
  const endBlock = currentBlock

  log(`📊 Block Range: ${startBlock.toLocaleString()} → ${endBlock.toLocaleString()}`)
  log(`📈 Total Blocks to Analyze: ${(endBlock - startBlock).toLocaleString()}`)
  log(`${"=".repeat(80)}`)

  // Get contract instances
  const b3trGovernor = (await ethers.getContractAt("B3TRGovernor", config.b3trGovernorAddress!)) as B3TRGovernor

  const depositEventFilter = b3trGovernor.filters.ProposalDeposit()
  const proposalCreatedEventFilter = b3trGovernor.filters.ProposalCreated()

  // Step 1: Fetch all relevant events in parallel
  log(`\n📊 Step 1: Fetching blockchain events...`)
  const [depositEvents, proposalCreatedEvents] = await Promise.all([
    fetchEventsInChunks(b3trGovernor, depositEventFilter, startBlock, endBlock, 100000),
    fetchEventsInChunks(b3trGovernor, proposalCreatedEventFilter, startBlock, endBlock, 100000),
  ])

  log(`✅ Deposit Events Found: ${depositEvents.length}`)
  log(`✅ Proposal Created Events Found: ${proposalCreatedEvents.length}`)

  // Step 2: Process and organize events by depositor
  log(`\n📊 Step 2: Processing and organizing events by depositor...`)

  const uniqueDepositors = new Set<string>()
  const proposalIds: string[] = []

  // Extract unique depositors
  for (const event of depositEvents) {
    const depositorAddress = event.args.depositor.toLowerCase()
    uniqueDepositors.add(depositorAddress)
  }

  // Extract all proposal IDs
  for (const event of proposalCreatedEvents) {
    proposalIds.push(event.args.proposalId.toString())
  }

  log(`👥 Found ${uniqueDepositors.size} unique depositors`)
  log(`📋 Found ${proposalIds.length} total proposals`)

  // Check each depositor against each proposal for stuck deposits
  log(`\n🔍 Step 3: Analyzing stuck deposits...`)
  let processedCount = 0
  const totalChecks = uniqueDepositors.size * proposalIds.length

  for (const depositorAddress of uniqueDepositors) {
    for (const proposalId of proposalIds) {
      await getUserDeposit(depositorAddress, proposalId)
      processedCount++

      if (processedCount % 100 === 0) {
        const progress = ((processedCount / totalChecks) * 100).toFixed(1)
        log(`⏳ Progress: ${progress}% (${processedCount}/${totalChecks} checks completed)`)
      }
    }
  }

  // Calculate and display summary
  const summary = await calculateStuckDepositsSummary()

  const executionTime = (Date.now() - startTime) / 1000
  log(`\n⏱️  EXECUTION TIME: ${executionTime.toFixed(2)}s (${(executionTime / 60).toFixed(2)} minutes)`)

  return summary
}

interface StuckDepositSummary {
  totalStuckAmount: string
  totalStuckAmountFormatted: string
  stuckDepositsCount: number
  affectedWallets: number
  affectedProposals: number
}

const calculateStuckDepositsSummary = async (): Promise<StuckDepositSummary> => {
  try {
    const stuckDepositsData = await readFileSync("stuckDeposits.json", "utf8")
    const stuckDepositsArray = JSON.parse(stuckDepositsData)

    // Calculate total stuck amount in wei
    const totalStuckAmountWei = stuckDepositsArray.reduce((acc: BigNumber, item: { depositAmount: string }) => {
      return acc.plus(new BigNumber(item.depositAmount))
    }, new BigNumber(0))

    // Get unique wallets and proposals affected
    const uniqueWallets = new Set(stuckDepositsArray.map((item: { walletAddress: string }) => item.walletAddress))
    const uniqueProposals = new Set(stuckDepositsArray.map((item: { proposalId: string }) => item.proposalId))

    const summary: StuckDepositSummary = {
      totalStuckAmount: totalStuckAmountWei.toString(),
      totalStuckAmountFormatted: totalStuckAmountWei.dividedBy("1e18").toFixed(4),
      stuckDepositsCount: stuckDepositsArray.length,
      affectedWallets: uniqueWallets.size,
      affectedProposals: uniqueProposals.size,
    }

    // Display comprehensive summary
    log(`\n${"=".repeat(60)}`)
    log(`📊 STUCK DEPOSITS ANALYSIS SUMMARY`)
    log(`${"=".repeat(60)}`)
    log(`💰 Total Stuck Amount: ${summary.totalStuckAmountFormatted} B3TR`)
    log(`📈 Total Stuck Deposits: ${summary.stuckDepositsCount}`)
    log(`👥 Affected Wallets: ${summary.affectedWallets}`)
    log(`📋 Affected Proposals: ${summary.affectedProposals}`)
    log(`💾 Data saved to: stuckDeposits.json`)
    log(`${"=".repeat(60)}`)

    return summary
  } catch (error) {
    log(`❌ Error calculating stuck deposits summary: ${error}`)
    return {
      totalStuckAmount: "0",
      totalStuckAmountFormatted: "0",
      stuckDepositsCount: 0,
      affectedWallets: 0,
      affectedProposals: 0,
    }
  }
}

// Execute the analysis
main().catch(console.error)
