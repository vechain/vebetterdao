import { networkConfig } from "@/config"
import Contract from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import { TokenDetails } from "../b3tr"
const abi = Contract.abi

const VOT3_CONTRACT = networkConfig.vot3ContractAddress

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
        totalSupply: "0"
    }
}

/**
*  Get the vot3 balance of an address from the contract
* @param thor  The thor instance
* @param address  The address to get the balance of. If not provided, will return an error (for better react-query DX)
* @returns {Promise<string>}  The balance of the address
*/
export const getVot3Balance = async (thor: Connex.Thor, address?: string): Promise<string> => {
    if (!address) return Promise.reject(new Error("Address not provided"))
    const functionAbi = abi.find(e => e.name === "balanceOf")
    if (!functionAbi) return Promise.reject(new Error("Function abi not found for balanceOf"))
    const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call(address)

    if (res.vmError) return Promise.reject(new Error(res.vmError))
    return res.decoded[0]
}