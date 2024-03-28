import { HttpClient, ThorClient, TransactionsModule } from '@vechain/sdk-network';
import { clauseBuilder, coder, FunctionFragment, HDNode, TransactionHandler } from '@vechain/sdk-core';
import { B3TR_CONTRACT_ADDRESS, TOKEN_DECIMALS, FUNDING_ACCOUNT_INDEX, SOLO_MNEMONIC, THOR_CHAIN_TAG, THOR_URL, VOT3_CONTRACT_ADDRESS, VTHO_CONTRACT_ADDRESS, TX_RECEIPT_TIMEOUT, FUNDING_MIN_B3TR, FUNDING_MIN_VTHO, TX_RECEIPT_INTERVAL, FUNDING_MIN_VOT3, DYNAMIC_ACCOUNT_MIN, DYNAMIC_ACCOUNT_MAX } from './constants';
import { BigNumber } from 'bignumber.js';
import uniqueRandom from './unique-random';

// When toString will return an exponential value
BigNumber.config({ EXPONENTIAL_AT: 100 })
// Random number generator for accounts
const random = uniqueRandom(DYNAMIC_ACCOUNT_MIN, DYNAMIC_ACCOUNT_MAX)

// ERC20 balanceOf function ABI
const ERC20_balance_abi = JSON.stringify([{
    constant: true,
    inputs: [
        {
            name: "_owner",
            type: "address"
        }
    ],
    name: "balanceOf",
    outputs: [
        {
            "name": "balance",
            "type": "uint256"
        }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
}])

// ERC20 approve function ABI
const ERC20_approve_abi = JSON.stringify([{
    inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        }
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
}])

// VOT3 stake function ABI
const VOT3_stake_abi = JSON.stringify([{
    inputs: [
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256"
        }
      ],
      name: "stake",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
}])

/**
 * Get account address from index
 * @param index Index of account
 * @returns Address of account
 */
const getAccountAddress = (index: number): string => {
    const hdNode = HDNode.fromMnemonic(SOLO_MNEMONIC)
    const childNode = hdNode.derive(index - 1);
    return childNode.address
}

/**
 * Get the private key of account from index
 * @param index Index of account
 * @returns Private key of account
 */
const getAccountPrivateKey = (index: number): Buffer => {
    const hdNode = HDNode.fromMnemonic(SOLO_MNEMONIC)
    const childNode = hdNode.derive(index - 1);
    return childNode.privateKey
}

/**
 * Get account balance from ERC20 contract
 * @param address Account address
 * @param contractAddress ERC20 contract address
 * @returns Balance of account (NOTE: this is a decimal value, not the raw balance from the contract)
 */
const getERC20Balance = async (address: string, contractAddress: string): Promise<BigNumber> => {
    const httpClient = new HttpClient(THOR_URL)
    const thorClient = new ThorClient(httpClient)
    const response = await thorClient.contracts.executeContractCall(
        contractAddress,
        coder.createInterface(ERC20_balance_abi).getFunction("balanceOf") as FunctionFragment,
        [address]
    )
    const balance = new BigNumber(response[0].toString())
    const tokenBalance = balance.dividedBy(TOKEN_DECIMALS)
    return tokenBalance
}

/**
 * Transfer ERC20 tokens from the funding account to another account
 * @param contract ERC20 contract address
 * @param address Receiver address
 * @param amount Token amount to transfer (this is a decimal value)
 */
const doERC20Transfer = async (contract: string, address: string, amount: BigNumber) => {
    const senderPrivateKey = getAccountPrivateKey(FUNDING_ACCOUNT_INDEX)
    const senderAddress = getAccountAddress(FUNDING_ACCOUNT_INDEX)
    const httpClient = new HttpClient(THOR_URL)
    const thorClient = new ThorClient(httpClient)
    const fullAmount = BigInt(amount.multipliedBy(TOKEN_DECIMALS).toString())
    const latestBlock = await thorClient.blocks.getBestBlockCompressed()
    const clauses = [clauseBuilder.transferToken(contract, address, fullAmount)]
    const gasResult = await thorClient.gas.estimateGas(clauses, senderAddress, {gasPadding: 0.1})
    const transactionBody = {
        chainTag: THOR_CHAIN_TAG,
        blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : '0x0',
        expiration: 32,
        clauses,
        gasPriceCoef: 0,
        gas: Math.ceil(gasResult.totalGas),
        dependsOn: null,
        nonce: 12345678
    }
    const rawNormalSigned = TransactionHandler.sign(transactionBody, senderPrivateKey).encoded
    const send = await thorClient.transactions.sendRawTransaction(`0x${rawNormalSigned.toString('hex')}`)
    const txId = send.id
    console.log(`ERC20 transfer transaction ID: ${txId}`)
    const txModule = new TransactionsModule(thorClient)
    const txReceipt = await txModule.waitForTransaction(txId, {intervalMs: TX_RECEIPT_INTERVAL, timeoutMs: TX_RECEIPT_TIMEOUT})
    console.log(`ERC20 transfer transaction reverted: ${txReceipt.reverted}`)
    if (txReceipt.reverted) {
        throw new Error(`ERC20 transfer transaction reverted: ${txId}`)
    }
}

/**
 * Get an accounts B3TR balance
 * @param address Account address
 * @returns Balance of B3TR tokens (this is a decimal value)
 */
const getB3TRBalance = async (address: string): Promise<BigNumber> => {
    const balance = await getERC20Balance(address, B3TR_CONTRACT_ADDRESS)
    console.log(`B3TR balance of address ${address}: ${balance}`)
    return balance
}

/**
 * Get an accounts VOT3 balance
 * @param address Account address
 * @returns Balance of VOT3 tokens (this is a decimal value)
 */
const getVOT3Balance = async (address: string): Promise<BigNumber> => {
    const balance = await getERC20Balance(address, VOT3_CONTRACT_ADDRESS)
    console.log(`VOT3 balance of address ${address}: ${balance}`)
    return balance
}

/**
 * Get an accounts VTHO balance
 * @param address Account address
 * @returns Balance of VTHO tokens (this is a decimal value)
 */
const getVTHOBalance = async (address: string): Promise<BigNumber> => {
    const balance = await getERC20Balance(address, VTHO_CONTRACT_ADDRESS)
    console.log(`VTHO balance of address ${address}: ${balance}`)
    return balance
}

/**
 * Transfer VTHO tokens from the funding account to another account
 * @param address Address to transfer to
 * @param amount Amount of VTHO to transfer (this is a decimal value)
 */
const fundVTHO = async (address: string, amount: BigNumber) => {
    console.log(`Transferring ${amount} VTHO to ${address}`)
    await doERC20Transfer(VTHO_CONTRACT_ADDRESS, address, amount)
}

/**
 * Transfer B3TR tokens from the funding account to another account
 * @param address Address to transfer to
 * @param amount Amount of B3TR to transfer (this is a decimal value)
 */
const fundB3TR = async (address: string, amount: BigNumber) => {
    console.log(`Transferring ${amount} B3TR to ${address}`)
    await doERC20Transfer(B3TR_CONTRACT_ADDRESS, address, amount)
}


/**
 * Swap B3TR for VOT3
 * @param privateKey Private key of account
 * @param address Address of account
 * @param amount Amount of B3TR to swap (this is a decimal value)
 */
const swapB3TRForVOT3 = async (privateKey: Buffer, address: string, amount: BigNumber) => {
    // approve VOT3 contract to spend B3TR
    const httpClient = new HttpClient(THOR_URL)
    const thorClient = new ThorClient(httpClient)
    // approve VOT3 contract to spend B3TR
    const approveClause = clauseBuilder.functionInteraction(B3TR_CONTRACT_ADDRESS,
        coder.createInterface(ERC20_approve_abi).getFunction("approve") as FunctionFragment,
        [VOT3_CONTRACT_ADDRESS, amount.multipliedBy(TOKEN_DECIMALS).toString()])
    const stakeClause = clauseBuilder.functionInteraction(VOT3_CONTRACT_ADDRESS,
        coder.createInterface(VOT3_stake_abi).getFunction("stake") as FunctionFragment,
        [amount.multipliedBy(TOKEN_DECIMALS).toString()])
    const clauses = [approveClause, stakeClause]
    const gasResult = await thorClient.gas.estimateGas(clauses, address, {gasPadding: 0.1})
    const latestBlock = await thorClient.blocks.getBestBlockCompressed()
    const transactionBody = {
        chainTag: THOR_CHAIN_TAG,
        blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : '0x0',
        expiration: 32,
        clauses,
        gasPriceCoef: 0,
        gas: Math.ceil(gasResult.totalGas),
        dependsOn: null,
        nonce: 12345678
    }
    const rawNormalSigned = TransactionHandler.sign(transactionBody, privateKey).encoded
    const send = await thorClient.transactions.sendRawTransaction(`0x${rawNormalSigned.toString('hex')}`)
    const txId = send.id
    console.log(`Swap transfer transaction ID: ${txId}`)
    const txModule = new TransactionsModule(thorClient)
    const txReceipt = await txModule.waitForTransaction(txId, {intervalMs: TX_RECEIPT_INTERVAL, timeoutMs: TX_RECEIPT_TIMEOUT})
    console.log(`Swap transfer transaction reverted: ${txReceipt.reverted}`)
    if (txReceipt.reverted) {
        throw new Error(`Swap transfer transaction reverted: ${txId}`)
    }
}

/**
 * Seed an account to have a minimum balance of B3TR and VTHO
 * @param address Account address
 */
const fundAccount = async (account_index: number) => {
    const privateKey = getAccountPrivateKey(account_index)
    const address = getAccountAddress(account_index)
    console.log(`Seeding account ${address}`)
    const bt3rBalance = await blockchainUtils.getB3TRBalance(address)
    const vthoBalance = await blockchainUtils.getVTHOBalance(address)
    const vot3Balance = await blockchainUtils.getVOT3Balance(address)
    const vot3Needed = BigNumber(FUNDING_MIN_VOT3).minus(vot3Balance)
    const b3trNeeded = BigNumber(FUNDING_MIN_B3TR).minus(bt3rBalance)
    let totalNeeded = vot3Needed.isGreaterThan(0) ? b3trNeeded.plus(vot3Needed)  : b3trNeeded
    if (vthoBalance.isLessThan(FUNDING_MIN_VTHO)) {
        const vthoDiff = vthoBalance.minus(FUNDING_MIN_VTHO).multipliedBy(-1)
        await blockchainUtils.fundVTHO(address, vthoDiff)
    }
    if (totalNeeded.isGreaterThan(0)) {
        // transfer B3TR to account
        await blockchainUtils.fundB3TR(address, b3trNeeded)
        // swap B3TR for VOT3
        if (vot3Needed.isGreaterThan(0)) {
            await blockchainUtils.swapB3TRForVOT3(privateKey, address, vot3Needed)
        }
    }
    console.log(`Account ${address} seeded`)
}

/**
 * Get a random account index
 * @returns The random account index
 */
const getRndAccountIndex = () => {
    return random()
}



const blockchainUtils = {
    getAccountAddress,
    getAccountPrivateKey,
    getB3TRBalance,
    getVOT3Balance,
    getVTHOBalance,
    fundVTHO,
    fundB3TR,
    fundAccount,
    swapB3TRForVOT3,
    getRndAccountIndex
}
export default blockchainUtils