import { BigNumber } from "bignumber.js"

// A users allocation vote
export type AllocationVote = {
    appName: string,
    votePercentage: number
}

export type Token = 'B3TR' | 'VOT3'

/**
 * @param {string} contract - ERC20 contract address
 * @param {BigNumber} amount - amount to transfer; e.g. BigNumber(2) will transfer 2 ERC20 tokens
 * @param {string} - receiver address
 * @param {Account} sender - sender account details that include acc index, address and private key
 */
export type ERC20TransferArgs = {
    contract: string
    amount: BigNumber
    receiver: string
    sender?: Account
}

/**
 * @param {number} index - account index
 * @param {string} address - wallet address
 * @param {Buffer} pk - wallet private key;
 *                      if you need string val instead of Buffer - call `.toString('hex')` on it
 */
export type Account = {
    index: number,
    address: string,
    pk: Buffer
}

/**
 * address {string} - wallet address on which the swap is performed; required to verify if the swap was successful
 */
export type SwapArgs = {
    sendToken: Token
    receiveToken: Token
    sendAmount?: BigNumber
    max?: boolean
}

/**
 * {Token} token - token name
 * {BigNumber} amount - swap send amount
 * {boolean} max - should it
 */
export type SetSendSwapAmountArgs = {
    token: Token
    amount?: BigNumber
    max?: boolean
}