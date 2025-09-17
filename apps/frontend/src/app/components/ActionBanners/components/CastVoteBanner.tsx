import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useCurrentAllocationsRoundId } from "@/api"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { GenericBanner } from "../../Banners/GenericBanner"
import { Button } from "@chakra-ui/react"

export const CastVoteBanner = () => {
  const { t } = useTranslation()
  const { data: roundId } = useCurrentAllocationsRoundId()

  const router = useRouter()
  const handleVote = useCallback(() => {
    router.push(`/rounds/${roundId}/vote`)
  }, [router, roundId])

  return (
    <GenericBanner
      variant="warning"
      title={t("CAST YOUR VOTE NOW! ⚖️")}
      logoSrc="/assets/icons/vote-icon.webp"
      description={t("It’s time to make your voice heard in this round and earn exciting rewards!")}
      cta={
        <Button variant="primary" onClick={handleVote}>
          {t("See round")}
          <UilArrowRight color="white" />
        </Button>
      }
    />
  )

  // return (
  //   <GenericBanner
  //     title={t("CAST YOUR VOTE NOW! ⚖️")}
  //     titleColor="#3A5798"
  //     description={t("It’s time to make your voice heard in this round and earn exciting rewards!")}
  //     descriptionColor="#0C2D75"
  //     logoSrc="/assets/icons/vote-icon.webp"
  //     backgroundColor="#B1F16C"
  //     backgroundImageSrc="/assets/backgrounds/community-green-blob.webp"
  //     buttonLabel={t("See round")}
  //     onButtonClick={handleVote}
  //     buttonvariant="primary"
  //     buttonIcon={<UilArrowRight color="white" />}
  //   />
  // )
}
