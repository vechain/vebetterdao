"use client"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"

import { uploadBlobToIPFS } from "@/utils/ipfs"

import { ExpenditureReport } from "./types"
import { getExpenditureReportQueryKey } from "./useExpenditureReport"
import { useExpenditureReportStore } from "./useExpenditureReportStore"

/**
 * Hook to submit an expenditure report to IPFS and store the CID locally.
 */
export const useSubmitExpenditureReport = (proposalId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { setReportCid } = useExpenditureReportStore()
  const queryClient = useQueryClient()

  const submitReport = useCallback(
    async (report: ExpenditureReport) => {
      try {
        setIsSubmitting(true)
        setError(null)

        const blob = new Blob([JSON.stringify(report)], { type: "application/json" })
        const cid = await uploadBlobToIPFS(blob, "expenditure-report.json")

        setReportCid(proposalId, cid)

        // Invalidate the query so the view updates
        queryClient.invalidateQueries({ queryKey: getExpenditureReportQueryKey(proposalId) })

        return cid
      } catch (err) {
        setError(err as Error)
        console.error("Error submitting expenditure report:", err)
        return undefined
      } finally {
        setIsSubmitting(false)
      }
    },
    [proposalId, setReportCid, queryClient],
  )

  return { submitReport, isSubmitting, error }
}
