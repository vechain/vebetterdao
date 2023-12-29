import { networkConfig } from "@/config"
import Contract from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import { FormattingUtils } from "@repo/utils"
const abi = Contract.abi

const B3TR_CONTRACT = networkConfig.b3trContractAddress

/**
 *  Get the b3tr token details from the contract. circulatingSupply and totalSupply are scaled down to the decimals of the token
 * @param thor 
 * @returns  {Promise<{name: string, symbol: string, decimals: number, totalSupply: string}>}
 */

export type TokenDetails = {
    name: string
    symbol: string
    decimals: number
    circulatingSupply: string
    totalSupply: string
}
export const getB3trTokenDetails = async (thor: Connex.Thor): Promise<TokenDetails> => {

    const functionAbi = abi.find(e => e.name === "tokenDetails")
    if (!functionAbi) return Promise.reject(new Error("Function abi not found for tokenDetails"))
    const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call()
    console.log({ res })

    if (res.vmError) return Promise.reject(new Error(res.vmError))


    return {
        name: res.decoded[0],
        symbol: res.decoded[1],
        decimals: res.decoded[2],
        circulatingSupply: FormattingUtils.scaleNumberDown(res.decoded[3], res.decoded[2]),
        totalSupply: FormattingUtils.scaleNumberDown(res.decoded[4], res.decoded[2])
    }
}

/**
 *  Get the b3tr balance of an address from the contract
 * @param thor  The thor instance
 * @param address  The address to get the balance of. If not provided, will return an error (for better react-query DX)
 * @returns {Promise<string>}  The balance of the address
 */
export const getB3trBalance = async (thor: Connex.Thor, address?: string): Promise<string> => {
    if (!address) return Promise.reject(new Error("Address not provided"))
    const functionAbi = abi.find(e => e.name === "balanceOf")
    if (!functionAbi) return Promise.reject(new Error("Function abi not found for balanceOf"))
    const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call(address)

    if (res.vmError) return Promise.reject(new Error(res.vmError))
    return res.decoded[0]
}

/**
 * Build the clause to mint B3TR tokens for the given address and amount
    * @param thor thor instance
    * @param address the address to mint the tokens to
    * @param amount the amount of tokens to mint. Should not already include decimals
    * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildMintB3trTx = (
    thor: Connex.Thor,
    address: string,
    amount: string | number,
    decimals = 18,
): Connex.Vendor.TxMessage[0] => {
    const functionAbi = abi.find((e) => e.name === "mint")
    if (!functionAbi) throw new Error("Function abi not found for mint")

    const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
    const formattedAddress = FormattingUtils.humanAddress(address)
    const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals)

    const clause = thor
        .account(B3TR_CONTRACT)
        .method(functionAbi)
        .asClause(address, amountWithDecimals)

    return {
        ...clause,
        comment: `Mint ${formattedAmount} B3TR to ${formattedAddress}`,
        abi: functionAbi,
    }
}
