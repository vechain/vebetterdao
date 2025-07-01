import { ThorClient } from "@vechain/sdk-network"
import { Clause, Address, ABIContract, HDKey, ERC20_ABI, Transaction, TransactionBody } from "@vechain/sdk-core"
import * as constants from "./constants"
import { BigNumber } from "bignumber.js"
import uniqueRandom from "./unique-random"

// When toString will return an exponential value
BigNumber.config({ EXPONENTIAL_AT: 100 })
// Random number generator for accounts
const randomAccGenerator = uniqueRandom(constants.DYNAMIC_ACCOUNT_MIN, constants.DYNAMIC_ACCOUNT_MAX)

const thorClient = ThorClient.at(constants.THOR_URL)

// VOT3 convertToVOT3 function ABI
const VOT3_convertToVOT3_abi = JSON.stringify([
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "convertToVOT3",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
])

// Emissions getNextCycleBlock function ABI
const Emissions_nextCycleBlock_abi = JSON.stringify([
  {
    inputs: [],
    name: "getNextCycleBlock",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
])

/**
 * Get account address from index
 * @param index Index of account
 * @returns Address of account
 */
const getAccountAddress = (index: number): string => {
  const hdNode = HDKey.fromMnemonic(constants.SOLO_MNEMONIC)
  const childNode = hdNode.deriveChild(index)
  if (!childNode.publicKey) {
    throw new Error("Unable to derive public key")
  }
  return Address.ofPublicKey(childNode.publicKey).toString()
}

/**
 * Get the private key of account from index
 * @param index Index of account
 * @returns Private key of account
 */
const getAccountPrivateKey = (index: number): Buffer => {
  const hdNode = HDKey.fromMnemonic(constants.SOLO_MNEMONIC)
  const childNode = hdNode.deriveChild(index)
  const privateKey =
    childNode.privateKey ??
    (() => {
      throw new Error("Unable to derive private key")
    })()
  return Buffer.from(privateKey)
}

/**
 * Get account balance from ERC20 contract
 * @param address Account address
 * @param contractAddress ERC20 contract address
 * @returns Balance of account (NOTE: this is a decimal value, not the raw balance from the contract)
 */
const getERC20Balance = async (address: string, contractAddress: string): Promise<BigNumber> => {
  const response = await thorClient.contracts.executeCall(
    contractAddress,
    ABIContract.ofAbi(ERC20_ABI).getFunction("balanceOf"),
    [address],
  )
  const balance = new BigNumber(response[0].toString())
  const tokenBalance = balance.dividedBy(constants.TOKEN_DECIMALS)
  return tokenBalance
}

/**
 * Transfer ERC20 tokens from the funding account to another account
 * @param contract ERC20 contract address
 * @param address Receiver address
 * @param amount Token amount to transfer (this is a decimal value)
 */
const doERC20Transfer = async (contract: string, address: string, amount: BigNumber) => {
  const senderPrivateKey = getAccountPrivateKey(constants.FUNDING_ACCOUNT_INDEX)
  const senderAddress = getAccountAddress(constants.FUNDING_ACCOUNT_INDEX)
  const fullAmount = BigInt(amount.multipliedBy(constants.TOKEN_DECIMALS).toString())
  const latestBlock = await thorClient.blocks.getBestBlockCompressed()

  const clauses = [
    Clause.callFunction(Address.of(contract), ABIContract.ofAbi(ERC20_ABI).getFunction("transfer"), [
      address,
      fullAmount,
    ]),
  ]

  const gasResult = await thorClient.gas.estimateGas(clauses, senderAddress, { gasPadding: 0.1 })
  const transactionBody = {
    chainTag: constants.THOR_CHAIN_TAG,
    blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : "0x0",
    expiration: 32,
    clauses,
    gasPriceCoef: 0,
    gas: Math.ceil(gasResult.totalGas),
    dependsOn: null,
    nonce: 12345678,
  }

  await signAndSendTx(transactionBody, senderPrivateKey)
}

/**
 * Get an accounts B3TR balance
 * @param address Account address
 * @returns Balance of B3TR tokens (this is a decimal value)
 */
const getB3TRBalance = async (address: string): Promise<BigNumber> => {
  const balance = await getERC20Balance(address, constants.B3TR_CONTRACT_ADDRESS)
  console.log(`B3TR balance of address ${address}: ${balance}`)
  return balance
}

/**
 * Get an accounts VOT3 balance
 * @param address Account address
 * @returns Balance of VOT3 tokens (this is a decimal value)
 */
const getVOT3Balance = async (address: string): Promise<BigNumber> => {
  const balance = await getERC20Balance(address, constants.VOT3_CONTRACT_ADDRESS)
  console.log(`VOT3 balance of address ${address}: ${balance}`)
  return balance
}

/**
 * Get an accounts VTHO balance
 * @param address Account address
 * @returns Balance of VTHO tokens (this is a decimal value)
 */
const getVTHOBalance = async (address: string): Promise<BigNumber> => {
  const balance = await getERC20Balance(address, constants.VTHO_CONTRACT_ADDRESS)
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
  await doERC20Transfer(constants.VTHO_CONTRACT_ADDRESS, address, amount)
}

/**
 * Transfer B3TR tokens from the funding account to another account
 * @param address Address to transfer to
 * @param amount Amount of B3TR to transfer (this is a decimal value)
 */
const fundB3TR = async (address: string, amount: BigNumber) => {
  console.log(`Transferring ${amount} B3TR to ${address}`)
  await doERC20Transfer(constants.B3TR_CONTRACT_ADDRESS, address, amount)
}

/**
 * Convert B3TR for VOT3
 * @param privateKey Private key of account
 * @param address Address of account
 * @param amount Amount of B3TR to convert (this is a decimal value)
 */
const convertB3TRForVOT3 = async (privateKey: Buffer, address: string, amount: BigNumber) => {
  // approve VOT3 contract to spend B3TR
  const approveClause = Clause.callFunction(
    Address.of(constants.B3TR_CONTRACT_ADDRESS),
    ABIContract.ofAbi(ERC20_ABI).getFunction("approve"),
    [constants.VOT3_CONTRACT_ADDRESS, amount.multipliedBy(constants.TOKEN_DECIMALS).toString()],
  )
  const convertToVOT3clause = Clause.callFunction(
    Address.of(constants.VOT3_CONTRACT_ADDRESS),
    ABIContract.ofAbi(JSON.parse(VOT3_convertToVOT3_abi)).getFunction("convertToVOT3"),
    [amount.multipliedBy(constants.TOKEN_DECIMALS).toString()],
  )
  const clauses = [approveClause, convertToVOT3clause]
  const gasResult = await thorClient.gas.estimateGas(clauses, address, { gasPadding: 0.5 })
  const latestBlock = await thorClient.blocks.getBestBlockCompressed()
  const transactionBody = {
    chainTag: constants.THOR_CHAIN_TAG,
    blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : "0x0",
    expiration: 32,
    clauses,
    gasPriceCoef: 0,
    gas: Math.ceil(gasResult.totalGas),
    dependsOn: null,
    nonce: 12345678,
  }

  await signAndSendTx(transactionBody, privateKey)
}

/**
 * Seed an account to have a minimum balance of B3TR and VTHO
 * @param address Account address
 */
const fundAccount = async (
  account_index: number,
  min_b3tr = constants.FUNDING_MIN_B3TR,
  min_vot3 = constants.FUNDING_MIN_VOT3,
) => {
  const privateKey = getAccountPrivateKey(account_index)
  const address = getAccountAddress(account_index)
  console.log(`Seeding account ${address}`)
  const bt3rBalance = await blockchainUtils.getB3TRBalance(address)
  const vthoBalance = await blockchainUtils.getVTHOBalance(address)
  const vot3Balance = await blockchainUtils.getVOT3Balance(address)
  const vot3Needed = min_vot3.minus(vot3Balance)
  const b3trNeeded = min_b3tr.minus(bt3rBalance)
  let totalNeeded = vot3Needed.isGreaterThan(0) ? b3trNeeded.plus(vot3Needed) : b3trNeeded
  if (vthoBalance.isLessThan(constants.FUNDING_MIN_VTHO)) {
    const vthoDiff = vthoBalance.minus(constants.FUNDING_MIN_VTHO).multipliedBy(-1)
    await blockchainUtils.fundVTHO(address, vthoDiff)
  }
  if (totalNeeded.isGreaterThan(0)) {
    // transfer B3TR to account
    await blockchainUtils.fundB3TR(address, totalNeeded)
    // Convert B3TR for VOT3
    if (vot3Needed.isGreaterThan(0)) {
      await blockchainUtils.convertB3TRForVOT3(privateKey, address, vot3Needed)
    }
  }
  console.log(`Account ${address} seeded`)
}

/**
 * Get a random account index
 * @returns The random account index
 */
const getRndAccountIndex = () => {
  const rndIndex = randomAccGenerator.next().value
  console.log(`Random account index: ${rndIndex}`)
  return rndIndex
}

// Wait for the next block to be mined
export const waitForNextBlock = async () => {
  let startingBlock = await thorClient.blocks.getBestBlockCompressed()
  let currentBlock
  do {
    await new Promise(resolve => setTimeout(resolve, 1000))
    currentBlock = await thorClient.blocks.getBestBlockCompressed()
  } while (startingBlock?.number === currentBlock?.number)
}

/**
 * Move the specified number of blocks
 * @param blocks Number of blocks to move
 */
export const moveBlocks = async (blocks: number) => {
  for (let i = 0; i < blocks; i++) {
    await waitForNextBlock()
  }
}

/**
 * Waits for the specified block number
 */
const waitForBlock = async (blockNumber: number) => {
  const currentBlock = await thorClient.blocks.getBestBlockCompressed()
  if (!currentBlock?.number) throw new Error("Could not get current block number")
  if (currentBlock?.number < blockNumber) {
    // Get blocks required to wait
    const blocksToWait = blockNumber - currentBlock?.number
    if (blocksToWait > 0) await moveBlocks(blocksToWait)
  }
  console.log(`Block number ${blockNumber} reached`)
}

/**
 * Waits for the allocation voting cycle to complete
 */
const waitForNextCycle = async () => {
  const response = await thorClient.contracts.executeCall(
    constants.EMISSIONS_CONTRACT_ADDRESS,
    ABIContract.ofAbi(JSON.parse(Emissions_nextCycleBlock_abi)).getFunction("getNextCycleBlock"),
    [],
  )
  const blockNumber = response[0].toString()
  console.log(`Next allocation cycle block number to wait for: ${blockNumber}`)
  await waitForBlock(blockNumber)
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
  convertB3TRForVOT3,
  getRndAccountIndex,
  waitForNextCycle,
}

const signAndSendTx = async (body: TransactionBody, pk: Uint8Array) => {
  const signedTx = Transaction.of(body).sign(Buffer.from(pk))

  const sendTransactionResult = await thorClient.transactions.sendTransaction(signedTx)

  const txReceipt = await thorClient.transactions.waitForTransaction(sendTransactionResult.id)

  if (!txReceipt) {
    throw new Error("Transaction failed")
  }
  if (txReceipt.reverted) {
    throw new Error("Transaction reverted")
  }
}

export default blockchainUtils
