import { ethers } from "hardhat"
import { XAllocationVoting } from "../../typechain-types"
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"

// Define the environment variable
const env = process.env.NEXT_PUBLIC_APP_ENV as EnvConfig
if (!env) throw new Error("NEXT_PUBLIC_APP_ENV env variable must be set")

const config = getConfig()

/** ------------------------ TYPES -------------------------- **/

export enum XAppsSecurityLevel {
  NONE = "NONE",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export type AppDetails = {
  name: string
  securityLevel: XAppsSecurityLevel
}

export type RewardDistributedEvent = {
  Args: {
    appId: number[]
    amount: number
    receiver: string
  }
  Log: {
    meta: {
      blockID: string
      blockNumber: number
      blockTimestamp: number
    }
  }
}

export type RoundInfo = {
  roundId: number
  startBlock: number
  endBlock: number
}

/** ------------------------ CONSTANTS -------------------------- **/

// Mapping of App IDs to App Details (Name and Security Level)
export const appDetails: { [key: string]: AppDetails } = {
  "0x2fc30c2ad41a2994061efaf218f1d52dc92bc4a31a0f02a4916490076a7a393a": {
    name: "Mugshot",
    securityLevel: XAppsSecurityLevel.MEDIUM,
  },
  "0x899de0d0f0b39e484c8835b2369194c4c102b230c813862db383d44a4efe14d3": {
    name: "Cleanify",
    securityLevel: XAppsSecurityLevel.MEDIUM,
  },
  "0x9643ed1637948cc571b23f836ade2bdb104de88e627fa6e8e3ffef1ee5a1739a": {
    name: "GreenCart",
    securityLevel: XAppsSecurityLevel.MEDIUM,
  },
  "0x821a9ae30590c7c11e0ebc03b27902e8cae0f320ad27b0f5bde9f100eebcb5a7": {
    name: "GreenAmbassador",
    securityLevel: XAppsSecurityLevel.MEDIUM,
  },
  "0xcd9f16381818b575a55661602638102b2b8497a202bb2497bb2a3a2cd438e85d": {
    name: "Oily",
    securityLevel: XAppsSecurityLevel.MEDIUM,
  },
  "0x6c977a18d427360e27c3fc2129a6942acd4ece2c8aaeaf4690034931dc5ba7f9": {
    name: "EvEarn",
    securityLevel: XAppsSecurityLevel.LOW,
  },
  "0xa30ddd53895674f3517ed4eb8f7261a4287ec1285fdd13b1c19a1d7009e5b7e3": {
    name: "Vyvo",
    securityLevel: XAppsSecurityLevel.HIGH,
  },
  "0x74133534672eca50a67f8b20bf17dd731b70d83f0a12e3500fca0793fca51c7d": {
    name: "NFBC",
    securityLevel: XAppsSecurityLevel.LOW,
  },
  "0xe19c5e83670576cac1cee923e1f92990387bf701af06ff3e0c5f1be8d265c478": {
    name: "Carboneers",
    securityLevel: XAppsSecurityLevel.MEDIUM,
  },
}
// Security Level Multiplier
export const securityLevelMultiplier: { [key in XAppsSecurityLevel]: number } = {
  [XAppsSecurityLevel.NONE]: 0,
  [XAppsSecurityLevel.LOW]: 100,
  [XAppsSecurityLevel.MEDIUM]: 200,
  [XAppsSecurityLevel.HIGH]: 400,
}

/** ------------------------ HELPERS -------------------------- **/

// Module-level variables to hold singleton instances
let xAllocationVotingInstance: XAllocationVoting | null = null

/**
 * Gets the singleton instance of XAllocationVoting contract.
 */
async function getXAllocationVoting(): Promise<XAllocationVoting> {
  if (!xAllocationVotingInstance) {
    try {
      xAllocationVotingInstance = (await ethers.getContractAt(
        "XAllocationVoting",
        config.xAllocationVotingContractAddress,
      )) as XAllocationVoting
      console.log("XAllocationVoting contract instance created.")
    } catch (error) {
      console.error("Failed to initialize XAllocationVoting contract:", error)
      throw error
    }
  }
  return xAllocationVotingInstance
}

export function convertBytesToAddress(numbers: number[]): string {
  const byteArray = Uint8Array.from(numbers)
  return ethers.hexlify(byteArray)
}

/**
 * Get the current round ID.
 **/
export async function getCurrentRoundId(): Promise<number> {
  const xAllocationVoting = await getXAllocationVoting()
  const currentRoundId = await xAllocationVoting.currentRoundId()
  return Number(currentRoundId)
}

/**
@param currentRoundId The current round ID.
@param amountOfRoundsToFetch The number of rounds to fetch.
@returns Round information array.
 */
export async function getRounds({
  currentRoundId,
  amountOfRoundsToFetch,
}: {
  currentRoundId: number
  amountOfRoundsToFetch: number
}): Promise<RoundInfo[]> {
  // Retrieve contract instances
  const xAllocationVoting = await getXAllocationVoting()

  const startingRoundId = currentRoundId <= amountOfRoundsToFetch ? 1 : currentRoundId - amountOfRoundsToFetch
  if (startingRoundId < 1) throw new Error("Invalid starting round ID")
  // Retrieve all round information
  const rounds: RoundInfo[] = []
  for (let roundId = startingRoundId; roundId <= currentRoundId; roundId++) {
    const roundStartBlock = Number(await xAllocationVoting.roundSnapshot(roundId))
    const roundEndBlock = Number(await xAllocationVoting.roundDeadline(roundId))
    rounds.push({
      roundId,
      startBlock: roundStartBlock,
      endBlock: roundEndBlock,
    })
  }
  return rounds
}

/**
 * Get Round Id for the given block number based on the start and end block of each round.
 * @param blockNumber Block number.
 * @param rounds Array of round information.
 * @returns Round ID for the given block number.
 */
export function getRoundIdForBlock(blockNumber: number, rounds: RoundInfo[]): number | null {
  for (const round of rounds) {
    if (blockNumber >= round.startBlock && blockNumber <= round.endBlock) {
      return round.roundId
    }
  }
  return null
}
