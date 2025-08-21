import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { B3TRGovernor, XAllocationVoting } from "../typechain-types"

// Helper function to fetch events in chunks
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

  // Conditional logging function
  const log = (...args: any[]) => {
    console.log(...args)
  }

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

async function investigateWithdrawDeposits() {
  console.log("🔍 Starting investigation of pre-v8 deposits that cannot be withdrawn...")

  const env = process.env.NEXT_PUBLIC_APP_ENV as EnvConfig
  if (!env) {
    throw new Error("Environment variable NEXT_PUBLIC_APP_ENV is not set.")
  }

  console.log(`Environment: ${env}`)
  const config = getConfig(env)

  // Connect to contracts
  const governor = (await ethers.getContractAt("B3TRGovernor", config.b3trGovernorAddress)) as B3TRGovernor
  const xAllocationVoting = (await ethers.getContractAt(
    "XAllocationVoting",
    config.xAllocationVotingContractAddress,
  )) as XAllocationVoting

  console.log(`B3TR Governor Address: ${await governor.getAddress()}`)
  console.log(`XAllocationVoting Address: ${await xAllocationVoting.getAddress()}`)

  const latestBlock = 18868871
  const latestBlockTimestamp = (await ethers.provider.getBlock(latestBlock))?.timestamp

  console.log(`Latest Block: ${latestBlock}`)
  console.log(`Latest Block Timestamp: ${latestBlockTimestamp}`)

  // get all the proposals events
  console.log("\n🔍 Fetching ProposalCreated events...")
  const proposals = await fetchEventsInChunks(governor, governor.filters.ProposalCreated(), 0, latestBlock, 100000)
  console.log(`✅ Retrieved ${proposals.length} ProposalCreated events`)

  const chronologicalProposals: {
    proposalId: string
    roundId: number
  }[] = []

  proposals.forEach(proposal => {
    if (proposal.args) {
      chronologicalProposals.push({
        proposalId: proposal.args[0].toString(), // proposalId is the first argument
        roundId: Number(proposal.args[7]), // roundIdVoteStart is the 8th argument (index 7)
      })
    }
  })

  console.log(`\n📋 Found ${chronologicalProposals.length} Proposals:`)
  console.log("Proposal ID\t\t\t\t\t\t\t\tRound ID")
  console.log("-".repeat(80))

  chronologicalProposals.forEach((proposal, index) => {
    console.log(`${index + 1}. ${proposal.proposalId}\t${proposal.roundId}`)
  })

  console.log(`\n📊 Summary: ${chronologicalProposals.length} total proposals found`)
}

// Execute the investigation
investigateWithdrawDeposits()
  .then(() => {
    console.log("✅ Investigation completed successfully!")
    process.exit(0)
  })
  .catch(error => {
    console.error("❌ Investigation failed:", error)
    process.exit(1)
  })
