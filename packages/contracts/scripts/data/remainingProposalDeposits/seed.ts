import { readFileSync } from "fs"
// import { ethers } from "hardhat"

export async function seedDepositVotingPower() {
  // const [signer] = await ethers.getSigners()

  const data = readFileSync("./scripts/data/remainingProposalDeposits/cleaned/stuckDeposits.json", "utf8")
  const dataArray = JSON.parse(data)
  // for each account, idea is to call the function seedDepositVotingPower up to the amount of b3tr they have in totalAmount

  for (const account of dataArray) {
    console.log({ walletAddress: account.walletAddress, totalDepositAmount: account.totalDepositAmount })

    // check all the potential error :
    // 1. seeder have the upgraderRole ?

    // we call the seedDepositVotingPower in B3trGovernor contract to seed them all
    // batch the calls to avoid gas limit errors
    // for each account seed, we double check the amount of b3tr they have in the contract
  }
}
