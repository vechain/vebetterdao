import { Button, Icon } from "@chakra-ui/react"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useClaimRewards } from "@/hooks/useClaimRewards"

import { useVotingRewards } from "../../../../api/contracts/rewards/hooks/useVotingRewards"
import { GenericBanner } from "../../Banners/GenericBanner"

const compactFormatter = getCompactFormatter(4)
export type Props = {
  roundsRewardsQuery: ReturnType<typeof useVotingRewards>
  gmRewards: number
}
export const ClaimVotingRewardsBanner = ({ roundsRewardsQuery, gmRewards }: Props) => {
  const { t } = useTranslation()
  const claimRewardsMutation = useClaimRewards({
    roundRewards: roundsRewardsQuery.data?.roundsRewards ?? [],
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
  return (
    <GenericBanner
      variant="info"
      title={t("CLAIM YOUR REWARDS")}
      logoSrc="/assets/icons/claim-b3tr-icon.webp"
      description={
        hasGMRewards
          ? t("Congratulations! You have B3TR to claim for casting your vote in governance and holding GM.")
          : t("Congratulations! You have B3TR to claim for casting your vote in governance.")
      }
      cta={
        <Button onClick={handleClaim} variant="primary">
          <Icon as={UilGift} color="white" />
          {t("Claim your {{b3trToClaim}} B3TR", {
            b3trToClaim: compactFormatter.format(Number(roundsRewardsQuery.data?.totalFormatted ?? 0)),
          })}
        </Button>
      }
    />
  )
}
