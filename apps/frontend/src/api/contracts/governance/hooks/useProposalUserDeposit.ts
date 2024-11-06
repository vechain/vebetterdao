import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
const b3trGovernorAbi = B3TRGovernorJson.abi
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

export const getProposalUserDeposit = async (
  thor: Connex.Thor,
  proposalId: string,
  userAddress: string,
): Promise<string> => {
  if (!proposalId) return Promise.reject(new Error("proposalId is required"))
  if (!userAddress) return Promise.reject(new Error("userAddress is required"))
  const getUserDepositAbi = b3trGovernorAbi.find(abi => abi.name === "getUserDeposit")
  if (!getUserDepositAbi) throw new Error("quorum function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(getUserDepositAbi).call(proposalId, userAddress)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getProposalUserDepositQueryKey = (proposalId: string, userAddress: string) => [
  "proposal",
  proposalId,
  "userDeposit",
  userAddress,
]

export const useProposalUserDeposit = (proposalId: string, userAddress: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalUserDepositQueryKey(proposalId, userAddress),
    queryFn: async () => await getProposalUserDeposit(thor, proposalId, userAddress),
    enabled: !!thor && !!proposalId && !!userAddress,
  })
}
