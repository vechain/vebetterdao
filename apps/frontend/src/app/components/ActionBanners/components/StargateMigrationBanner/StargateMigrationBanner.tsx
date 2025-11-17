import { Button } from "@chakra-ui/react"
import { t } from "i18next"
import Link from "next/link"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { STARGATE_APP_URL } from "@/constants/links"
export type Props = { isLegacyNode?: boolean }

export const StargateMigrationBanner = ({ isLegacyNode }: Props) => {
  return (
    <GenericBanner
      illustration="/assets/3d-illustrations/node.webp"
      title={t("Migrate your Node NFT before December 2")}
      description={
        isLegacyNode
          ? t("You still hold an outdated NFT. Migrate before December 2 to avoid losing your endorsement capability.")
          : t("Start staking VET to explore the new stargate universe !")
      }
      cta={
        <Button size={{ base: "sm", md: "md" }} asChild variant="primary" maxWidth="max-content">
          <Link href={STARGATE_APP_URL} target="_blank" rel="noopener noreferrer">
            {isLegacyNode ? t("Migrate now") : t("Explore")}
          </Link>
        </Button>
      }
    />
  )
}
