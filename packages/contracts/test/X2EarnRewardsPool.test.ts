import { ethers } from "hardhat"
import { expect } from "chai"
import {
  ZERO_ADDRESS,
  bootstrapAndStartEmissions,
  bootstrapEmissions,
  catchRevert,
  createProposalAndExecuteIt,
  filterEventsByName,
  getOrDeployContractInstances,
  getVot3Tokens,
  parseAppAddedEvent,
  startNewAllocationRound,
  waitForCurrentRoundToEnd,
  waitForRoundToEnd,
} from "./helpers"
import { describe, it } from "mocha"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"

describe("X2EarnRewardsPool", function () {
  // deployment
  describe("Deployment", function () {
    it("Should deploy the contract", async function () {
      const { x2EarnRewardsPool } = await getOrDeployContractInstances({ forceDeploy: true })
      expect(await x2EarnRewardsPool.getAddress()).to.not.equal(ZERO_ADDRESS)
    })

    it("Should set B3TR correctly", async function () {
      const { x2EarnRewardsPool, b3tr } = await getOrDeployContractInstances({ forceDeploy: false })
      expect(await x2EarnRewardsPool.b3tr()).to.not.equal(await b3tr.getAddress())
    })

    it("Version should be set correctly", async function () {
      const { x2EarnRewardsPool } = await getOrDeployContractInstances({ forceDeploy: false })
      expect(await x2EarnRewardsPool.version()).to.equal("1")
    })

    it("X2EarnApps should be set correctly", async function () {
      const { x2EarnRewardsPool, x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: false })
      expect(await x2EarnRewardsPool.x2EarnApps()).to.equal(await x2EarnApps.getAddress())
    })
  })
  // upgradeability
  // deposit
  // withdraw
  // distributeRewards
})
