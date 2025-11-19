import { Button, useDisclosure } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useUserScore } from "@/api/indexer/sustainability/useUserScore"
import { BannerStorageKey, GenericBanner } from "@/app/components/Banners/GenericBanner"

import { DoActionModal } from "./components/DoActionModal"

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
        storageKey={BannerStorageKey.SHOW_DO_ACTION}
        title={t("Time to step up!")}
        description={description}
        illustration="/assets/icons/info-bell.webp"
        cta={
          <Button p="0" size={{ base: "sm", md: "md" }} variant="link" onClick={doActionModal.onOpen}>
            {t("Learn more")}
          </Button>
        }
      />
      <DoActionModal doActionModal={doActionModal} />
    </>
  )
}
