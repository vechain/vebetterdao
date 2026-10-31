import { Button } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { BannerStorageKey, GenericBanner } from "@/app/components/Banners/GenericBanner"

import { VePassportThresholdModal } from "../modals/VePassportThresholdModal"

export const VePassportThresholdBanner = () => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <GenericBanner
        title={t("VePassport Activity Threshold Update!")}
        illustration="/assets/icons/new-app-gold.svg"
        description={t(
          "Giving active voters greater influence in governance! Simply perform 1 action per round to maintain your voting eligibility.",
        )}
        storageKey={BannerStorageKey.SHOW_VEPASSPORT_THRESHOLD}
        cta={
          <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={() => setIsModalOpen(true)}>
            {t("Learn more")}
          </Button>
        }
      />
      <VePassportThresholdModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

