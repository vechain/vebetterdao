import { Page } from 'playwright';
import { BaseDialog } from './baseDialog';

/**
 * Swap dialog model
 */
export class SwapConfirmationDialog extends BaseDialog{

    constructor(page: Page) {
        super(page, "Swap Completed")
    }
}