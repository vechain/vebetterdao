import { Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useBuyVtho } from "@/hooks/useTransak"

export const LowVthoBanner = () => {
  const { t } = useTranslation()
  const { initTransak } = useBuyVtho()
  return (
    <GenericBanner
      illustration="/assets/icons/lightning.webp"
      title={t("Not enough VTHO")}
      description={t("Get more VTHO to be able to vote and perform transactions!")}
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={initTransak}>
          {t("Get more VTHO")}
        </Button>
      }
    />
  )
}
