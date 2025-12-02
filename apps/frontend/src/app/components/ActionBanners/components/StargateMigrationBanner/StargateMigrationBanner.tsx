import { Button } from "@chakra-ui/react"
import { t } from "i18next"
import Link from "next/link"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { STARGATE_APP_URL } from "@/constants/links"

export const StargateMigrationBanner = () => {
  return (
    <GenericBanner
      illustration="/assets/3d-illustrations/node.webp"
      title={t("Migrate your Legacy Node")}
      description={t(
        "Your Node is outdated. Endorsements and Galaxy Member benefits are no longer active. Migrate to Stargate to restore full functionality.",
      )}
      cta={
        <Button size={{ base: "sm", md: "md" }} asChild variant="primary" maxWidth="max-content">
          <Link href={STARGATE_APP_URL} target="_blank" rel="noopener noreferrer">
            {t("Migrate now")}
          </Link>
        </Button>
      }
    />
  )
}
