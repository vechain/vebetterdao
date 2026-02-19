import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import type { B3TR, VOT3, XAllocationVoting, VoterRewards } from "@vechain/vebetterdao-contracts/typechain-types"
import { loadConfig } from "./config"
import { seed } from "./seed"
import { advanceRounds } from "./rounds"

async function main() {
  const start = performance.now()
  const simConfig = loadConfig()

  console.log("\n╔══════════════════════════════════════╗")
  console.log("║        SIMULATION STARTING           ║")
  console.log("╚══════════════════════════════════════╝")
  console.log(JSON.stringify(simConfig, null, 2))

  // Get contracts
  const config = getConfig()
  const b3tr = (await ethers.getContractAt("B3TR", config.b3trContractAddress)) as unknown as B3TR
  const vot3 = (await ethers.getContractAt("VOT3", config.vot3ContractAddress)) as unknown as VOT3
  const xAllocationVoting = (await ethers.getContractAt(
    "XAllocationVoting",
    config.xAllocationVotingContractAddress,
  )) as unknown as XAllocationVoting
  const voterRewards = (await ethers.getContractAt(
    "VoterRewards",
    config.voterRewardsContractAddress,
  )) as unknown as VoterRewards

  // Seed accounts
  const seedAccts = await seed(simConfig, b3tr, vot3)

  // Advance rounds
  await advanceRounds(simConfig, seedAccts, b3tr, vot3, xAllocationVoting, voterRewards)

  console.log("\n╔══════════════════════════════════════╗")
  console.log(`║  SIMULATION COMPLETE (${((performance.now() - start) / 1000).toFixed(1)}s)`.padEnd(39) + "║")
  console.log("╚══════════════════════════════════════╝")
}

main()
