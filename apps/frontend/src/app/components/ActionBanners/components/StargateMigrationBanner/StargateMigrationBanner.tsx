import { Button, Icon } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { t } from "i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export type Props = {
  isLegacyNode?: boolean
}
export const StargateMigrationBanner = ({ isLegacyNode }: Props) => {
  const GOTOSTARGATE = () => {
    window.open("https://app.stargate.vechain.org/", "_blank", "noopener noreferrer")
  }
  return (
    <GenericBanner
      variant="info"
      title={t("STARGATE IS LIVE 🌌")}
      description={
        isLegacyNode
          ? t("Migrate your legacy node to discover the new stargate universe !")
          : t("Start staking VET to explore the new stargate universe !")
      }
      illustration="/assets/images/b3mo-stargate.svg"
      cta={
        <Button variant="primary" onClick={GOTOSTARGATE}>
          {t("Explore")}
          <Icon as={UilArrowRight} />
        </Button>
      }
    />
  )
}
