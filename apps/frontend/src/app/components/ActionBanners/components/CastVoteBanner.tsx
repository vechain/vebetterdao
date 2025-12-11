import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "../../Banners/GenericBanner"

export const CastVoteBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const handleVote = useCallback(() => {
    router.push(`/allocations/vote`)
  }, [router])

  return (
    <GenericBanner
      title={t("Cast your vote now!")}
      illustration="/assets/icons/vote-icon.webp"
      description={t("It’s time to make your voice heard in this round and earn exciting rewards!")}
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={handleVote}>
          {t("See round")}
        </Button>
      }
    />
  )
}
