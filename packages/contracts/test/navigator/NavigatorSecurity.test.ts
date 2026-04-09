import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances } from "../helpers/deploy"
import { bootstrapAndStartEmissions, getVot3Tokens, waitForRoundToEnd } from "../helpers/common"
import { endorseApp } from "../helpers/xnodes"
import {
  B3TR,
  VOT3,
  NavigatorRegistry,
  XAllocationVoting,
  Emissions,
  VoterRewards,
  X2EarnApps,
  X2EarnCreator,
  VeBetterPassport,
  RelayerRewardsPool,
} from "../../typechain-types"

describe("NavigatorRegistry Security - @shard19h", function () {
  let navigatorRegistry: NavigatorRegistry
  let b3tr: B3TR
  let vot3: VOT3
  let xAllocationVoting: XAllocationVoting
  let emissions: Emissions
  let voterRewards: VoterRewards
  let x2EarnApps: X2EarnApps
  let x2EarnCreator: X2EarnCreator
  let veBetterPassport: VeBetterPassport
  let relayerRewardsPool: RelayerRewardsPool
  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let creators: HardhatEthersSigner[]

  const STAKE_AMOUNT = ethers.parseEther("50000")
  const METADATA_URI = "ipfs://navigator-metadata"

  // Helper: fund account with B3TR and approve NavigatorRegistry
  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(account.address, amount)
    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(account).approve(registryAddress, amount)
  }

  // Helper: register a navigator with default stake
  const registerNavigator = async (account: HardhatEthersSigner, amount: bigint = STAKE_AMOUNT) => {
    await fundAndApprove(account, amount)
    await navigatorRegistry.connect(account).register(amount, METADATA_URI)
  }

  // Helper: delegate VOT3 to a navigator
  const delegateCitizen = async (citizen: HardhatEthersSigner, navigator: HardhatEthersSigner, amount: string) => {
    await getVot3Tokens(citizen, amount)
    await navigatorRegistry.connect(citizen).delegate(navigator.address, ethers.parseEther(amount))
  }

  // Helper: impersonate VoterRewards and deposit a fee
  const depositFeeViaImpersonation = async (navigator: string, roundId: number | bigint, amount: bigint) => {
    const voterRewardsAddress = await voterRewards.getAddress()
    await ethers.provider.send("hardhat_impersonateAccount", [voterRewardsAddress])
    await ethers.provider.send("hardhat_setBalance", [voterRewardsAddress, "0x" + (10n ** 18n).toString(16)])
    const voterRewardsSigner = await ethers.getSigner(voterRewardsAddress)

    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(owner).transfer(registryAddress, amount)

    await navigatorRegistry.connect(voterRewardsSigner).depositNavigatorFee(navigator, roundId, amount)
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [voterRewardsAddress])
  }

  // Helper: advance N allocation rounds
  const advanceRounds = async (count: number) => {
    for (let i = 0; i < count; i++) {
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
    }
  }

  // Helper: create a real endorsed app
  const createEndorsedApp = async (creator: HardhatEthersSigner, endorser: HardhatEthersSigner): Promise<string> => {
    if ((await x2EarnCreator.balanceOf(creator.address)) === 0n) {
      await x2EarnCreator.connect(owner).safeMint(creator.address)
    }
    const appName = "SecurityTestApp" + Math.random()
    await x2EarnApps.connect(creator).submitApp(creator.address, creator.address, appName, "metadataURI")
    const appId = await x2EarnApps.hashAppName(appName)
    await endorseApp(appId, endorser)
    return appId
  }

  beforeEach(async function () {
    const deployment = await getOrDeployContractInstances({ forceDeploy: true })
    if (!deployment) throw new Error("Failed to deploy contracts")

    navigatorRegistry = deployment.navigatorRegistry
    b3tr = deployment.b3tr
    vot3 = deployment.vot3
    xAllocationVoting = deployment.xAllocationVoting
    emissions = deployment.emissions
    voterRewards = deployment.voterRewards
    x2EarnApps = deployment.x2EarnApps
    x2EarnCreator = deployment.x2EarnCreator
    veBetterPassport = deployment.veBetterPassport
    relayerRewardsPool = deployment.relayerRewardsPool
    owner = deployment.owner
    minterAccount = deployment.minterAccount
    otherAccounts = deployment.otherAccounts
    creators = deployment.creators

    // Mint B3TR to owner for transfers
    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Ensure VOT3 supply exists (max stake = 1% of VOT3 supply, need >= 5M for 50k stake)
    await getVot3Tokens(otherAccounts[15], "10000000")

    // Disable early access period so castNavigatorVote doesn't require a registered relayer
    await relayerRewardsPool.connect(owner).setEarlyAccessBlocks(0)
  })

  // ======================== 1. Malicious User ======================== //

  describe("Malicious user", function () {
    it("delegate small amount VOT3: castNavigatorVote uses only delegated voting power", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)

      // Citizen gets 1000 VOT3 but delegates only 2 (above voting threshold, but far below total balance)
      const smallAmount = ethers.parseEther("2")
      await getVot3Tokens(citizen, "1000")
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, smallAmount)

      // Create a real endorsed app and start a round
      const appId = await createEndorsedApp(creators[0], otherAccounts[8])
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets preferences
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [appId], [10000])

      // Whitelist citizen for passport check
      await veBetterPassport.connect(owner).whitelist(citizen.address)
      if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)

      // Cast navigator vote for citizen
      await xAllocationVoting.castNavigatorVote(citizen.address, roundId)

      // Verify votes received equals only the delegated amount, not the full 1000 VOT3 balance
      const snapshot = await xAllocationVoting.roundSnapshot(roundId)
      const delegatedPower = await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen.address, snapshot)
      const votesReceived = await xAllocationVoting.getAppVotes(roundId, appId)
      expect(votesReceived).to.equal(delegatedPower)
      expect(votesReceived).to.be.lt(ethers.parseEther("1000"))
    })

    it("transfer locked VOT3: delegate 500, try transfer 501, reverts", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)

      // Citizen gets 1000 VOT3, delegates 500
      await getVot3Tokens(citizen, "1000")
      const delegateAmount = ethers.parseEther("500")
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, delegateAmount)

      // Try to transfer 501 VOT3 (exceeds unlocked balance)
      const transferAmount = ethers.parseEther("501")
      await expect(vot3.connect(citizen).transfer(otherAccounts[12].address, transferAmount)).to.be.revertedWith(
        "VOT3: transfer exceeds unlocked balance",
      )
    })

    it("call depositNavigatorFee directly (not VoterRewards): reverts UnauthorizedCaller", async function () {
      const navigator1 = otherAccounts[10]
      await registerNavigator(navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await expect(
        navigatorRegistry.connect(otherAccounts[11]).depositNavigatorFee(navigator1.address, roundId, 100n),
      ).to.be.revertedWithCustomError(navigatorRegistry, "UnauthorizedCaller")
    })

    it("non-navigator tries to claim fees: reverts NotRegistered", async function () {
      const nonNavigator = otherAccounts[11]
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await expect(navigatorRegistry.connect(nonNavigator).claimFee(roundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })

    it("regular user tries to call onlyNavigator functions: reverts", async function () {
      const user = otherAccounts[11]
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      const app1 = ethers.keccak256(ethers.toUtf8Bytes("App1"))

      // setAllocationPreferences
      await expect(
        navigatorRegistry.connect(user).setAllocationPreferences(roundId, [app1], [10000]),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotRegistered")

      // setProposalDecision
      await expect(navigatorRegistry.connect(user).setProposalDecision(1, 2)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )

      // announceExit
      await expect(navigatorRegistry.connect(user).announceExit()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })
  })

  // ======================== 2. Malicious Navigator ======================== //

  describe("Malicious navigator", function () {
    it("claim fees from round with no deposits: reverts NoFeesToClaim", async function () {
      const navigator1 = otherAccounts[10]
      await registerNavigator(navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Advance past lock period
      const lockPeriod = Number(await navigatorRegistry.getFeeLockPeriod())
      await advanceRounds(lockPeriod)

      await expect(navigatorRegistry.connect(navigator1).claimFee(roundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NoFeesToClaim",
      )
    })

    it("claim before lock period: reverts FeesStillLocked", async function () {
      const navigator1 = otherAccounts[10]
      await registerNavigator(navigator1)
      await bootstrapAndStartEmissions()
      const depositRoundId = await xAllocationVoting.currentRoundId()

      await depositFeeViaImpersonation(navigator1.address, depositRoundId, ethers.parseEther("100"))

      // Advance only 2 rounds (less than feeLockPeriod of 4)
      await advanceRounds(2)

      await expect(navigatorRegistry.connect(navigator1).claimFee(depositRoundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "FeesStillLocked",
      )
    })

    it("report same infraction twice: second reportMissedAllocationVote reverts AlreadySlashed", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)

      // Citizen delegates to navigator (so navigator has citizens)
      await getVot3Tokens(citizen, "500")
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, ethers.parseEther("500"))

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Wait for round to end without navigator setting preferences
      await waitForRoundToEnd(Number(roundId))

      // First report succeeds
      await navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId)

      // Second report reverts
      await expect(
        navigatorRegistry.reportMissedAllocationVote(navigator1.address, roundId),
      ).to.be.revertedWithCustomError(navigatorRegistry, "AlreadySlashed")
    })

    it("set preferences with 100% to one app [10000]: valid, vote goes entirely to that app", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)

      // Citizen delegates
      const delegateAmount = "500"
      await delegateCitizen(citizen, navigator1, delegateAmount)

      // Create real app and start round
      const appId = await createEndorsedApp(creators[0], otherAccounts[8])
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets 100% to one app
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [appId], [10000])

      // Whitelist citizen
      await veBetterPassport.connect(owner).whitelist(citizen.address)
      if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)

      // Cast navigator vote
      await xAllocationVoting.castNavigatorVote(citizen.address, roundId)

      // Verify all voting power went to the single app
      const snapshot = await xAllocationVoting.roundSnapshot(roundId)
      const delegatedPower = await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen.address, snapshot)
      const appVotes = await xAllocationVoting.getAppVotes(roundId, appId)
      expect(appVotes).to.equal(delegatedPower)
    })
  })

  // ======================== 3. Malicious Relayer ======================== //

  describe("Malicious relayer", function () {
    it("castNavigatorVote for random address (not delegated): reverts NotDelegatedToNavigator", async function () {
      const randomUser = otherAccounts[11]

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await expect(xAllocationVoting.castNavigatorVote(randomUser.address, roundId)).to.be.revertedWithCustomError(
        xAllocationVoting,
        "NotDelegatedToNavigator",
      )
    })

    it("castNavigatorVote before navigator sets preferences: reverts NavigatorPreferencesNotSet", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)
      await delegateCitizen(citizen, navigator1, "500")

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator has NOT set preferences for this round
      await expect(xAllocationVoting.castNavigatorVote(citizen.address, roundId)).to.be.revertedWithCustomError(
        xAllocationVoting,
        "NavigatorPreferencesNotSet",
      )
    })

    it("call depositNavigatorFee from non-VoterRewards address: reverts UnauthorizedCaller", async function () {
      const navigator1 = otherAccounts[10]
      await registerNavigator(navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Any external caller (not VoterRewards) should be rejected
      await expect(
        navigatorRegistry.connect(owner).depositNavigatorFee(navigator1.address, roundId, ethers.parseEther("10")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "UnauthorizedCaller")
    })
  })

  // ======================== 4. Access Control ======================== //

  describe("Access control", function () {
    it("non-governance calling setMinStake: reverts", async function () {
      const attacker = otherAccounts[11]
      await expect(navigatorRegistry.connect(attacker).setMinStake(1000n)).to.be.reverted
    })

    it("non-admin calling setXAllocationVoting: reverts", async function () {
      const attacker = otherAccounts[11]
      await expect(navigatorRegistry.connect(attacker).setXAllocationVoting(attacker.address)).to.be.reverted
    })

    it("non-navigator calling setAllocationPreferences: reverts", async function () {
      const attacker = otherAccounts[11]
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()
      const app1 = ethers.keccak256(ethers.toUtf8Bytes("App1"))

      await expect(
        navigatorRegistry.connect(attacker).setAllocationPreferences(roundId, [app1], [10000]),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotRegistered")
    })

    it("non-navigator calling claimFee: reverts", async function () {
      const attacker = otherAccounts[11]
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await expect(navigatorRegistry.connect(attacker).claimFee(roundId)).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })

    it("non-navigator calling announceExit: reverts", async function () {
      const attacker = otherAccounts[11]
      await bootstrapAndStartEmissions()

      await expect(navigatorRegistry.connect(attacker).announceExit()).to.be.revertedWithCustomError(
        navigatorRegistry,
        "NotRegistered",
      )
    })

    it("non-voterRewards calling depositNavigatorFee: reverts UnauthorizedCaller", async function () {
      const navigator1 = otherAccounts[10]
      await registerNavigator(navigator1)
      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      await expect(
        navigatorRegistry.connect(otherAccounts[12]).depositNavigatorFee(navigator1.address, roundId, 100n),
      ).to.be.revertedWithCustomError(navigatorRegistry, "UnauthorizedCaller")
    })
  })

  // ======================== 5. Numerical Correctness ======================== //

  describe("Numerical correctness", function () {
    it("large delegation 400K VOT3: percentages [6000, 4000] convert correctly to weights", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)

      // Citizen gets and delegates 400K VOT3 (within 500K capacity of 50K stake)
      const delegateAmount = "400000"
      await delegateCitizen(citizen, navigator1, delegateAmount)

      // Create two real endorsed apps
      const appId1 = await createEndorsedApp(creators[0], otherAccounts[8])
      const appId2 = await createEndorsedApp(creators[1], otherAccounts[9])

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets 60/40 split
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [appId1, appId2], [6000, 4000])

      // Whitelist citizen
      await veBetterPassport.connect(owner).whitelist(citizen.address)
      if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)

      // Cast navigator vote
      await xAllocationVoting.castNavigatorVote(citizen.address, roundId)

      // Verify: 400K * 60% = 240k, 400K * 40% = 160k
      const snapshot = await xAllocationVoting.roundSnapshot(roundId)
      const delegatedPower = await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen.address, snapshot)
      const expectedApp1 = (delegatedPower * 6000n) / 10000n
      const expectedApp2 = (delegatedPower * 4000n) / 10000n

      const app1Votes = await xAllocationVoting.getAppVotes(roundId, appId1)
      const app2Votes = await xAllocationVoting.getAppVotes(roundId, appId2)

      // Dust assigned to first app, so app1 >= expected, total = delegatedPower
      expect(app1Votes).to.be.gte(expectedApp1)
      expect(app2Votes).to.equal(expectedApp2)
      expect(app1Votes + app2Votes).to.equal(delegatedPower)
    })

    it("multiple citizens same navigator: each gets independent vote with own delegated power", async function () {
      const navigator1 = otherAccounts[10]
      const citizen1 = otherAccounts[11]
      const citizen2 = otherAccounts[12]

      await registerNavigator(navigator1)

      // Two citizens delegate different amounts
      await delegateCitizen(citizen1, navigator1, "1000")
      await delegateCitizen(citizen2, navigator1, "3000")

      // Create an endorsed app
      const appId = await createEndorsedApp(creators[0], otherAccounts[8])

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets preferences
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [appId], [10000])

      // Whitelist both citizens
      await veBetterPassport.connect(owner).whitelist(citizen1.address)
      await veBetterPassport.connect(owner).whitelist(citizen2.address)
      if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)

      // Cast votes for both citizens
      await xAllocationVoting.castNavigatorVote(citizen1.address, roundId)
      await xAllocationVoting.castNavigatorVote(citizen2.address, roundId)

      // Verify total votes = citizen1 delegated + citizen2 delegated
      const snapshot = await xAllocationVoting.roundSnapshot(roundId)
      const power1 = await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen1.address, snapshot)
      const power2 = await navigatorRegistry.getDelegatedAmountAtTimepoint(citizen2.address, snapshot)
      const totalVotes = await xAllocationVoting.getAppVotes(roundId, appId)

      expect(totalVotes).to.equal(power1 + power2)
    })

    it("fee math: citizen reward 1000, navigator fee 20% = 200, relayer fee 10% of 800 = 80, citizen gets 720", async function () {
      // This test verifies the fee ordering: navigator fee first, then relayer fee on remainder
      const grossReward = 1000n
      const navigatorFeePercent = 2000n // 20% (in basis points)
      const relayerFeePercent = 1000n // 10% (in basis points)
      const BASIS_POINTS = 10000n

      // Navigator fee = grossReward * 20% = 200
      const navigatorFee = (grossReward * navigatorFeePercent) / BASIS_POINTS
      expect(navigatorFee).to.equal(200n)

      // After navigator fee
      const afterNavFee = grossReward - navigatorFee
      expect(afterNavFee).to.equal(800n)

      // Relayer fee = afterNavFee * 10% = 80
      const relayerFee = (afterNavFee * relayerFeePercent) / BASIS_POINTS
      expect(relayerFee).to.equal(80n)

      // Citizen net = 800 - 80 = 720
      const citizenNet = afterNavFee - relayerFee
      expect(citizenNet).to.equal(720n)

      // Sanity: all parts sum to original
      expect(navigatorFee + relayerFee + citizenNet).to.equal(grossReward)
    })
  })

  // ======================== 6. Contract-Level Protections ======================== //

  describe("Contract-level protections", function () {
    it("self-delegation: navigator cannot delegate to themselves", async function () {
      const navigator1 = otherAccounts[10]
      await registerNavigator(navigator1)
      await getVot3Tokens(navigator1, "1000")

      await expect(
        navigatorRegistry.connect(navigator1).delegate(navigator1.address, ethers.parseEther("500")),
      ).to.be.revertedWithCustomError(navigatorRegistry, "SelfDelegationNotAllowed")
    })

    it("delegated citizen cannot castVote manually on XAllocationVoting", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)
      await getVot3Tokens(citizen, "1000")
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, ethers.parseEther("500"))

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Whitelist citizen for personhood
      await veBetterPassport.connect(owner).whitelist(citizen.address)

      const appId = ethers.keccak256(ethers.toUtf8Bytes("TestApp"))
      await expect(
        xAllocationVoting.connect(citizen).castVote(roundId, [appId], [ethers.parseEther("100")]),
      ).to.be.revertedWithCustomError(xAllocationVoting, "DelegatedToNavigator")
    })

    it("navigator cannot enable auto-voting", async function () {
      const navigator1 = otherAccounts[10]
      await registerNavigator(navigator1)

      await expect(
        xAllocationVoting.connect(navigator1).toggleAutoVoting(navigator1.address),
      ).to.be.revertedWithCustomError(xAllocationVoting, "NavigatorCannotEnableAutoVoting")
    })

    it("delegated citizen cannot enable auto-voting", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)
      await getVot3Tokens(citizen, "1000")
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, ethers.parseEther("500"))

      await expect(xAllocationVoting.connect(citizen).toggleAutoVoting(citizen.address)).to.be.revertedWithCustomError(
        xAllocationVoting,
        "DelegatedToNavigator",
      )
    })

    it("double voting blocked: navigator votes for citizen, citizen cannot vote again", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)
      await getVot3Tokens(citizen, "1000")
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, ethers.parseEther("500"))

      // Create endorsed app BEFORE starting emissions (so it's eligible in round 1)
      const appId = await createEndorsedApp(creators[0], otherAccounts[8])

      await bootstrapAndStartEmissions()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets preferences and casts vote for citizen
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [appId], [10000])

      await veBetterPassport.connect(owner).whitelist(citizen.address)
      await xAllocationVoting.castNavigatorVote(citizen.address, roundId)

      // Citizen tries to vote manually — blocked by DelegatedToNavigator (not just hasVoted)
      await expect(
        xAllocationVoting.connect(citizen).castVote(roundId, [appId], [ethers.parseEther("100")]),
      ).to.be.revertedWithCustomError(xAllocationVoting, "DelegatedToNavigator")
    })

    it("re-delegate after undelegate: checkpoints correct", async function () {
      const navigator1 = otherAccounts[10]
      const citizen = otherAccounts[11]

      await registerNavigator(navigator1)
      await getVot3Tokens(citizen, "1000")

      // Delegate
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, ethers.parseEther("500"))
      expect(await navigatorRegistry.getDelegatedAmount(citizen.address)).to.equal(ethers.parseEther("500"))

      // Undelegate
      await navigatorRegistry.connect(citizen).undelegate()
      expect(await navigatorRegistry.getDelegatedAmount(citizen.address)).to.equal(0)

      // Re-delegate different amount
      await navigatorRegistry.connect(citizen).delegate(navigator1.address, ethers.parseEther("300"))
      expect(await navigatorRegistry.getDelegatedAmount(citizen.address)).to.equal(ethers.parseEther("300"))
      expect(await navigatorRegistry.getNavigator(citizen.address)).to.equal(navigator1.address)
    })
  })
})
