import { VECHAIN_DEFAULT_MNEMONIC } from "@vechain/hardhat-vechain"
import { HDNode, unitsUtils, type IHDNode } from "@vechain/sdk-core"

export type SeedAccount = {
  address: string
  privateKey: Buffer
  amount: bigint
}

export enum SeedStrategy {
  RANDOM,
  FIXED,
  LINEAR,
}

const hdnode = HDNode.fromMnemonic(VECHAIN_DEFAULT_MNEMONIC.split(" "))

export const getAccounts = (count: number): IHDNode[] => {
  const accounts = []
  for (let i = 0; i < count; i++) {
    accounts.push(hdnode.derive(i))
  }

  return accounts
}

/**
 * Generates a random starting balance for an account
 * Lower balances are favoured based on a log scale
 * @param min
 * @param max
 * @returns
 */
const getRandomStartingBalance = (min: number, max: number): bigint => {
  const scale = Math.log(max) - Math.log(min)
  const random = Math.random() ** 6 // Raise to a power to skew towards smaller values.
  const result = Math.exp(Math.log(min) + scale * random)
  return unitsUtils.parseVET(Math.floor(result).toString())
}

/**
 * Get seed accounts based on the strategy
 * @param strategy the strategy to use
 * @param numAccounts the number of accounts to generate
 * @param acctOffset the offset to start the account index
 * @returns a list of seed accounts
 */
export const getSeedAccounts = (strategy: SeedStrategy, numAccounts: number, acctOffset: number): SeedAccount[] => {
  switch (strategy) {
    case SeedStrategy.RANDOM:
      return getSeedAccountsRandom(numAccounts, acctOffset)
    case SeedStrategy.LINEAR:
      return getSeedAccountsLinear(numAccounts, acctOffset)
    case SeedStrategy.FIXED:
      return getSeedAccountsFixed(numAccounts, acctOffset)
    default:
      throw new Error("Unknown seed strategy")
  }
}

const getSeedAccountsFixed = (numAccounts: number, acctOffset: number): SeedAccount[] => {
  const accounts = getAccounts(numAccounts + acctOffset)

  const seedAccounts: SeedAccount[] = []

  accounts.slice(acctOffset).forEach(account => {
    if (!account.privateKey) {
      throw new Error("Account does not have a private key")
    }
    seedAccounts.push({
      address: account.address,
      privateKey: account.privateKey,
      amount: unitsUtils.parseVET("500"),
    })
  })

  return seedAccounts
}

const getSeedAccountsRandom = (numAccounts: number, acctOffset: number): SeedAccount[] => {
  const accounts = getAccounts(numAccounts + acctOffset)

  const seedAccounts: SeedAccount[] = []

  accounts.slice(acctOffset).forEach(account => {
    if (!account.privateKey) {
      throw new Error("Account does not have a private key")
    }
    seedAccounts.push({
      address: account.address,
      privateKey: account.privateKey,
      amount: getRandomStartingBalance(5, 1000),
    })
  })

  return seedAccounts
}

const getSeedAccountsLinear = (numAccounts: number, acctOffset: number): SeedAccount[] => {
  const accounts = getAccounts(numAccounts + acctOffset)

  const seedAccounts: SeedAccount[] = []

  accounts.slice(acctOffset).forEach((account, index) => {
    if (!account.privateKey) {
      throw new Error("Account does not have a private key")
    }
    seedAccounts.push({
      address: account.address,
      privateKey: account.privateKey,
      amount: unitsUtils.parseVET(((index + 1) * 5).toFixed(2)),
    })
  })

  return seedAccounts
}
