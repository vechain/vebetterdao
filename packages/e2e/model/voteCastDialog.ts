import { Page } from 'playwright';
import { BaseDialog } from './baseDialog';

/**
 * Vost cast dialog model
 */
export class VoteCastDialog extends BaseDialog {

    constructor(page: Page) {
        super(page, "Vote Cast")
    }

}