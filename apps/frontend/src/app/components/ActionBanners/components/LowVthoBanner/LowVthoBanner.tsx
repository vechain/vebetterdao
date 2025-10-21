import { Button, Icon } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useBuyVtho } from "@/hooks/useTransak"

export const LowVthoBanner = () => {
  const { t } = useTranslation()
  const { initTransak } = useBuyVtho()
  return (
    <GenericBanner
      variant="info"
      illustration="/assets/icons/lightning.webp"
      title={t("NOT ENOUGH VTHO")}
      description={t("Get more VTHO to be able to vote and perform transactions!")}
      cta={
        <Button variant="secondary" onClick={initTransak}>
          {t("Get more VTHO")}
          <Icon as={UilArrowRight} />
        </Button>
      }
    />
  )
}
