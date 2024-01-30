import { getConfig } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import { TokenDetails } from ".."
import { FormattingUtils } from "@repo/utils"
import { TokenBalance } from ".."
const abi = Contract.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 *  Get the b3tr token details from the contract. circulatingSupply and totalSupply are scaled down to the decimals of the token
 * @param thor
 * @returns  {Promise<{name: string, symbol: string, decimals: number, totalSupply: string}>}
 */
//TODO: Implement this with contract call
export const getVot3TokenDetails = async (thor: Connex.Thor): Promise<TokenDetails> => {
  // const functionAbi = abi.find(e => e.name === "tokenDetails")
  // if (!functionAbi) return Promise.reject(new Error("Function abi not found for tokenDetails"))
  // const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call()

  // if (res.vmError) return Promise.reject(new Error(res.vmError))

  return {
    name: "VOT3",
    symbol: "VOT3",
    decimals: 18,
    circulatingSupply: "0",
    totalSupply: "0",
  }
}

/**
 *  Get the vot3 balance of an address from the contract
 * @param thor  The thor instance
 * @param address  The address to get the balance of. If not provided, will return an error (for better react-query DX)
 * @param scaleDecimals  The decimals of the token. Defaults to 18
 * @returns Balance of the token in the form of {@link TokenBalance} (original, scaled down and formatted)
 */
export const getVot3Balance = async (
  thor: Connex.Thor,
  address?: string,
  tokenDecimals: number = 18,
): Promise<TokenBalance> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  const functionAbi = abi.find(e => e.name === "balanceOf")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for balanceOf"))
  const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = FormattingUtils.scaleNumberDown(original, tokenDecimals)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

/**
 * Build the clause to stake B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildStakeB3trTx = (
  thor: Connex.Thor,
  amount: string | number,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = abi.find(e => e.name === "stake")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals)

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(amountWithDecimals)

  return {
    ...clause,
    comment: `Stake ${formattedAmount} B3TR`,
    abi: functionAbi,
  }
}

/**
 * Build the clause to unstake B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildUnstakeStakeB3trTx = (
  thor: Connex.Thor,
  amount: string | number,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = abi.find(e => e.name === "unstake")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals)

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(amountWithDecimals)

  return {
    ...clause,
    comment: `Unstake ${formattedAmount} B3TR`,
    abi: functionAbi,
  }
}

/**
 *  Get the vot3 balance of an address from the contract
 * @param thor  The thor instance
 * @param address  The address to check the delegates of. If not provided, will return an error (for better react-query DX)
 * @returns the address chosen as delegate
 */
export const getVot3Delegates = async (thor: Connex.Thor, address?: string): Promise<string> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  const functionAbi = abi.find(e => e.name === "delegates")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}
/**
 * Build the clause to delegate votes to the given address (used to delegate votes to the governance contract)
 * @param thor thor instance
 * @param address the address to mint the tokens to
 * @returns the clause to delegate votes
 */
export const buildDelegateVot3Tx = (thor: Connex.Thor, address: string): Connex.Vendor.TxMessage[0] => {
  const functionAbi = abi.find(e => e.name === "delegate")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(address)

  const formattedAddress = FormattingUtils.humanAddress(address)

  return {
    ...clause,
    comment: `Delegate VOT£ to ${formattedAddress}`,
    abi: functionAbi,
  }
}
