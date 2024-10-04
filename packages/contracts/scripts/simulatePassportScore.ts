import { EnvConfig } from "@repo/config/contracts"
import * as path from "path"
import {
  appDetails,
  convertBytesToAddress,
  getCurrentRoundId,
  getRoundIdForBlock,
  getRounds,
  RewardDistributedEvent,
  AllocationVoteCastEvent,
  UserCumulativeScoreMap,
  RoundInfo,
  securityLevelMultiplier,
} from "./helpers/passportSimulation"
import { createReadStream } from "fs"
import { parser } from "stream-json"
import { streamArray } from "stream-json/streamers/StreamArray"

// Define the environment variable
const env = process.env.NEXT_PUBLIC_APP_ENV as EnvConfig
if (!env) throw new Error("NEXT_PUBLIC_APP_ENV env variable must be set")

// Configuration Constants
const roundsForCumulativeScore = 5 // Number of rounds to consider for cumulative score
const decayRate = 20 // Decay rate in percentage
const scalingFactor = 1e18 // Scaling factor for score calculation
const thresholds = [100, 150, 200, 300] // Thresholds to simulate against

const userMapInfo = new Map<string, { scores: Map<number, number>; actions: number; votes: number }>()

/**
 * Main execution function.
 * This function reads the reward events and round information, calculates user scores and cumulative scores,
 * and displays the results for different thresholds.
 * It also simulates the decay of cumulative scores over rounds.
 */
async function main() {
  console.log(`[${env}] Simulating Passport Score...`)

  // Fetch current round ID and relevant rounds
  const currentRoundId = await getCurrentRoundId()
  const rounds = await getRounds({ currentRoundId, amountOfRoundsToFetch: roundsForCumulativeScore })

  console.log(rounds)

  // Process voting events using streaming
  await processFileStream("./votingEvents.json", data => countVote(data, rounds))
  // Process reward events using streaming
  await processFileStream("./rewardEvents.json", data => countActions(data, rounds))

  // Simulating against multiple thresholds
  for (const threshold of thresholds) {
    const userCumulativeScores = calculateCumulativeScores(userMapInfo, currentRoundId)

    console.log(
      `---------------SIMULATION WITH THRESHOLD ${threshold} --- ${roundsForCumulativeScore} Round(s) -----------------`,
    )
    displayResults(userCumulativeScores, threshold)
    console.log("-------------------------------END----------------------------")
    console.log("\n")
  }
  console.log("Simulation completed.")
  process.exit(0)
}

/**
 * Calculate the cumulative score for all users with decay applied.
 * @param _userMapInfo Map of user scores and action counts for each round.
 * @param currentRound The current round.
 * @returns Map of user addresses to cumulative scores and action counts.
 */
function calculateCumulativeScores(
  _userMapInfo: Map<string, { scores: Map<number, number>; actions: number; votes: number }>,
  currentRound: number,
): UserCumulativeScoreMap {
  const cumulativeScores = new Map<string, { cumulativeScore: number; actions: number; votes: number }>()

  _userMapInfo.forEach(({ scores, actions, votes }, user) => {
    const cumulativeScore = applyDecay(scores, currentRound)
    cumulativeScores.set(user, { cumulativeScore, actions, votes })
  })

  return cumulativeScores
}

/**
 * Apply decay to calculate cumulative scores over rounds.
 * @param roundScores Map of round scores for a user.
 * @param currentRound The current round.
 * @returns The cumulative score for the user.
 */
function applyDecay(roundScores: Map<number, number>, currentRound: number): number {
  const startingRound = currentRound <= roundsForCumulativeScore ? 1 : currentRound - roundsForCumulativeScore
  if (startingRound < 1) throw new Error("Invalid starting round")

  let cumulativeScore = 0
  const decayFactor = ((100 - decayRate) * scalingFactor) / 100

  for (let round = startingRound; round <= currentRound; round++) {
    const roundScore = roundScores.get(round) || 0

    cumulativeScore = roundScore + Math.floor((cumulativeScore * decayFactor) / scalingFactor)
  }

  return cumulativeScore
}

/**
 * Display the simulation results in a table format.
 */
function displayResults(userCumulativeScores: UserCumulativeScoreMap, threshold: number) {
  const totalUsers = userCumulativeScores.size
  const totalRewardsUsers = Array.from(userCumulativeScores.values()).filter(user => user.actions > 0)
  const totalVoters = Array.from(userCumulativeScores.values()).filter(user => user.votes > 0)
  const intersectionUsers = Array.from(userCumulativeScores.values()).filter(user => user.actions > 0 && user.votes > 0)
  const percentageIntersectionOverRewards =
    totalRewardsUsers.length > 0 ? ((intersectionUsers.length / totalRewardsUsers.length) * 100).toFixed(2) : "0.00"
  const percentageIntersectionOverVoters =
    totalVoters.length > 0 ? ((intersectionUsers.length / totalVoters.length) * 100).toFixed(2) : "0.00"

  const intersectionMeetingThreshold = Array.from(intersectionUsers.values()).filter(
    user => user.cumulativeScore >= threshold,
  )
  const usersMeetingThreshold = Array.from(userCumulativeScores.values()).filter(
    ({ cumulativeScore }) => cumulativeScore >= threshold,
  )
  const usersNotMeetingThreshold = Array.from(userCumulativeScores.entries()).filter(
    ([, { cumulativeScore }]) => cumulativeScore < threshold,
  )

  const firstCloseUser = usersNotMeetingThreshold.sort(([, a], [, b]) => b.cumulativeScore - a.cumulativeScore)[0]

  console.table([
    {
      Description: "Closest User to Threshold",
      Address: firstCloseUser ? firstCloseUser[0] : "None",
      Score: firstCloseUser ? firstCloseUser[1].cumulativeScore : "N/A",
      Actions: firstCloseUser ? firstCloseUser[1].actions : "N/A",
      Votes: firstCloseUser ? firstCloseUser[1].votes : "N/A",
    },
  ])

  console.table([
    {
      Description: `Users Meeting or Exceeding Threshold (${threshold})`,
      Value: usersMeetingThreshold.length,
      Percentage: `${((usersMeetingThreshold.length / totalUsers) * 100).toFixed(2)}%`,
    },
    {
      Description: `Users Not Meeting Threshold (${threshold})`,
      Value: totalUsers - usersMeetingThreshold.length,
      Percentage: `${(((totalUsers - usersMeetingThreshold.length) / totalUsers) * 100).toFixed(2)}%`,
    },
    {
      Description: "Intersection (Users who have both Rewards and Voted)",
      Value: intersectionUsers.length,
      Percentage: `${((intersectionUsers.length / totalUsers) * 100).toFixed(2)}%`,
    },
    {
      Description: `Intersection Meeting or Exceeding Threshold (${threshold})`,
      Value: intersectionMeetingThreshold.length,
      Percentage: `${((intersectionMeetingThreshold.length / totalUsers) * 100).toFixed(2)}%`,
    },
    {
      Description: "Total Users (Rewards + Voters)",
      Value: totalUsers,
    },
    {
      Description: "Total Rewards Users",
      Value: totalRewardsUsers.length,
    },
    {
      Description: "Total Voters",
      Value: totalVoters.length,
    },
    {
      Description: "Intersection / Total Rewards Users (%)",
      Percentage: `${percentageIntersectionOverRewards}%`,
    },
    {
      Description: "Intersection / Total Voters (%)",
      Percentage: `${percentageIntersectionOverVoters}%`,
    },
  ])
}

async function countActions(event: RewardDistributedEvent, rounds: RoundInfo[]) {
  const blockNumber = Number(event?.Log?.meta?.blockNumber)
  const roundId = getRoundIdForBlock(blockNumber, rounds)
  if (!roundId) return

  const appId = convertBytesToAddress(event.Args.appId)
  const appDetail = appDetails[appId]
  if (!appDetail) throw new Error(`App details not found for id ${event.Args.appId}`)

  const score = securityLevelMultiplier[appDetail.securityLevel]
  const user = event.Args.receiver

  if (!userMapInfo.has(user)) {
    userMapInfo.set(user, { scores: new Map<number, number>(), actions: 0, votes: 0 })
  }

  const userData = userMapInfo.get(user)!
  userData.scores.set(roundId, (userData.scores.get(roundId) || 0) + score)

  userData.actions += 1 // Increment the action count
}

/**
 * Callback function to count votes from voting events.
 */
async function countVote(event: AllocationVoteCastEvent, rounds: RoundInfo[]) {
  const blockNumber = Number(event?.Log?.meta?.blockNumber)
  const roundId = getRoundIdForBlock(blockNumber, rounds)
  if (!roundId) return

  const user = event.Args.voter
  if (!userMapInfo.has(user)) {
    userMapInfo.set(user, { scores: new Map<number, number>(), actions: 0, votes: 0 })
  }

  const userData = userMapInfo.get(user)!
  userData.votes += 1 // Increment the vote count
}

/**
 * Processes a JSON file as a stream, invoking the callback for each data item.
 *
 * @param fileName - Name of the JSON file to process.
 * @param callbackFn - Callback function to handle each data item.
 * @param rounds - Optional RoundInfo array, if needed by the callback.
 */
function processFileStream(
  fileName: string,
  callbackFn: (data: any, rounds?: RoundInfo[]) => void,
  rounds?: RoundInfo[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, fileName)
    console.log("Reading file from:", filePath)

    const readStream = createReadStream(filePath, { encoding: "utf8" })

    // Initialize the JSON parser and streamer
    const jsonParser = parser()
    const jsonStreamer = streamArray()

    // Pipe the read stream into the JSON parser and streamer
    readStream.pipe(jsonParser).pipe(jsonStreamer)

    jsonStreamer.on("data", ({ key, value }) => {
      try {
        callbackFn(value, rounds)
      } catch (callbackError) {
        console.error(`Error processing item at index ${key}:`, callbackError)
      }
    })

    jsonStreamer.on("end", () => {
      console.log("All events processed successfully.")
      resolve()
    })

    jsonStreamer.on("error", err => {
      console.error("Error during stream processing:", err)
      reject(err)
    })

    readStream.on("error", err => {
      console.error("Error reading the file stream:", err)
      reject(err)
    })
  })
}

// Execute the main function and handle errors
main().catch(error => {
  console.error(error)
  process.exit(1)
})
