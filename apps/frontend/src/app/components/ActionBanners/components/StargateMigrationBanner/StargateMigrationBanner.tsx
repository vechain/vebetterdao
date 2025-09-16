import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { t } from "i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { Button, Icon } from "@chakra-ui/react"

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
      logoSrc="/assets/images/b3mo-stargate.svg"
      cta={
        <Button variant="primary" onClick={GOTOSTARGATE}>
          {t("Explore")}
          <Icon as={UilArrowRight} />
        </Button>
      }
    />
  )
}
