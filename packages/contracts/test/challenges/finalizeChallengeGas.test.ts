import { expect } from "chai"
import { ethers, network } from "hardhat"
import { deployProxy } from "../../scripts/helpers"
import { challengesLibraries } from "../../scripts/libraries"
import { B3TR, B3TRChallenges, MockPassportActions, MockRoundGovernor, MockX2EarnApps } from "../../typechain-types"

const STAKE_AMOUNT = ethers.parseEther("1")
const MIN_BET_AMOUNT = ethers.parseEther("1")

const APP_IDS = Array.from({ length: 5 }, (_, i) => ethers.keccak256(ethers.toUtf8Bytes(`app-${i + 1}`)))

const ChallengeKind = { Stake: 0, Sponsored: 1 } as const
const ChallengeVisibility = { Public: 0 } as const
const ThresholdMode = { None: 0 } as const

const MAX_PARTICIPANTS = 100
const MAX_DURATION = 4
const START_ROUND = 2
const END_ROUND = START_ROUND + MAX_DURATION - 1 // 4 rounds inclusive: 2,3,4,5

describe("B3TRChallenges - finalize gas worst case @shard-gas", function () {
  this.timeout(600_000)

  async function deployFixtureWorstCase() {
    const [admin] = await ethers.getSigners()

    const b3tr = (await (
      await ethers.getContractFactory("B3TR")
    ).deploy(admin.address, admin.address, admin.address)) as B3TR
    await b3tr.waitForDeployment()

    const roundGovernor = (await (await ethers.getContractFactory("MockRoundGovernor")).deploy()) as MockRoundGovernor
    await roundGovernor.waitForDeployment()

    const passport = (await (await ethers.getContractFactory("MockPassportActions")).deploy()) as MockPassportActions
    await passport.waitForDeployment()

    const x2EarnApps = (await (await ethers.getContractFactory("MockX2EarnApps")).deploy()) as MockX2EarnApps
    await x2EarnApps.waitForDeployment()

    const { ChallengeCoreLogic: challengeCoreLogic, ChallengeSettlementLogic: challengeSettlementLogic } =
      await challengesLibraries({ logOutput: false })

    for (const appId of APP_IDS) {
      await x2EarnApps.setAppExists(appId, true)
    }

    const challenges = (await deployProxy(
      "B3TRChallenges",
      [
        {
          b3trAddress: await b3tr.getAddress(),
          veBetterPassportAddress: await passport.getAddress(),
          xAllocationVotingAddress: await roundGovernor.getAddress(),
          x2EarnAppsAddress: await x2EarnApps.getAddress(),
          maxChallengeDuration: MAX_DURATION,
          maxSelectedApps: 5,
          maxParticipants: MAX_PARTICIPANTS,
          minBetAmount: MIN_BET_AMOUNT,
        },
        {
          admin: admin.address,
          upgrader: admin.address,
          contractsAddressManager: admin.address,
          settingsManager: admin.address,
        },
      ],
      {
        ChallengeCoreLogic: await challengeCoreLogic.getAddress(),
        ChallengeSettlementLogic: await challengeSettlementLogic.getAddress(),
      },
    )) as B3TRChallenges

    return { admin, b3tr, roundGovernor, passport, x2EarnApps, challenges }
  }

  async function makeFundedWallets(count: number, b3tr: B3TR, challengesAddress: string) {
    const wallets: ReturnType<typeof ethers.Wallet.createRandom>[] = []
    for (let i = 0; i < count; i++) {
      const w = ethers.Wallet.createRandom().connect(ethers.provider)
      wallets.push(w)
    }
    // Fund ETH for gas + mint B3TR + approve
    const [admin] = await ethers.getSigners()
    for (const w of wallets) {
      await network.provider.send("hardhat_setBalance", [w.address, "0x56BC75E2D63100000"]) // 100 ETH
      await b3tr.connect(admin).mint(w.address, STAKE_AMOUNT)
      await b3tr.connect(w).approve(challengesAddress, STAKE_AMOUNT)
    }
    return wallets
  }

  it("measures finalizeChallenge gas at worst case (100 participants × 4 rounds × 5 apps, Sponsored, non-allApps)", async function () {
    const { admin, b3tr, roundGovernor, passport, challenges } = await deployFixtureWorstCase()

    // Round = 1 so startRound=2 is valid
    await roundGovernor.setCurrentRoundId(1)

    // Mint sponsor stake to creator (admin)
    const sponsorAmount = STAKE_AMOUNT * BigInt(MAX_PARTICIPANTS)
    await b3tr.mint(admin.address, sponsorAmount)
    await b3tr.connect(admin).approve(await challenges.getAddress(), sponsorAmount)

    // Create a SPONSORED challenge (creator is NOT auto-added; max 100 other participants)
    await challenges.connect(admin).createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: sponsorAmount,
      startRound: START_ROUND,
      endRound: END_ROUND,
      threshold: 0,
      appIds: APP_IDS, // 5 apps → triggers the nested app loop
      invitees: [],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })

    // Create 100 fresh joiners
    const joiners = await makeFundedWallets(MAX_PARTICIPANTS, b3tr, await challenges.getAddress())

    // Join all 100 (Sponsored, no stake transfer per joiner — just status bookkeeping)
    for (const w of joiners) {
      await challenges.connect(w).joinChallenge(1)
    }

    // Populate action counts so every (participant, round, app) slot is non-zero.
    // This forces the contract to actually do the work (though 0 values still iterate —
    // the cost is dominated by external call overhead, not by the SSTOREs in the mock).
    for (const w of joiners) {
      for (let round = START_ROUND; round <= END_ROUND; round++) {
        for (const appId of APP_IDS) {
          await passport.setUserRoundActionCountApp(w.address, round, appId, 1)
        }
      }
    }

    // Advance round past endRound so finalizeChallenge is allowed
    await roundGovernor.setCurrentRoundId(END_ROUND + 1)

    // Measure gas for finalizeChallenge
    const tx = await challenges.connect(admin).finalizeChallenge(1)
    const receipt = await tx.wait()
    const gasUsed = receipt!.gasUsed

    // VeChain mainnet block gas limit is ~40M currently. Ethereum is ~30M.
    const VECHAIN_BLOCK_GAS = 40_000_000n
    const ETH_BLOCK_GAS = 30_000_000n

    // Log for visibility
    // eslint-disable-next-line no-console
    console.log(`\n========== finalizeChallenge WORST-CASE gas ==========`)
    // eslint-disable-next-line no-console
    console.log(`Participants: ${MAX_PARTICIPANTS}`)
    // eslint-disable-next-line no-console
    console.log(`Rounds: ${MAX_DURATION}`)
    // eslint-disable-next-line no-console
    console.log(`Apps: ${APP_IDS.length}`)
    // eslint-disable-next-line no-console
    console.log(`Cross-contract calls: ${MAX_PARTICIPANTS * MAX_DURATION * APP_IDS.length}`)
    // eslint-disable-next-line no-console
    console.log(`Gas used: ${gasUsed.toString()}`)
    // eslint-disable-next-line no-console
    console.log(`Fraction of VeChain 40M block: ${(Number(gasUsed) / Number(VECHAIN_BLOCK_GAS)).toFixed(3)}`)
    // eslint-disable-next-line no-console
    console.log(`Fraction of Ethereum 30M block: ${(Number(gasUsed) / Number(ETH_BLOCK_GAS)).toFixed(3)}`)
    // eslint-disable-next-line no-console
    console.log(`======================================================\n`)

    // Loose sanity check — just assert the tx actually succeeded.
    expect(gasUsed).to.be.gt(0n)
  })

  it("measures finalizeChallenge gas at 5× the configured maxes to check DoS ceiling", async function () {
    // Raise maxParticipants to 500 (keep 4 rounds × 5 apps). If this still fits in 40M → DoS claim is false even at 5×.
    const [admin] = await ethers.getSigners()

    const b3tr = (await (
      await ethers.getContractFactory("B3TR")
    ).deploy(admin.address, admin.address, admin.address)) as B3TR
    await b3tr.waitForDeployment()
    const roundGovernor = (await (await ethers.getContractFactory("MockRoundGovernor")).deploy()) as MockRoundGovernor
    await roundGovernor.waitForDeployment()
    const passport = (await (await ethers.getContractFactory("MockPassportActions")).deploy()) as MockPassportActions
    await passport.waitForDeployment()
    const x2EarnApps = (await (await ethers.getContractFactory("MockX2EarnApps")).deploy()) as MockX2EarnApps
    await x2EarnApps.waitForDeployment()
    const { ChallengeCoreLogic: challengeCoreLogic, ChallengeSettlementLogic: challengeSettlementLogic } =
      await challengesLibraries({ logOutput: false })
    for (const appId of APP_IDS) await x2EarnApps.setAppExists(appId, true)

    const HUGE_PARTICIPANTS = 500

    const challenges = (await deployProxy(
      "B3TRChallenges",
      [
        {
          b3trAddress: await b3tr.getAddress(),
          veBetterPassportAddress: await passport.getAddress(),
          xAllocationVotingAddress: await roundGovernor.getAddress(),
          x2EarnAppsAddress: await x2EarnApps.getAddress(),
          maxChallengeDuration: MAX_DURATION,
          maxSelectedApps: 5,
          maxParticipants: HUGE_PARTICIPANTS,
          minBetAmount: MIN_BET_AMOUNT,
        },
        {
          admin: admin.address,
          upgrader: admin.address,
          contractsAddressManager: admin.address,
          settingsManager: admin.address,
        },
      ],
      {
        ChallengeCoreLogic: await challengeCoreLogic.getAddress(),
        ChallengeSettlementLogic: await challengeSettlementLogic.getAddress(),
      },
    )) as B3TRChallenges

    await roundGovernor.setCurrentRoundId(1)

    const sponsorAmount = STAKE_AMOUNT * BigInt(HUGE_PARTICIPANTS)
    await b3tr.mint(admin.address, sponsorAmount)
    await b3tr.connect(admin).approve(await challenges.getAddress(), sponsorAmount)

    await challenges.connect(admin).createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: sponsorAmount,
      startRound: START_ROUND,
      endRound: END_ROUND,
      threshold: 0,
      appIds: APP_IDS,
      invitees: [],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })

    const joiners = await makeFundedWallets(HUGE_PARTICIPANTS, b3tr, await challenges.getAddress())
    for (const w of joiners) await challenges.connect(w).joinChallenge(1)

    for (const w of joiners) {
      for (let round = START_ROUND; round <= END_ROUND; round++) {
        for (const appId of APP_IDS) {
          await passport.setUserRoundActionCountApp(w.address, round, appId, 1)
        }
      }
    }

    await roundGovernor.setCurrentRoundId(END_ROUND + 1)

    const tx = await challenges.connect(admin).finalizeChallenge(1)
    const receipt = await tx.wait()
    const gasUsed = receipt!.gasUsed

    // eslint-disable-next-line no-console
    console.log(`\n========== 5× participants (500 × 4 × 5 = 10000 calls) ==========`)
    // eslint-disable-next-line no-console
    console.log(`Gas used: ${gasUsed.toString()}  (40M block fraction: ${(Number(gasUsed) / 40_000_000).toFixed(3)})`)
    // eslint-disable-next-line no-console
    console.log(`==================================================================\n`)

    expect(gasUsed).to.be.gt(0n)
  })

  it("sweeps participant counts at 2 rounds × 5 apps to find VeChain-40M ceiling", async function () {
    // We re-use the same mock stack and vary maxParticipants / actual joiners.
    const CANDIDATES = [400, 600, 800, 1000]
    const DURATION_2 = 2
    const END_ROUND_2 = START_ROUND + DURATION_2 - 1 // rounds 2, 3
    const results: { n: number; gas: bigint | null }[] = []

    for (const N of CANDIDATES) {
      const [admin] = await ethers.getSigners()
      const b3tr = (await (
        await ethers.getContractFactory("B3TR")
      ).deploy(admin.address, admin.address, admin.address)) as B3TR
      await b3tr.waitForDeployment()
      const roundGovernor = (await (await ethers.getContractFactory("MockRoundGovernor")).deploy()) as MockRoundGovernor
      await roundGovernor.waitForDeployment()
      const passport = (await (await ethers.getContractFactory("MockPassportActions")).deploy()) as MockPassportActions
      await passport.waitForDeployment()
      const x2EarnApps = (await (await ethers.getContractFactory("MockX2EarnApps")).deploy()) as MockX2EarnApps
      await x2EarnApps.waitForDeployment()
      const { ChallengeCoreLogic: challengeCoreLogic, ChallengeSettlementLogic: challengeSettlementLogic } =
        await challengesLibraries({ logOutput: false })
      for (const appId of APP_IDS) await x2EarnApps.setAppExists(appId, true)

      const challenges = (await deployProxy(
        "B3TRChallenges",
        [
          {
            b3trAddress: await b3tr.getAddress(),
            veBetterPassportAddress: await passport.getAddress(),
            xAllocationVotingAddress: await roundGovernor.getAddress(),
            x2EarnAppsAddress: await x2EarnApps.getAddress(),
            maxChallengeDuration: DURATION_2,
            maxSelectedApps: 5,
            maxParticipants: N,
            minBetAmount: MIN_BET_AMOUNT,
          },
          {
            admin: admin.address,
            upgrader: admin.address,
            contractsAddressManager: admin.address,
            settingsManager: admin.address,
          },
        ],
        {
          ChallengeCoreLogic: await challengeCoreLogic.getAddress(),
          ChallengeSettlementLogic: await challengeSettlementLogic.getAddress(),
        },
      )) as B3TRChallenges

      await roundGovernor.setCurrentRoundId(1)

      const sponsorAmount = STAKE_AMOUNT * BigInt(N)
      await b3tr.mint(admin.address, sponsorAmount)
      await b3tr.connect(admin).approve(await challenges.getAddress(), sponsorAmount)

      await challenges.connect(admin).createChallenge({
        kind: ChallengeKind.Sponsored,
        visibility: ChallengeVisibility.Public,
        thresholdMode: ThresholdMode.None,
        stakeAmount: sponsorAmount,
        startRound: START_ROUND,
        endRound: END_ROUND_2,
        threshold: 0,
        appIds: APP_IDS,
        invitees: [],
        title: "",
        description: "",
        imageURI: "",
        metadataURI: "",
      })

      const joiners = await makeFundedWallets(N, b3tr, await challenges.getAddress())
      for (const w of joiners) await challenges.connect(w).joinChallenge(1)

      for (const w of joiners) {
        for (let round = START_ROUND; round <= END_ROUND_2; round++) {
          for (const appId of APP_IDS) {
            await passport.setUserRoundActionCountApp(w.address, round, appId, 1)
          }
        }
      }

      await roundGovernor.setCurrentRoundId(END_ROUND_2 + 1)

      let gasUsed: bigint | null = null
      try {
        const tx = await challenges.connect(admin).finalizeChallenge(1, { gasLimit: 50_000_000 })
        const receipt = await tx.wait()
        gasUsed = receipt!.gasUsed
      } catch {
        gasUsed = null // out of gas
      }

      results.push({ n: N, gas: gasUsed })
      // eslint-disable-next-line no-console
      console.log(
        `  N=${N}  → ${
          gasUsed === null
            ? "OUT OF GAS"
            : `${gasUsed.toString()} gas  (40M frac: ${(Number(gasUsed) / 40_000_000).toFixed(3)})`
        }`,
      )
    }

    // eslint-disable-next-line no-console
    console.log(`\n========== 2 rounds × 5 apps sweep ==========`)
    for (const r of results) {
      // eslint-disable-next-line no-console
      console.log(`  participants=${r.n}  gas=${r.gas === null ? "OOG" : r.gas.toString()}`)
    }
    // eslint-disable-next-line no-console
    console.log(`=============================================\n`)
  })

  it("measures finalizeChallenge gas at worst case (allApps=true, 100 participants × 4 rounds)", async function () {
    const { admin, b3tr, roundGovernor, passport, challenges } = await deployFixtureWorstCase()

    await roundGovernor.setCurrentRoundId(1)

    const sponsorAmount = STAKE_AMOUNT * BigInt(MAX_PARTICIPANTS)
    await b3tr.mint(admin.address, sponsorAmount)
    await b3tr.connect(admin).approve(await challenges.getAddress(), sponsorAmount)

    await challenges.connect(admin).createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: sponsorAmount,
      startRound: START_ROUND,
      endRound: END_ROUND,
      threshold: 0,
      appIds: [], // allApps path
      invitees: [],
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })

    const joiners = await makeFundedWallets(MAX_PARTICIPANTS, b3tr, await challenges.getAddress())
    for (const w of joiners) {
      await challenges.connect(w).joinChallenge(1)
    }

    for (const w of joiners) {
      for (let round = START_ROUND; round <= END_ROUND; round++) {
        await passport.setUserRoundActionCount(w.address, round, 1)
      }
    }

    await roundGovernor.setCurrentRoundId(END_ROUND + 1)

    const tx = await challenges.connect(admin).finalizeChallenge(1)
    const receipt = await tx.wait()
    const gasUsed = receipt!.gasUsed

    // eslint-disable-next-line no-console
    console.log(`\n========== finalizeChallenge allApps gas ==========`)
    // eslint-disable-next-line no-console
    console.log(`Gas used: ${gasUsed.toString()}`)
    // eslint-disable-next-line no-console
    console.log(`===================================================\n`)

    expect(gasUsed).to.be.gt(0n)
  })
})
