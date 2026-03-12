import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"
import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { ProposalType } from "@/hooks/proposals/grants/types"

const governorAddress = getConfig().b3trGovernorAddress

const executedAbi = [
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ name: "proposalId", type: "uint256", indexed: false }],
  },
] as const

const createdAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "targets", type: "address[]", indexed: false },
      { name: "values", type: "uint256[]", indexed: false },
      { name: "signatures", type: "string[]", indexed: false },
      { name: "calldatas", type: "bytes[]", indexed: false },
      { name: "description", type: "string", indexed: false },
      { name: "roundIdVoteStart", type: "uint256", indexed: true },
      { name: "depositThreshold", type: "uint256", indexed: false },
    ],
  },
] as const

const createdWithTypeAbi = [
  {
    type: "event",
    name: "ProposalCreatedWithType",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "proposalType", type: "uint8", indexed: false },
    ],
  },
] as const

type ProposalInfo = { id: string; title: string; isGrant: boolean }

export const useExecutedProposalsByTxId = () => {
  const thor = useThor()

  const { data: executedEvents } = useQuery({
    queryKey: ["treasury-proposal-executed-events"],
    queryFn: () =>
      fetchContractEvents({
        thor,
        abi: executedAbi,
        contractAddress: governorAddress,
        eventName: "ProposalExecuted",
      }),
    enabled: !!thor,
    staleTime: 5 * 60 * 1000,
  })

  const txIdToProposalId = useMemo(() => {
    if (!executedEvents?.length) return {}
    const map: Record<string, string> = {}
    for (const e of executedEvents) {
      map[(e.meta.txID ?? "").toLowerCase()] = e.decodedData.args.proposalId.toString()
    }
    return map
  }, [executedEvents])

  const proposalIds = useMemo(() => [...new Set(Object.values(txIdToProposalId))], [txIdToProposalId])

  const { data: proposalInfoMap } = useQuery({
    queryKey: ["treasury-proposal-info", proposalIds],
    queryFn: async (): Promise<Record<string, ProposalInfo>> => {
      const [createdEvents, typeEvents] = await Promise.all([
        fetchContractEvents({
          thor,
          abi: createdAbi,
          contractAddress: governorAddress,
          eventName: "ProposalCreated",
        }),
        fetchContractEvents({
          thor,
          abi: createdWithTypeAbi,
          contractAddress: governorAddress,
          eventName: "ProposalCreatedWithType",
        }),
      ])

      const typeMap = new Map<string, number>()
      for (const e of typeEvents) {
        typeMap.set(e.decodedData.args.proposalId.toString(), Number(e.decodedData.args.proposalType))
      }

      const idsSet = new Set(proposalIds)
      const matchingCreated = createdEvents.filter(e => idsSet.has(e.decodedData.args.proposalId.toString()))

      const results: Record<string, ProposalInfo> = {}
      await Promise.all(
        matchingCreated.map(async e => {
          const id = e.decodedData.args.proposalId.toString()
          const ipfsHash = e.decodedData.args.description
          const isGrant = typeMap.get(id) === ProposalType.Grant

          let title = isGrant ? "Grant Proposal" : "Governance Proposal"
          if (ipfsHash) {
            try {
              const metadata = await getIpfsMetadata<{ title?: string; projectName?: string }>(`ipfs://${ipfsHash}`)
              if (metadata?.title) title = metadata.title
              else if (metadata?.projectName) title = metadata.projectName
            } catch {
              /* use fallback title */
            }
          }

          results[id] = { id, title, isGrant }
        }),
      )
      return results
    },
    enabled: !!thor && proposalIds.length > 0,
    staleTime: Infinity,
  })

  const proposalByTxId = useMemo(() => {
    if (!proposalInfoMap) return {}
    const map: Record<string, ProposalInfo> = {}
    for (const [txId, proposalId] of Object.entries(txIdToProposalId)) {
      const info = proposalInfoMap[proposalId]
      if (info) map[txId] = info
    }
    return map
  }, [txIdToProposalId, proposalInfoMap])

  return { data: proposalByTxId, isLoading: !executedEvents }
}
