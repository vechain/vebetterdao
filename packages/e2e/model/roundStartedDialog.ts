import { Page } from 'playwright';
import { BaseDialog } from './baseDialog';

/**
 * Allocation voting round started dialog
 */
export class RoundStartedDialog extends BaseDialog{

    constructor(page: Page) {
        super(page, "Round started")
    }
}