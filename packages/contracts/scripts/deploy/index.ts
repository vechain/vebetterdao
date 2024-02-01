// We recommend this pattern to be able to use async/await everywhere

import { deployAll } from "./deploy"

// and properly handle errors.
const execute = async () => {
  const contracts = await deployAll()
  console.log(contracts)
}

execute()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
