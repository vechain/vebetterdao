import { getConfig } from "@repo/config"
import { Emissions__factory } from "../../typechain-types"
import { ethers } from "hardhat"

/**
 * Starts a new round of emissions.
 *
 * @throws if the round cannot be started.
 */
const startRound = async () => {
  const [signer] = await ethers.getSigners()

  await Emissions__factory.connect(getConfig().emissionsContractAddress, signer).distribute()
}

startRound()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error starting the round:", error)
    process.exit(1)
  })
