import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "../../typechain-types"
import { ethers } from "hardhat"
import fs from "fs/promises"

type Owner = {
  owner: string
  tokenId: string
}

/**
 * Starts a new round of emissions.
 *
 * @throws if the round cannot be started.
 */
const getGmOwners = async () => {
  const [signer] = await ethers.getSigners()

  const galaxyMember = GalaxyMember__factory.connect(getConfig().galaxyMemberContractAddress, signer)

  const totalSupply = await galaxyMember.totalSupply()

  const owners: Owner[] = []

  for (let i = 1; i <= Number(totalSupply) + 1; i++) {
    console.log(`Getting owner of token ${i}`)
    try {
      const owner = await galaxyMember.ownerOf(i)
      owners.push({ owner, tokenId: i.toString() })
    } catch (e) {
      console.log(`Token ${i} does not exist or has been burned`)
    }
  }

  const ownerSet = new Map<string, boolean>()

  const ownersSet: Owner[] = []

  for (const owner of owners) {
    if (!ownerSet.has(owner.owner)) {
      ownerSet.set(owner.owner, true)
      ownersSet.push(owner)
    }
  }

  // Save the owners to a file
  await fs.writeFile("gmOwners.json", JSON.stringify({ recipients: ownersSet }, null, 2))
}

getGmOwners()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error starting the round:", error)
    process.exit(1)
  })
