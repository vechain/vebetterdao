import { useMemo } from "react"

import { useUserCreatedProposal } from "../../../../../hooks/proposals/common/useUserCreatedProposal"

import { PreviewCreatedProposals } from "./PreviewCreatedProposals"

type Props = {
  address: string
  onSeeAll: () => void
  previewSize?: number
}

export const CreatedProposalsSection = ({ address, onSeeAll, previewSize = 3 }: Props) => {
  const { data: createdProposals } = useUserCreatedProposal(address)

  const firstProposals = useMemo(() => createdProposals?.slice(0, previewSize), [createdProposals, previewSize])

  const isMoreProposals = useMemo(() => {
    if (!createdProposals) return false
    return createdProposals.length > previewSize
  }, [createdProposals, previewSize])

  const hasProposals = firstProposals && firstProposals.length > 0

  if (!hasProposals) return null

  return (
    <PreviewCreatedProposals
      firstProposals={firstProposals}
      isMoreProposals={isMoreProposals}
      isCreatedProposals
      onSeeAllProposals={onSeeAll}
    />
  )
}
