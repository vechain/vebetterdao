import fs from "fs/promises"

// Constants for tokenomics configuration
const INITIAL_EMISSIONS: number = 2_000_000
const X_ALLOCATIONS_DECAY_PERCENTAGE: number = 4
const VOTE_2_EARN_DECAY_PERCENTAGE: number = 20
const VOTE_2_EARN_MINIMUM_PERCENTAGE: number = 20
const X_ALLOCATIONS_DECAY_CYCLES: number = 12
const VOTE_2_EARN_DECAY_CYCLES: number = 50
const TREASURY_PERCENTAGE: number = 25
const MAX_SUPPLY: number = 1_000_000_000
const PRE_MINT_TREASURY_ALLOCATION: number = 1_750_000
const PRE_MINT_X_ALLOCATION: number = 1_000_000
const PRE_MINT_VOTE_2_EARN_ALLOCATION: number = 1_000_000

// Path to save the generated tokenomics
const PATH = "./test/fixture/b3trAllocations.json"

/**
 * Interface for the token allocations.
 * Each allocation represents the distribution of tokens for a given cycle.
 */
interface Allocation {
  cycle: number
  xAllocation: number
  vote2EarnAllocation: number
  treasuryAllocation: number
}

/**
 * Saves the given allocations to a file in JSON format.
 * @param allocations Array of Allocation objects to save.
 * @param filename Name of the file to save the allocations to.
 */
async function saveAllocationsToFile(allocations: Allocation[], path: string): Promise<void> {
  await fs.writeFile(path, JSON.stringify(allocations, null, 2))
  console.log(`Cycles' allocations saved to ${path}`)
}

/**
 * Generates token allocations and saves them to a JSON file.
 */
async function generateAndSaveB3trAllocations(): Promise<void> {
  try {
    const xAllocations = await generateB3trAllocations()
    console.log("Cycles' allocations being generated and saved to file...")
    await saveAllocationsToFile(xAllocations, PATH)
  } catch (error) {
    console.error("Error generating or saving tokenomics:", error)
    process.exit(1)
  }
}

/**
 * Generates token allocations based on predetermined decay cycles and percentages.
 * @returns A Promise that resolves to an array of Allocation objects.
 */
async function generateB3trAllocations(): Promise<Allocation[]> {
  const xAllocations: Allocation[] = []

  let b3trSupply: number = PRE_MINT_TREASURY_ALLOCATION + PRE_MINT_X_ALLOCATION + PRE_MINT_VOTE_2_EARN_ALLOCATION
  let cycle: number = 0

  while (b3trSupply <= MAX_SUPPLY) {
    const xAllocation: number = calculateXAllocation(cycle)
    const vote2EarnMultiplier: number = calculateVote2EarnMultiplier(cycle)
    const vote2EarnAllocation: number =
      xAllocation * Math.max(vote2EarnMultiplier, VOTE_2_EARN_MINIMUM_PERCENTAGE / 100)
    const treasuryAllocation: number = (xAllocation + vote2EarnAllocation) * (TREASURY_PERCENTAGE / 100)

    xAllocations.push({ cycle, xAllocation, vote2EarnAllocation, treasuryAllocation })

    b3trSupply += xAllocation + vote2EarnAllocation + treasuryAllocation
    cycle++
  }

  return xAllocations
}

/**
 * Calculates the X Allocation for a given cycle.
 * @param cycle The current cycle number.
 * @returns The calculated X Allocation.
 */
function calculateXAllocation(cycle: number): number {
  const result =
    INITIAL_EMISSIONS * (1 - X_ALLOCATIONS_DECAY_PERCENTAGE / 100) ** Math.floor(cycle / X_ALLOCATIONS_DECAY_CYCLES)

  return Math.round(result * 1e6) / 1e6
}

/**
 * Calculates the Vote to Earn multiplier for a given cycle.
 * @param cycle The current cycle number.
 * @returns The calculated Vote to Earn multiplier.
 */
function calculateVote2EarnMultiplier(cycle: number): number {
  return 1 - (VOTE_2_EARN_DECAY_PERCENTAGE / 100) * Math.floor(cycle / VOTE_2_EARN_DECAY_CYCLES)
}

// Generate and save B3TR Allocations
generateAndSaveB3trAllocations()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error("Error generating allocations:", error)
    process.exit(1)
  })
