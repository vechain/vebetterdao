import { useVotingRewards } from "@/api"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { GenericBanner } from "../../Banners/GenericBanner"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(4)

export type Props = {
  roundsRewardsQuery: ReturnType<typeof useVotingRewards>
}

export const ClaimVotingRewardsBanner = ({ roundsRewardsQuery }: Props) => {
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

  return (
    <GenericBanner
      title={t("CLAIM YOUR REWARDS NOW! 💰")}
      titleColor="#3A5798"
      description={t("Congratulations! You have B3TR to claim for casting your vote in governance.")}
      descriptionColor="#0C2D75"
      logoSrc="/images/claim-b3tr-icon.png"
      backgroundColor="#C8DDFF"
      backgroundImageSrc="/images/cloud-background.png"
      buttonLabel={t("Claim your {{b3trToClaim}} B3TR", {
        b3trToClaim: compactFormatter.format(Number(roundsRewardsQuery.data?.totalFormatted ?? 0)),
      })}
      onButtonClick={handleClaim}
      buttonVariant="primaryAction"
      buttonIcon={<UilGift color="white" />}
      buttonIconPosition="left"
    />
  )
}
