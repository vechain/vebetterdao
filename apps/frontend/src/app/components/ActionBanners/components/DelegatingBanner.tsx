import { useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { SnapshotExplainationModal } from "@/app/components/Countdown/SnapshotExplainationModal"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const DelegatingBanner = () => {
  const { t } = useTranslation()

  const description = t(
    "Your voting power has been transferred to VeDelegate. To be able to vote, you must be the primary account at snapshot.",
  )

  const whatIsSnapshot = useDisclosure()

  return (
    <>
      <GenericBanner
        title={t("Voting Power Delegated")}
        description={description}
        logoSrc="https://vedelegate.vet/logo.eac72ee8.svg"
        backgroundColor="#FFD979"
        backgroundImageSrc=""
        buttonLabel={t("Know more")}
        onButtonClick={whatIsSnapshot.onOpen}
        buttonVariant="outline"
        buttonIcon={<UilInfoCircle />}
      />
      <SnapshotExplainationModal isOpen={whatIsSnapshot.isOpen} onClose={whatIsSnapshot.onClose} />
    </>
  )
}
