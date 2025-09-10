import { useVotingRewards } from "@/api"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { GenericBanner } from "../../Banners/GenericBanner"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, Card, Image } from "@chakra-ui/react"
import { GenericBanner2 } from "../../Banners/GenericBanner2"

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
    <GenericBanner2
      variant="info"
      title={t("CLAIM YOUR REWARDS")}
      logoSrc="/assets/icons/claim-b3tr-icon.webp"
      description={
        hasGMRewards
          ? t("Congratulations! You have B3TR to claim for casting your vote in governance and holding GM.")
          : t("Congratulations! You have B3TR to claim for casting your vote in governance.")
      }
      cta={
        <Button onClick={handleClaim} visual="primary">
          {t("Claim your {{b3trToClaim}} B3TR", {
            b3trToClaim: compactFormatter.format(Number(roundsRewardsQuery.data?.totalFormatted ?? 0)),
          })}
        </Button>
      }
    />
  )

  return (
    <Card.Root variant="warning">
      <Image src="/assets/icons/claim-b3tr-icon.webp" alt="logo" objectFit="cover" w="24" h="24" />

      <Card.Body>
        <Card.Title>{t("CLAIM YOUR REWARDS NOW! 💰")}</Card.Title>
        <Card.Description>
          {hasGMRewards
            ? t("Congratulations! You have B3TR to claim for casting your vote in governance and holding GM.")
            : t("Congratulations! You have B3TR to claim for casting your vote in governance.")}
        </Card.Description>
      </Card.Body>
      <Card.Footer>
        <Button onClick={handleClaim} visual="primary" borderRadius="full">
          {t("Claim your {{b3trToClaim}} B3TR", {
            b3trToClaim: compactFormatter.format(Number(roundsRewardsQuery.data?.totalFormatted ?? 0)),
          })}
        </Button>
      </Card.Footer>
    </Card.Root>
  )

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
