import { useQuery } from "@tanstack/react-query"

import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"

import { ExpenditureReport } from "./types"
import { useExpenditureReportStore } from "./useExpenditureReportStore"

/**
 * Returns the query key for fetching an expenditure report.
 */
export const getExpenditureReportQueryKey = (proposalId: string) => ["expenditureReport", proposalId]

/**
 * Hook to fetch the expenditure report for a grant proposal.
 * Reads the IPFS CID from local store and fetches the report from IPFS.
 */
export const useExpenditureReport = (proposalId: string) => {
  const { getReportCid } = useExpenditureReportStore()
  const cid = getReportCid(proposalId)

  return useQuery({
    queryKey: getExpenditureReportQueryKey(proposalId),
    queryFn: async () => {
      if (!cid) return null
      const report = await getIpfsMetadata<ExpenditureReport>(`ipfs://${cid}`)
      return report ?? null
    },
    enabled: !!cid,
  })
}
