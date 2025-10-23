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
      illustration="/assets/mascot/mascot-explore-dapps@1x.webp"
      title={t("Stargate is live")}
      description={
        isLegacyNode
          ? t("Migrate your legacy node to discover the new stargate universe !")
          : t("Start staking VET to explore the new stargate universe !")
      }
      cta={
        <Button size={{ base: "sm", md: "md" }} asChild variant="primary" maxWidth="max-content">
          <Link href="https://app.stargate.vechain.org/" target="_blank" rel="noopener noreferrer">
            {t("Explore")}
          </Link>
        </Button>
      }
    />
  )
}
