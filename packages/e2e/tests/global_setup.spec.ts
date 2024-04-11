import { type FullConfig } from '@playwright/test';
import blockchainUtils from '../utils/blockchain';
import { FIXED_ACCOUNT1 } from '../utils/constants';

async function globalSetup(config: FullConfig) {
  // fund the fixed accounts
  blockchainUtils.fundAccount(FIXED_ACCOUNT1)
}

export default globalSetup;