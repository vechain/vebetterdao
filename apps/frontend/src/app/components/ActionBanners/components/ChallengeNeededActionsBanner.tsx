import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "../../Banners/GenericBanner"

export const ChallengeNeededActionsBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const handleOpenChallenges = useCallback(() => {
    router.push("/challenges")
  }, [router])

  return (
    <GenericBanner
      variant="b3mo"
      title={t("Check quests")}
      description={t("Some quests need your attention.")}
      illustration="/assets/mascot/present-zoom.png"
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="secondary" onClick={handleOpenChallenges}>
          {t("Go to quests")}
        </Button>
      }
    />
  )
}
