import { Button } from "@chakra-ui/react"
import { t } from "i18next"
import Link from "next/link"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export type Props = {
  isLegacyNode?: boolean
}
export const StargateMigrationBanner = ({ isLegacyNode }: Props) => {
  return (
    <GenericBanner
      variant="b3mo"
      illustration="/assets/images/b3mo-stargate-greet.webp"
      title={t("Stargate is live")}
      description={
        isLegacyNode
          ? t("Migrate your legacy node to discover the new stargate universe !")
          : t("Start staking VET to explore the new stargate universe !")
      }
      cta={
        <Button asChild variant="primary">
          <Link href="https://app.stargate.vechain.org/" target="_blank" rel="noopener noreferrer">
            {t("Explore")}
          </Link>
        </Button>
      }
    />
  )
}
