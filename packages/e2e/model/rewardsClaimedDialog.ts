import { Page } from 'playwright';
import { BaseDialog } from './baseDialog';

/**
 * Rewards claimed dialog model
 */
export class RewardsClaimedDialog extends BaseDialog{

    constructor(page: Page) {
        super(page, "Rewards Claimed")
    }
}