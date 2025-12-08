import { Button, Icon } from "@chakra-ui/react"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useClaimRewards } from "@/hooks/useClaimRewards"

import { useVotingRewards } from "../../../../api/contracts/rewards/hooks/useVotingRewards"
import { useIsAutoVotingEnabled } from "../../../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { GenericBanner } from "../../Banners/GenericBanner"

const compactFormatter = getCompactFormatter(4)
const EMPTY_ROUND_REWARDS: never[] = []
export type Props = {
  roundsRewardsQuery: ReturnType<typeof useVotingRewards>
  gmRewards: number
}
export const ClaimVotingRewardsBanner = ({ roundsRewardsQuery, gmRewards }: Props) => {
  const { t } = useTranslation()
  const { data: isAutoVotingEnabled } = useIsAutoVotingEnabled()

  const claimRewardsMutation = useClaimRewards({
    roundRewards: roundsRewardsQuery.data?.roundsRewards ?? EMPTY_ROUND_REWARDS,
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
        <Button size={{ base: "sm", md: "md" }} onClick={handleClaim} variant="primary">
          <Icon as={UilGift} color="white" />
          {t("Claim {{b3trToClaim}} B3TR", {
            b3trToClaim: compactFormatter.format(Number(roundsRewardsQuery.data?.totalFormatted ?? 0)),
          })}
        </Button>
      }
    />
  )
}
