import { Button, Icon } from "@chakra-ui/react"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useClaimRewards } from "@/hooks/useClaimRewards"

import { RoundReward } from "../../../../api/contracts/rewards/utils/buildClaimRewardsTx"
import { useIsAutoVotingEnabled } from "../../../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { GenericBanner } from "../../Banners/GenericBanner"

const compactFormatter = getCompactFormatter(4)

export type Props = {
  roundRewards: RoundReward[]
  totalFormatted: number
  gmRewards: number
}

export const ClaimVotingRewardsBanner = ({ roundRewards, totalFormatted, gmRewards }: Props) => {
  const { t } = useTranslation()
  const { data: isAutoVotingEnabled } = useIsAutoVotingEnabled()

  const claimRewardsMutation = useClaimRewards({
    roundRewards: roundRewards,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Claiming rewards...") },
      success: { title: t("Rewards claimed!") },
      error: { title: t("Error claiming rewards!") },
    },
  })

  const handleClaim = useCallback(() => {
    claimRewardsMutation.sendTransaction()
  }, [claimRewardsMutation])

  const hasGMRewards = gmRewards > 0
  const isDisabled = claimRewardsMutation.isLoadingAutoVoting

  const getDescription = () => {
    if (isAutoVotingEnabled) {
      return t("Auto-voting is enabled! Claim your past rewards now. Future ones will be auto.")
    }
    // Manual voting scenario
    if (hasGMRewards) {
      return t("Congratulations! You have B3TR to claim for casting your vote in governance and holding GM.")
    }
    return t("Congratulations! You have B3TR to claim for casting your vote in governance.")
  }

  return (
    <GenericBanner
      title={t("Claim your rewards")}
      illustration="/assets/icons/claim-b3tr-icon.webp"
      description={getDescription()}
      cta={
        <Button size={{ base: "sm", md: "md" }} onClick={handleClaim} variant="primary" disabled={isDisabled}>
          <Icon as={UilGift} color="white" />
          {t("Claim {{b3trToClaim}} B3TR", {
            b3trToClaim: compactFormatter.format(totalFormatted),
          })}
        </Button>
      }
    />
  )
}
