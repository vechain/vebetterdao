import { Button, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { DoActionModal } from "./components/DoActionModal"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useUserScore } from "@/api/indexer/sustainability/useUserScore"
import { useMemo } from "react"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const DoActionBanner = () => {
  const { t } = useTranslation()
  const doActionModal = useDisclosure()
  const { isUserDelegatee, isLoading: isLoadingUserScore } = useUserScore()

  const description = useMemo(() => {
    if (isUserDelegatee)
      return t("Your delegator has to complete Better Actions in our apps and unlock your right to vote.")
    return t("Complete Better Actions in our apps and unlock your right to vote. Make your impact count!")
  }, [t, isUserDelegatee])

  if (isLoadingUserScore) return null

  return (
    <>
      <GenericBanner
        variant="warning"
        title={t("TIME TO STEP UP! 🏃🏼‍♂️")}
        description={description}
        logoSrc="/assets/icons/info-bell.webp"
        cta={
          <Button variant="primary" onClick={doActionModal.onOpen}>
            <UilInfoCircle />
            {t("Know more")}
          </Button>
        }
      />
      <DoActionModal doActionModal={doActionModal} />
    </>
  )
}
