import { useWithdrawDeposit } from "@/hooks/useWithdrawDeposit"
import { Button } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../hooks"

export const ProposalWithdrawButton = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()
  const withdrawMutation = useWithdrawDeposit({
    proposalId: proposal.id,
  })

  const withdraw = useCallback(
    (e: React.FormEvent) => {
      withdrawMutation.sendTransaction()
      e.preventDefault()
    },
    [withdrawMutation],
  )
  return (
    <Button variant="primary" onClick={withdraw}>
      {t("Claim your tokens back")}
    </Button>
  )
}
