import { BigNumber } from "bignumber.js"
import config from "@repo/config/local"

export const HOMEPAGE = "http://localhost:3000/"
export const THOR_URL = "http://localhost:8669"

export const THOR_CHAIN_TAG = 0xf6
export const B3TR_CONTRACT_ADDRESS = config.b3trContractAddress
export const VOT3_CONTRACT_ADDRESS = config.vot3ContractAddress
export const VTHO_CONTRACT_ADDRESS = "0x0000000000000000000000000000456E65726779"
export const TOKEN_DECIMALS = BigNumber("1e18")
export const SOLO_MNEMONIC = 'denial kitchen pet squirrel other broom bar gas better priority spoil cross'.split(' ');
export const TX_RECEIPT_TIMEOUT = 10000
export const TX_RECEIPT_INTERVAL = 500

// account funding
export const FUNDING_ACCOUNT_INDEX = 1  // index of the account to fund from
export const FUNDING_MIN_B3TR = 10
export const FUNDING_MIN_VTHO = 1000
export const FUNDING_MIN_VOT3 = 5

// fixed user accounts
export const FIXED_ACCOUNT1 = 10