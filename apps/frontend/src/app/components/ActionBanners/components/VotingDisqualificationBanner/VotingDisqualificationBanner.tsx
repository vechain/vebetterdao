import { useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { SnapshotExplainationModal } from "@/app/components/Countdown/SnapshotExplainationModal"

export const VotingDisqualificationBanner = () => {
  const { t } = useTranslation()

  //todo : add here condition to check either voting power transferred to vedelegate, or to passport
  const description = t(
    "Your voting power has been transferred to your linked passport account. Switch to your primary account to participate in voting.",
  )
  const whatIsSnapshot = useDisclosure()

  return (
    <>
      <GenericBanner
        title={t("Voting Power Transferred 🔀")}
        description={description}
        logoSrc="/images/info-bell.png"
        backgroundColor="#FFD979"
        backgroundImageSrc="/images/cloud-background-orange.png"
        buttonLabel={t("Know more")}
        onButtonClick={whatIsSnapshot.onOpen}
        buttonVariant="outline"
        buttonIcon={<UilInfoCircle />}
      />
      <SnapshotExplainationModal isOpen={whatIsSnapshot.isOpen} onClose={whatIsSnapshot.onClose} />
    </>
  )
}
