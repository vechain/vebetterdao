import { Button } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useProposalClaimableUserDeposits } from "../../../../api/contracts/governance/hooks/useProposalClaimableUserDeposits"
import { useWithdrawDeposits } from "../../../../hooks/useWithdrawDeposits"
import { GenericBanner } from "../../Banners/GenericBanner"

const compactFormatter = getCompactFormatter(2)

export const ClaimDepositsBanner = () => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const { data: { totalClaimableDeposits, claimableDeposits } = { totalClaimableDeposits: 0, claimableDeposits: [] } } =
    useProposalClaimableUserDeposits(account?.address ?? "")
  const { sendTransaction } = useWithdrawDeposits({
    proposalDeposits: claimableDeposits,
  })

  const handleClaim = useCallback(() => {
    sendTransaction()
  }, [sendTransaction])

  const formattedDeposits = useMemo(() => {
    return compactFormatter.format(Number(ethers.formatEther(totalClaimableDeposits)))
  }, [totalClaimableDeposits])

  return (
    <GenericBanner
      title={t("Claim your tokens back")}
      illustration="/assets/icons/claim-b3tr-icon.webp"
      description={t(
        "You have {{votesToClaim}} VOT3 tokens ready to be claimed from supporting {{amountProposals}} proposals.",
        {
          votesToClaim: formattedDeposits,
          amountProposals: claimableDeposits.length,
        },
      )}
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={handleClaim}>
          {t("Claim back")}
        </Button>
      }
    />
  )
}
