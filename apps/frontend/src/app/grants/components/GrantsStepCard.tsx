import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { InfoStep, InfoStepsCard } from "@/components/InfoStepsCard"

import { useMetProposalCriteria } from "../../../api/contracts/governance/hooks/useMetProposalCriteria"
import { ProposalType } from "../../../types/proposals"
import { RequirementModal } from "../../proposals/components/components/RequirementModal"

export type { InfoStep as Step } from "@/components/InfoStepsCard"

export const GrantsStepsCard = ({
  steps,
  isOpen,
  onClose,
}: {
  steps: InfoStep[]
  isOpen: boolean
  onClose: () => void
}) => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { open: openWalletModal } = useWalletModal()

  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false)
  const openRequirementModal = useCallback(() => setIsRequirementModalOpen(true), [])
  const closeRequirementModal = useCallback(() => setIsRequirementModalOpen(false), [])

  const { hasMetProposalCriteria } = useMetProposalCriteria(ProposalType.GRANT)

  const handleApply = useCallback(() => {
    if (!account?.address) {
      return openWalletModal()
    }

    if (!hasMetProposalCriteria) {
      onClose()
      return openRequirementModal()
    }
    router.push("/grants/new")
  }, [account?.address, hasMetProposalCriteria, router, openWalletModal, onClose, openRequirementModal])

  return (
    <>
      <InfoStepsCard
        steps={steps}
        isOpen={isOpen}
        onClose={onClose}
        lastStepButtonText={t("Apply")}
        onLastStep={handleApply}
      />
      <RequirementModal
        isOpen={isRequirementModalOpen}
        onClose={closeRequirementModal}
        hasNft={hasMetProposalCriteria}
        isGrants
      />
    </>
  )
}
