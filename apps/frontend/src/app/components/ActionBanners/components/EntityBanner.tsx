import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const EntityBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const goToLinking = useCallback(() => {
    router.push("/profile?tab=linked-accounts")
  }, [router])

  return (
    <GenericBanner
      title={t("This is a linked account")}
      description={t("This wallet is set as an entity linked to another account. Switch to your main account to vote.")}
      illustration="/assets/icons/info-bell.webp"
      cta={
        <Button p="0" size={{ base: "sm", md: "md" }} variant="link" onClick={goToLinking}>
          {t("Manage linked accounts")}
        </Button>
      }
    />
  )
}
