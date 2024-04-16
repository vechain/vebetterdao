import { Page, test } from '@playwright/test';
import { DAO_ADMIN_ACCOUNT, HOMEPAGE } from '../utils/constants';
import veWorldMockClient from '../utils/veworld-mock-client';
import { DashboardPage } from '../model/dashboardPage';
import blockchainUtils from '../utils/blockchain';
import BigNumber from 'bignumber.js';
import { MenuBar } from '../model/menuBar';
import { AllocationVote } from '../model/types';

// description of voting accounts
const votingDetails = [
  {
    accIndex: blockchainUtils.getRndAccountIndex(),
    b3trBalance: 0,
    vot3Balance: 10,
    votes: [
      { appName: 'Vyvo', votePercentage: 50 },
      { appName: 'Mugshot', votePercentage: 20 },
      { appName: 'Cleanify', votePercentage: 30 },
    ]
  },
  {
    accIndex: blockchainUtils.getRndAccountIndex(),
    b3trBalance: 1,
    vot3Balance: 20,
    votes: [
      { appName: 'Vyvo', votePercentage: 20 },
      { appName: 'Mugshot', votePercentage: 50 },
      { appName: 'Cleanify', votePercentage: 30 },
    ]
  },
  {
    accIndex: blockchainUtils.getRndAccountIndex(),
    b3trBalance: 2,
    vot3Balance: 30,
    votes: [
      { appName: 'Vyvo', votePercentage: 30 },
      { appName: 'Mugshot', votePercentage: 20 },
      { appName: 'Cleanify', votePercentage: 50 },
    ]
  }
]

// fund the voting accounts
const fundVotingAccounts = async () => {
  await test.step('Fund voting accounts', async() => {
    for (let voter of votingDetails) {
      await blockchainUtils.fundAccount(voter.accIndex, BigNumber(voter.b3trBalance), BigNumber(voter.vot3Balance))
    } 
  })
}

// flow to start a new allocation round
const adminOpenRound = async (page: Page) => {
  await test.step('Start a new allocation round', async() => {
    await veWorldMockClient.installForSolo(page, HOMEPAGE)
    await veWorldMockClient.setSignerAccIndex(page, DAO_ADMIN_ACCOUNT)
    let dashboardPage = new DashboardPage(page)
    await dashboardPage.connectWallet()
    const adminAddress = await veWorldMockClient.getMockAddress(page)
    const menuBar = new MenuBar(page)
    const adminPage = await menuBar.gotoAdmin()
    await adminPage.startEmissions()
    await dashboardPage.disconnectWallet(adminAddress)
    await page.evaluate(() => window.localStorage.clear());
    await page.evaluate(() => window.sessionStorage.clear());
  })
}


// Flow to cast a user vote 
const castUserVote = async (page: Page, accountIndex: number, roundIndex: number, 
    splitPercentage: Array<AllocationVote>) => {
  await test.step('Cast user vote', async() => {
    const menuBar = new MenuBar(page)
    const dashboardPage = await menuBar.gotoDashbard()
    await veWorldMockClient.setSignerAccIndex(page, accountIndex)
    await dashboardPage.connectWallet()
    const allocationsPage = await menuBar.gotoAllocations()
    const roundsPage = await allocationsPage.clickOnRound(roundIndex)
    await roundsPage.castVote(splitPercentage)
    await menuBar.gotoDashbard()
    await dashboardPage.disconnectWallet(blockchainUtils.getAccountAddress(accountIndex))
  })
}


test.describe('Allocation voting', () => {

    // Cannot parallelise these tests
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      // await fundVotingAccounts()
    })

    // setup veworld mock before each test
    test.beforeEach(async ({ page }) => {
        await veWorldMockClient.installForSolo(page, HOMEPAGE)
      })

    test('Admin user can open a new allocation round', async ({ page }) => {
      await adminOpenRound(page)
    })
      
    test('Users can vote on a allocation round', async ({ page }) => {
      test.setTimeout(300000) // 5 mins
      const roundIndex = 1 // voting on round 1
      // vote from each user
      for (let voter of votingDetails) {
        await castUserVote(page, voter.accIndex, roundIndex, voter.votes)
      }
      // complete round
      await blockchainUtils.waitForNextCycle()
      // assert on round status on allocations page
      const menuBar = new MenuBar(page)
      const allocationsPage = await menuBar.gotoAllocations()
      await allocationsPage.expectRoundStatus(1, 'Succeeded')

    });

    test("Can view the results of a completed allocation round", async ({ page }) => {
      const menuBar = new MenuBar(page)
      const allocationsPage = await menuBar.gotoAllocations()
      await allocationsPage.expectOnPage()
      await allocationsPage.expectRoundStatus(1, 'Succeeded')
      const roundPage = await allocationsPage.clickOnRound(1)
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
          acc[vote.appName] += vote.votePercentage * voter.vot3Balance / 100
        })
        return acc
      }, {})
      // assert votes for each app
      for (let app in sumAppVotes) {
        await roundPage.expectAppVotes(app, sumAppVotes[app])
      }
    })

    test("Users can claim their allocation round rewards", async ({ page }) => {
      for (let voter of votingDetails) {
        const menuBar = new MenuBar(page)
        const dashboardPage = await menuBar.gotoDashbard()
        await veWorldMockClient.setSignerAccIndex(page, voter.accIndex)
        await dashboardPage.connectWallet()
        // assert rewards visible
        await dashboardPage.expectVotingRewards()
        // claim reward
        await dashboardPage.clickClaimRewards()
        // assert b3tr balance has increased
        await dashboardPage.expectB3TRBalanceGreaterThan(voter.b3trBalance)
        await dashboardPage.disconnectWallet(blockchainUtils.getAccountAddress(voter.accIndex))
      }
    })

    test("Users can claim their allocation round NFT", async ({ page }) => {
      for (let voter of votingDetails) {
        const menuBar = new MenuBar(page)
        const dashboardPage = await menuBar.gotoDashbard()
        await veWorldMockClient.setSignerAccIndex(page, voter.accIndex)
        await dashboardPage.connectWallet()
        // claim NFT
        await dashboardPage.mintNFT()
        // assert NFT is displayed
        await dashboardPage.expectNFTToBeDisplayed("GM Earth")
        await dashboardPage.disconnectWallet(blockchainUtils.getAccountAddress(voter.accIndex))
      }
    })

})