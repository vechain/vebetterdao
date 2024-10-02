import { EnvConfig } from "@repo/config/contracts"
import * as path from "path"
import {
  appDetails,
  convertBytesToAddress,
  getCurrentRoundId,
  getRoundIdForBlock,
  getRounds,
  RewardDistributedEvent,
  RoundInfo,
  securityLevelMultiplier,
} from "./helpers/passportSimulation"
import { readFile } from "fs/promises"

// Define the environment variable
const env = process.env.NEXT_PUBLIC_APP_ENV as EnvConfig
if (!env) throw new Error("NEXT_PUBLIC_APP_ENV env variable must be set")

// Configuration Constants
const roundsForCumulativeScore = 5 // Number of rounds to consider for cumulative score
const decayRate = 20 // Decay rate in percentage
const scalingFactor = 1e18 // Scaling factor for score calculation
const thresholds = [100, 200, 300, 400] // Thresholds to simulate against

/**
 * Main execution function.
 * This function reads the reward events and round information, calculates user scores and cumulative scores,
 * and displays the results for different thresholds.
 * It also simulates the decay of cumulative scores over rounds.
 */
async function main() {
  console.log(`[${env}] Simulating Passport Score...`)

  const events = await readData("./rewardEvents.json")
  const currentRoundId = await getCurrentRoundId()
  const rounds = await getRounds({ currentRoundId, amountOfRoundsToFetch: roundsForCumulativeScore })

  console.log(rounds)

  //Simulating against multiple thresholds
  for (const threshold of thresholds) {
    const userScoresPerRound = calculateUserScores(events, rounds)
    const userCumulativeScores = calculateCumulativeScores(userScoresPerRound, currentRoundId)

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
 * Calculate the user scores and action count for each round.
 * @param events Reward events.
 * @param rounds Round information.
 * @returns Map of user addresses to their scores and action counts.
 */
function calculateUserScores(
  events: RewardDistributedEvent[],
  rounds: RoundInfo[],
): Map<string, { scores: Map<number, number>; actions: number }> {
  const userScores = new Map<string, { scores: Map<number, number>; actions: number }>()

  for (const event of events) {
    const roundId = getRoundIdForBlock(Number(event.Log.meta.blockNumber), rounds)
    if (!roundId) continue

    const appDetail = appDetails[convertBytesToAddress(event.Args.appId)]
    if (!appDetail) throw new Error(`App details not found for id ${event?.Args?.appId}`)

    const score = securityLevelMultiplier[appDetail.securityLevel]
    updateScore(userScores, event.Args.receiver, roundId, score)
  }

  return userScores
}

/**
 * Calculate the cumulative score for all users with decay applied.
 * @param userScores Map of user scores and action counts for each round.
 * @param currentRound The current round.
 * @returns Map of user addresses to cumulative scores and action counts.
 */
function calculateCumulativeScores(
  userScores: Map<string, { scores: Map<number, number>; actions: number }>,
  currentRound: number,
): Map<string, { cumulativeScore: number; actions: number }> {
  const cumulativeScores = new Map<string, { cumulativeScore: number; actions: number }>()

  userScores.forEach(({ scores, actions }, user) => {
    const cumulativeScore = applyDecay(scores, currentRound)
    cumulativeScores.set(user, { cumulativeScore, actions })
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
 * Update the score and action count for a user and round in the Map.
 */
function updateScore(
  userScores: Map<string, { scores: Map<number, number>; actions: number }>,
  user: string,
  round: number,
  score: number,
) {
  if (!userScores.has(user)) {
    userScores.set(user, { scores: new Map<number, number>(), actions: 0 })
  }

  const userData = userScores.get(user)!
  userData.scores.set(round, (userData.scores.get(round) || 0) + score)

  userData.actions += 1 // Increment the action count
}

/**
 * Display the simulation results in a table format.
 */
function displayResults(
  userCumulativeScores: Map<string, { cumulativeScore: number; actions: number }>,
  threshold: number,
) {
  const totalUsers = userCumulativeScores.size
  const usersMeetingThreshold = Array.from(userCumulativeScores.values()).filter(
    ({ cumulativeScore }) => cumulativeScore >= threshold,
  )
  const usersNotMeetingThreshold = Array.from(userCumulativeScores.entries()).filter(
    ([, { cumulativeScore }]) => cumulativeScore < threshold,
  )

  const firstCloseUser = usersNotMeetingThreshold.sort(([, a], [, b]) => b.cumulativeScore - a.cumulativeScore)[0]

  const leaderboard = getLeaderboard(userCumulativeScores)

  console.table(leaderboard)

  console.table([
    {
      Description: "Closest User to Threshold",
      Address: firstCloseUser ? firstCloseUser[0] : "None",
      Score: firstCloseUser ? firstCloseUser[1].cumulativeScore : "N/A",
      Actions: firstCloseUser ? firstCloseUser[1].actions : "N/A",
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
      Description: "Total Users",
      Value: totalUsers,
    },
  ])
}

/**
 * Get the leaderboard of users with the highest cumulative scores and action counts.
 * @param userCumulativeScores Map of user addresses to cumulative scores and action counts.
 * @param leaderboardSize Number of users to include in the leaderboard.
 * @returns Array of user objects with address, score, and action count.
 */
function getLeaderboard(
  userCumulativeScores: Map<string, { cumulativeScore: number; actions: number }>,
  leaderboardSize: number = 10,
) {
  return Array.from(userCumulativeScores.entries())
    .sort(([, a], [, b]) => b.cumulativeScore - a.cumulativeScore)
    .slice(0, leaderboardSize)
    .map(([address, { cumulativeScore, actions }]) => ({
      address,
      cumulativeScore,
      actions,
    }))
}

/**
 * Read reward events from a JSON file.
 * @param filePath Path to the JSON file.
 * @returns Array of reward events.
 */
async function readData(filePath: string): Promise<RewardDistributedEvent[]> {
  const absolutePath = path.join(__dirname, filePath)
  const fileData = await readFile(absolutePath, { encoding: "utf-8" })
  if (!fileData) throw new Error("No data found in the file")

  const events: RewardDistributedEvent[] = JSON.parse(fileData)
  console.info(`Loaded ${events.length} reward events.`)

  return events
}

// Execute the main function and handle errors
main().catch(error => {
  console.error(error)
  process.exit(1)
})
