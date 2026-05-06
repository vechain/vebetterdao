"use client"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts/factories/GrantsManager__factory"
import { executeCallClause, useThor } from "@vechain/vechain-kit"
import { useCallback, useState } from "react"

import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { uploadBlobToIPFS } from "@/utils/ipfs"

import { mergeExpenditureReport, parseMilestoneMetadataDocument } from "./milestoneMetadataDocument"
import type { ExpenditureReport, GrantFormData } from "./types"

const abi = GrantsManager__factory.abi
const contractAddress = getConfig().grantsManagerContractAddress

export type SubmitExpenditureReportParams = {
  proposalId: string
  report: ExpenditureReport
  fallbackMilestones: GrantFormData["milestones"]
}

/**
 * Builds merged milestone metadata (milestones + expenditure reports), pins to IPFS.
 * Caller must send `updateMilestoneMetadataURI` with the returned CID (proposer only).
 */
export const useSubmitExpenditureReport = () => {
  const thor = useThor()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const submitReport = useCallback(
    async ({ proposalId, report, fallbackMilestones }: SubmitExpenditureReportParams) => {
      try {
        setIsSubmitting(true)
        setError(null)
        if (!thor) return undefined

        const [milestoneMetadataURI] = await executeCallClause({
          thor,
          abi,
          contractAddress,
          method: "getMilestoneMetadataURI",
          args: [BigInt(proposalId)],
        })

        let existingRaw: unknown
        if (milestoneMetadataURI && String(milestoneMetadataURI).length > 0) {
          existingRaw = await getIpfsMetadata<unknown>(`ipfs://${milestoneMetadataURI}`)
        }

        const parsed = parseMilestoneMetadataDocument(existingRaw, fallbackMilestones)
        const merged = mergeExpenditureReport(parsed, report)
        const blob = new Blob([JSON.stringify(merged)], { type: "application/json" })
        const cid = await uploadBlobToIPFS(blob, "grant-milestone-metadata.json")
        return cid
      } catch (err) {
        setError(err as Error)
        console.error("Error building expenditure report metadata:", err)
        return undefined
      } finally {
        setIsSubmitting(false)
      }
    },
    [thor],
  )

  return { submitReport, isSubmitting, error }
}
