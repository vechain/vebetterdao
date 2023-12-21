import Contract from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
const abi = Contract.abi


const B3TR_CONTRACT = process.env.NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS
if (!B3TR_CONTRACT) throw new Error("NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS not set")


/**
 *  Get the b3tr token details from the contract
 * @param thor 
 * @returns  {Promise<{name: string, symbol: string, decimals: number, totalSupply: string}>}
 */

type TokenDetails = {
    name: string,
    symbol: string,
    decimals: number,
    circulatingSupply: string,
    totalSupply: string
}
export const getB3trTokenDetails = async (thor: Connex.Thor): Promise<TokenDetails> => {
    const functionAbi = abi.find((e) => e.name === "tokenDetails")
    if (!functionAbi) return Promise.reject(new Error("Function abi not found for tokenDetails"))
    const res = await thor
        .account(B3TR_CONTRACT)
        .method(functionAbi)
        .call()

    console.log(res)
    if (res.vmError) return Promise.reject(new Error(res.vmError))


    return {
        name: res.decoded[0],
        symbol: res.decoded[1],
        decimals: res.decoded[2],
        circulatingSupply: res.decoded[3],
        totalSupply: res.decoded[4]
    }
}