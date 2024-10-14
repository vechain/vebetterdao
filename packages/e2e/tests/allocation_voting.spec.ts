import { Page, test } from "@playwright/test"
import { DAO_ADMIN_ACCOUNT, FIXED_VOTER1, FIXED_VOTER2, FIXED_VOTER3, HOMEPAGE } from "../utils/constants"
import { veWorldMockClient } from "@vechain/veworld-mock-playwright"
import { DashboardPage } from "../model/dashboardPage"
import blockchainUtils from "../utils/blockchain"
import BigNumber from "bignumber.js"
import { MenuBar } from "../model/menuBar"
import { AllocationVote, RoundIndex } from "../model/types"
// import { GMNFTDialog } from "../model/gmnftDialog"
import { AllocationsPage } from "../model/allocationsPage"
import { TxModalRoundStart } from "../model/TxModalRoundStart"
import { TxModalClaimRewards } from "../model/TxModalClaimRewards"

/**
 * This file contains a sequential set of tests:
 * - Admin user can open the first allocation round
 * - Users vote on the first allocation round to reach quorum
 * - Can view the results of the first completed allocation round
 * - Users can claim their first round allocation round rewards
 * - Users can claim their allocation round NFT after voting on the first round
 * - Admin user can open the second allocation round
 * - Users vote on the second allocation round, quorum not reached
 * - Can view the results of the second allocation round that did not reach quorum
 */

// description of voting accounts
const votingDetails = [
  {
    accIndex: FIXED_VOTER1,
    b3trBalance: 0,
    vot3Balance: 10,
    votes: [
      { appName: "Mugshot", votePercentage: 20 },
      { appName: "Cleanify", votePercentage: 30 },
      { appName: "Vyvo", votePercentage: 50 },
    ],
  },
  {
    accIndex: FIXED_VOTER2,
    b3trBalance: 1,
    vot3Balance: 40,
    votes: [
      { appName: "Mugshot", votePercentage: 50 },
      { appName: "Cleanify", votePercentage: 30 },
      { appName: "Vyvo", votePercentage: 20 },
    ],
  },
  {
    accIndex: FIXED_VOTER3,
    b3trBalance: 2,
    vot3Balance: 50,
    votes: [
      { appName: "Mugshot", votePercentage: 20 },
      { appName: "Cleanify", votePercentage: 50 },
      { appName: "Vyvo", votePercentage: 30 },
    ],
  },
]

// fund the voting accounts
const fundVotingAccounts = async () => {
  await test.step("Fund voting accounts", async () => {
    for (let voter of votingDetails) {
      await blockchainUtils.fundAccount(voter.accIndex, BigNumber(voter.b3trBalance), BigNumber(voter.vot3Balance))
    }
  })
}

// flow to start a new allocation round
const adminOpenRound = async (page: Page) => {
  await test.step("Start a new allocation round", async () => {
    const dashboardPage = new DashboardPage(page)
    const menuBar = new MenuBar(page)

    await dashboardPage.connectWallet(DAO_ADMIN_ACCOUNT)
    const adminPage = await menuBar.gotoAdmin()
    const isFirstRound = (await adminPage.startVotingRoundButton.textContent()) === "Start emissions"
    await adminPage.startAllocationRound()
    // TODO: the following if condition is a workaround for this issue -- https://github.com/vechain/b3tr/issues/1484
    //  remove it once it's fixed
    if (isFirstRound) {
      await new TxModalRoundStart(page).expectPending()
      expect(await adminPage.startVotingRoundButton.getAttribute("disabled")).toBe("")
    } else {
      await new TxModalRoundStart(page).expectSuccess()
    }
    await page.evaluate(() => window.localStorage.clear())
    await page.evaluate(() => window.sessionStorage.clear())
  })
}

// Flow to cast a user vote
const castUserVote = async (
  page: Page,
  accountIndex: number,
  roundIndex: RoundIndex,
  splitPercentage: Array<AllocationVote>,
) => {
  await test.step("Cast user vote", async () => {
    const menuBar = new MenuBar(page)
    const dashboardPage = await menuBar.gotoDashboard()
    await dashboardPage.connectWallet(accountIndex)
    const allocationsPage: AllocationsPage = await menuBar.gotoAllocations()
    await allocationsPage.waitForRoundStatus(roundIndex, "Active now")
    const roundsPage = await allocationsPage.clickOnRound(roundIndex)
    await roundsPage.castVote(splitPercentage)
  })
}

test.describe("Allocation voting", () => {
  // Cannot parallelise these tests
  test.describe.configure({ mode: "serial" })

  test.beforeAll(async () => {
    await fundVotingAccounts()
  })

  // setup veworld mock before each test
  test.beforeEach(async ({ page }) => {
    await veWorldMockClient.load(page)
    await page.goto(HOMEPAGE)
    await veWorldMockClient.installMock(page)
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") {
      const lastTxId = await veWorldMockClient.getSenderTxId(page)
      console.log(`Last tx id: ${lastTxId}`)
    }
  })

  test("Admin user can open the first allocation round", async ({ page }) => {
    await adminOpenRound(page)
  })

  for (let i = 0; i < votingDetails.length; i++) {
    test(`Users vote on the first allocation round to reach quorum; Voter's accIndex: ${votingDetails[i].accIndex}`, async ({
      page,
    }) => {
      test.setTimeout(300000) // 5 mins timeout to allow for voting
      const roundIndex: RoundIndex = "latest"
      await castUserVote(page, votingDetails[i].accIndex, roundIndex, votingDetails[i].votes as Array<AllocationVote>)
      // if that was the last user voting - wait until the round end
      if (i === votingDetails.length - 1) await blockchainUtils.waitForNextCycle()
    })
  }

  test("Can view the results of the first completed allocation round", async ({ page }) => {
    const menuBar = new MenuBar(page)
    const allocationsPage = await menuBar.gotoAllocations()
    await allocationsPage.expectRoundStatus("latest", "Concluded")
    const roundPage = await allocationsPage.clickOnRound("latest", false)
    const totalVotes = votingDetails.reduce((acc, voter) => acc + voter.vot3Balance, 0)
    // assert total votes
    await roundPage.expectTotalVotes(totalVotes)
    // assert total voters
    await roundPage.expectTotalVoters(votingDetails.length)
    // calculate sum of votes for each app
    const sumAppVotes = votingDetails.reduce((acc, voter) => {
      voter.votes.forEach(vote => {
        if (!acc[vote.appName]) {
          acc[vote.appName] = 0
        }
        acc[vote.appName] += (vote.votePercentage * voter.vot3Balance) / 100
      })
      return acc
    }, {})
    // assert votes for each app
    // TODO: temp disabled due to a bug: https://github.com/vechain/b3tr/issues/1476
    console.log("sumAppVotes", sumAppVotes)
    // for (let app in sumAppVotes) {
    //   await roundPage.expectAppVotes(app, sumAppVotes[app])
    // }
  })

  for (let i = 0; i < votingDetails.length; i++) {
    test(`Users can claim their first round allocation round rewards; voter accIndex: ${votingDetails[i].accIndex}`, async ({
      page,
    }) => {
      const menuBar = new MenuBar(page)
      const dashboardPage = await menuBar.gotoDashboard()
      await veWorldMockClient.setConfig(page, { accountIndex: votingDetails[i].accIndex })
      await dashboardPage.connectWallet()
      // claim reward
      await dashboardPage.clickClaimRewards()
      const txModal = new TxModalClaimRewards(page)
      await txModal.expectSuccess()
      await txModal.close()
      // assert b3tr balance has increased
      await dashboardPage.expectB3TRBalanceGreaterThan(votingDetails[i].b3trBalance)
    })
  }

  // TODO: uncomment once this is fixed -- https://github.com/vechain/b3tr/issues/1485
  // for (let i = 0; i < votingDetails.length; i++) {
  //   let nftCounter = 1
  //   test(`Users can claim their allocation round NFT after voting on the first round; Voter accIndex: ${votingDetails[i].accIndex}`, async ({
  //     page,
  //   }) => {
  //     const menuBar = new MenuBar(page)
  //     const dashboardPage = await menuBar.gotoDashboard()
  //     await veWorldMockClient.setConfig(page, { accountIndex: votingDetails[i].accIndex })
  //     await dashboardPage.connectWallet()
  //     // claim NFT
  //     await dashboardPage.mintNFT()
  //     const dialog = new GMNFTDialog(page)
  //     await dialog.expectDialogDisplayed(nftCounter)
  //     await dialog.closeDialog()
  //     // assert NFT is displayed
  //     await dashboardPage.expectNFTToBeDisplayed("GM Earth")
  //     nftCounter++
  //   })
  // }

  test("Admin user can open the second allocation round", async ({ page }) => {
    await adminOpenRound(page)
  })

  test("Users vote on the second allocation round, quorum not reached", async ({ page }) => {
    test.setTimeout(300000) // 5 mins timeout to allow for voting
    const roundIndex: RoundIndex = "latest"
    // vote from only first user, so quorum is not reached
    const voter = votingDetails[0]
    await castUserVote(page, voter.accIndex, roundIndex, voter.votes as Array<AllocationVote>)
    // complete round
    await blockchainUtils.waitForNextCycle()
  })

  test("Can view the results of the second allocation round that did not reach quorum", async ({ page }) => {
    const menuBar = new MenuBar(page)
    const allocationsPage = await menuBar.gotoAllocations()
    await allocationsPage.expectOnPage()
    // assert round status
    await allocationsPage.expectRoundStatus("latest", "Concluded")
    const roundPage = await allocationsPage.clickOnRound("latest", false)
    await roundPage.expectQuorumNotReached()
    // assert total votes
    await roundPage.expectTotalVotes(votingDetails[0].vot3Balance)
    // assert total voters
    await roundPage.expectTotalVoters(1)
  })
})
