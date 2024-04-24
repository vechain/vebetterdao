import { Page } from 'playwright';
import { Locator, test, expect } from '@playwright/test';
import { VoteCastDialog } from './voteCastDialog';
import { AllocationVote } from './types';

/**
 * Allocation rounds page model
 */
export class RoundsPage {
    private page: Page
    readonly castVoteButton: Locator
    readonly roundTitleText: Locator

    constructor(page: Page) {
        this.page = page
        this.castVoteButton = this.page.locator('xpath=//button[contains(text(), "Cast vote now")]')
        this.roundTitleText = this.page.getByTestId('round-title')
    }

    /**
     * Assert on rounds page for a specific round
     * @param roundIndex index of round
     * @param timeout
     */
    async expectOnPage(roundIndex: number, timeout?: number) {
        await expect(this.roundTitleText).toBeVisible({ timeout })
        await expect(this.roundTitleText).toHaveText(`Allocations | Round #${roundIndex}`, { timeout })
    }

    /**
     * Casts a users vote
     * @param votes 
     */
    async castVote(votes: Array<AllocationVote>) {
        await test.step('Cast vote', async() => {
            for (const vote of votes) {
                const appName = vote.appName
                const votePercentage = vote.votePercentage
                const xpath = `xpath=//input[@data-testid="${appName}-vote"]`
                await expect(this.page.locator(xpath).first()).toBeEnabled()
                await this.page.locator(xpath).first().scrollIntoViewIfNeeded()
                await this.page.locator(xpath).first().fill(String(votePercentage))
            }
            await this.castVoteButton.first().click()
            const voteCastDialog = new VoteCastDialog(this.page)
            await voteCastDialog.expectDialogSuccess()
            await voteCastDialog.closeDialog()
        })
    }

    /**
     * Expect total votes under session info
     * This is the total votes power of all voters
     */
    async expectTotalVotes(totalVotes: number) {
        await test.step(`Expect total votes: ${totalVotes}`, async() => {
            await expect(this.page.getByTestId('total-votes').first()).toHaveText(String(totalVotes))
        })
    }

    /**
     * Expect total voters to be displayed
     * @param totalVoters Expected total voters
     */
    async expectTotalVoters(totalVoters: number) {
        await test.step(`Expect total voters: ${totalVoters}`, async() => {
            await expect(this.page.getByTestId('total-voters').first()).toHaveText(String(totalVoters))
        })
    }

    /**
     * Expect specified app to of gotten number of votes
     * @param appName App name
     * @param votes Number of votes
     */
    async expectAppVotes(appName: string, votes: number) {
        await test.step(`Expect app votes: ${appName} to be ${votes}`, async() => {
            await expect(this.page.getByTestId(`${appName}-total-votes`)).toHaveText(String(votes))
        })
    }
}