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
      title={t("CLAIM YOUR REWARDS NOW! 💰")}
      titleColor="#3A5798"
      description={
        hasGMRewards
          ? t("Congratulations! You have B3TR to claim for casting your vote in governance and holding GM.")
          : t("Congratulations! You have B3TR to claim for casting your vote in governance.")
      }
      descriptionColor="#0C2D75"
      logoSrc="/assets/icons/claim-b3tr-icon.webp"
      backgroundColor="#C8DDFF"
      backgroundImageSrc="/assets/backgrounds/cloud-background.webp"
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
