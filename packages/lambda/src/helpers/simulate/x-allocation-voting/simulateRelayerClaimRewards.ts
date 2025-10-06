import { getConfig } from "@repo/config"
import { ThorClient } from "@vechain/sdk-network"
import {
  isRegisteredRelayer,
  claimRewardForRelayer,
  isRoundRewardsClaimableForRelayer,
  rewardsClaimableForRelayer,
} from "./methods/relayers"
import path from "path"
import dotenv from "dotenv"
import { ethers, BigNumberish } from "ethers"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getTestKeys } from "../../../../../contracts/scripts/helpers/seedAccounts"

const simulateRoundClaimRewards = async () => {
  console.log("🚀 Starting round simulation for auto-voting: claim rewards for relayer")

  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(5) // Grab the first 5 accounts
  const relayer = accounts[1]

  const roundId = process.argv[2]
  if (!roundId) {
    throw new Error("Round ID is required")
  }

  const isRegistered = await isRegisteredRelayer(thorClient, config, relayer)
  if (!isRegistered) {
    console.log("Relayer not registered: ", relayer.address.toString())
    return
  }

  const isRoundRewardsClaimable = await isRoundRewardsClaimableForRelayer(thorClient, config, roundId)
  if (!isRoundRewardsClaimable) {
    console.log("Round rewards are not claimable: ", roundId)
    return
  }

  const claimableAmount = await rewardsClaimableForRelayer(thorClient, config, relayer, roundId)
  await claimRewardForRelayer(thorClient, config, relayer, roundId)
  console.log(
    `Claimed ${ethers.formatEther(claimableAmount as BigNumberish)} B3TR for relayer ${relayer.address.toString()} in round ${roundId}`,
  )
}

simulateRoundClaimRewards()
