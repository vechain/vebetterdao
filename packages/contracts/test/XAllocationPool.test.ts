import { ethers } from "hardhat"
import { expect } from "chai"
import {
  calculateBaseAllocationOffChain,
  calculateVariableAppAllocationOffCahain,
  getOrDeployContractInstances,
  getVot3Tokens,
  startNewAllocationRound,
  waitForProposalToBeActive,
  waitForVotingPeriodToEnd,
} from "./helpers"
import { describe, it } from "mocha"

describe("X-Allocation Pool", async function () {
  describe("Allocation rewards for x-apps", async function () {
    it("Allocation rewards are calculated correctly", async function () {
      const { xAllocationVoting, otherAccounts, owner, xAllocationPool, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const voter1 = otherAccounts[1]
      await getVot3Tokens(voter1, "1000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, "My app", "")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app #2", "")

      //Start allocation round
      const round1 = await startNewAllocationRound(xAllocationVoting)
      // Vote
      await waitForProposalToBeActive(round1, xAllocationVoting)
      await xAllocationVoting
        .connect(voter1)
        .castVote(round1, [app1Id, app2Id], [ethers.parseEther("100"), ethers.parseEther("900")])

      await waitForVotingPeriodToEnd(round1, xAllocationVoting)
      let state = await xAllocationVoting.state(round1)
      expect(state).to.eql(BigInt(3))

      let appShares = await xAllocationPool.calculateAppShares(round1, app1Id)
      expect(appShares).to.eql(1000n)

      appShares = await xAllocationPool.calculateAppShares(round1, app2Id)
      // should be capped to 15%
      let maxCapPercentage = await xAllocationPool.scaledAppSharesCap()
      expect(appShares).to.eql(maxCapPercentage)

      // Calculate base allocations
      let baseAllocationAmount = await xAllocationPool.baseAllocationAmount(round1)
      const expectedBaseAllocation = await calculateBaseAllocationOffChain(
        round1,
        emissions,
        xAllocationVoting,
        xAllocationPool,
      )

      expect(baseAllocationAmount).to.eql(expectedBaseAllocation)

      let expectedVariableAllcoation = await calculateVariableAppAllocationOffCahain(
        round1,
        app1Id,
        emissions,
        xAllocationPool,
      )
      let sharesAllocationAmount = await xAllocationPool.sharesAllocationAmount(round1, round1, app1Id)
      expect(sharesAllocationAmount).to.eql(expectedVariableAllcoation)

      // Calculate allocation rewards
      let allocationRewards = await xAllocationPool.calculateAllocationRewards(round1, round1, app1Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffCahain(
        round1,
        app1Id,
        emissions,
        xAllocationPool,
      )
      expect(allocationRewards).to.eql(expectedBaseAllocation + expectedVariableAllcoation)

      allocationRewards = await xAllocationPool.calculateAllocationRewards(round1, round1, app2Id)
      expectedVariableAllcoation = await calculateVariableAppAllocationOffCahain(
        round1,
        app2Id,
        emissions,
        xAllocationPool,
      )
      expect(allocationRewards).to.eql(expectedBaseAllocation + expectedVariableAllcoation)
    })
  })
})
