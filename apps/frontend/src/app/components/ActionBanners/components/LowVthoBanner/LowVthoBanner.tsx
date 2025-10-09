import { Button, Icon } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

import { useBuyVtho } from "@/hooks/useTransak"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const LowVthoBanner = () => {
  const { t } = useTranslation()
  const { initTransak } = useBuyVtho()
  return (
    <GenericBanner
      variant="warning"
      logoSrc="/assets/icons/lightning.webp"
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
