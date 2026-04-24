import { getConfig } from "@repo/config"
import { Emissions__factory } from "../../typechain-types"
import { ethers } from "hardhat"
import { moveBlocks } from "../../test/helpers"

/**
 * Mints blocks on the local Thor solo node (which runs in --on-demand mode)
 * by sending dummy VET transfers, until the chain reaches the block at which
 * the next emissions cycle (round) can start.
 *
 * Does NOT call `Emissions.distribute()` — only advances the block height.
 */
const advanceToNextRound = async () => {
  const [signer] = await ethers.getSigners()

  const emissions = Emissions__factory.connect(getConfig().emissionsContractAddress, signer)

  const currentCycle = await emissions.getCurrentCycle()
  const nextCycleBlock = await emissions.getNextCycleBlock()
  const currentBlock = await ethers.provider.getBlockNumber()

  const blocksToMint = Number(nextCycleBlock) - currentBlock

  console.log(`Current cycle: ${currentCycle}`)
  console.log(`Current block: ${currentBlock}`)
  console.log(`Next cycle block: ${nextCycleBlock}`)

  if (blocksToMint <= 0) {
    console.log("Already at or past the next cycle block. Nothing to mint.")
    return
  }

  console.log(`Minting ${blocksToMint} block(s) via VTHO transfers...`)
  await moveBlocks(blocksToMint)

  const newBlock = await ethers.provider.getBlockNumber()
  console.log(`Reached block ${newBlock}. Next round can now be started.`)
}

advanceToNextRound()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error advancing to next round:", error)
    process.exit(1)
  })
