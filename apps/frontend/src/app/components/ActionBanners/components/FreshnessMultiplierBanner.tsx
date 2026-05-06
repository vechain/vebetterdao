import { Button } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { BannerStorageKey, GenericBanner } from "@/app/components/Banners/GenericBanner"

import { FreshnessMultiplierModal } from "../modals/FreshnessMultiplierModal"

export const FreshnessMultiplierBanner = () => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <GenericBanner
        title={t("Rewards Multipliers are here!")}
        illustration="/assets/icons/new-app-gold.svg"
        description={t(
          "Lazy votes are over! Refresh your app picks each round and vote with conviction on proposals to earn higher rewards.",
        )}
        storageKey={BannerStorageKey.SHOW_FRESHNESS_MULTIPLIER}
        cta={
          <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={() => setIsModalOpen(true)}>
            {t("Learn more")}
          </Button>
        }
      />
      <FreshnessMultiplierModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
