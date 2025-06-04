import { useQuery } from "@tanstack/react-query"
import { useThor, TokenBalance } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { FormattingUtils } from "@repo/utils"
import { getConfig } from "@repo/config"
import { VOT3__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"
import { EnvConfig } from "@repo/config/contracts"

/**
 * Get the vot3 balance of an address from the contract
 * @param thor - The thor instance
 * @param env - The environment config
 * @param address - The address to get the balance of. If not provided, will return an error (for better react-query DX)
 * @returns Balance of the token in the form of {@link TokenBalance} (original, scaled down and formatted)
 */
export const getVot3Balance = async (thor: ThorClient, env: EnvConfig, address?: string): Promise<TokenBalance> => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const vot3ContractAddress = getConfig(env).vot3ContractAddress

  const res = await thor.contracts.load(vot3ContractAddress, VOT3__factory.abi).read.balanceOf(address)

  if (!res) return Promise.reject(new Error("Balance call failed"))

  const original = res[0].toString()
  const scaled = ethers.formatEther(res[0] as bigint)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getVot3BalanceQueryKey = (address: string) => ["balance", "vot3", address]

export const useVot3Balance = (env: EnvConfig, address?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getVot3BalanceQueryKey(address ?? ""),
    queryFn: () => getVot3Balance(thor, env, address),
    enabled: !!address,
  })
}
