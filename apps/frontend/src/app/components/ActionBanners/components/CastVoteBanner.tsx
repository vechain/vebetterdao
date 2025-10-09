import { Button } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "../../Banners/GenericBanner"
import { useCurrentAllocationsRoundId } from "../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

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
}
