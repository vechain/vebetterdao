import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"

export const getProposalUserDeposit = async (
  thor: ThorClient,
  env: EnvConfig,
  proposalId: string,
  userAddress: string,
): Promise<string> => {
  if (!proposalId) return Promise.reject(new Error("proposalId is required"))
  if (!userAddress) return Promise.reject(new Error("userAddress is required"))

  const governanceContractAddress = getConfig(env).b3trGovernorAddress

  const res = await thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .read.getUserDeposit(proposalId, userAddress)

  if (!res) return Promise.reject(new Error("Get user deposit call failed"))

  return res[0].toString()
}

export const getProposalUserDepositQueryKey = (proposalId: string, userAddress: string) => [
  "proposal",
  proposalId,
  "userDeposit",
  userAddress,
]

export const useProposalUserDeposit = (env: EnvConfig, proposalId: string, userAddress: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getProposalUserDepositQueryKey(proposalId, userAddress),
    queryFn: async () => await getProposalUserDeposit(thor, env, proposalId, userAddress),
    enabled: !!thor && !!proposalId && !!userAddress,
  })
}
