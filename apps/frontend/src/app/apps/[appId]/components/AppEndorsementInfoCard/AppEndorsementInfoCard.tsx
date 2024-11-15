import { useAppEndorsers, useIsAppAdmin, useIsAppModerator, useXNode } from "@/api"
import { XAppStatus } from "@/types"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
  HStack,
  Link,
  Skeleton,
  Stack,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { EndorseAppModal } from "@/app/apps/components/EndorseAppModal"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { SwitchEndorsementAppModal } from "@/app/apps/components/SwitchEndorsementAppModal"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"
import { EndorsementStatusCallout } from "./EndorsementStatusCallout"
import { EndorsementDetails } from "./EndorsementDetails"

type Props = {
  endorsementScore?: string
  endorsementStatus: XAppStatus
  endorsementThreshold?: string
  isEndorsementStatusLoading: boolean
}

export const AppEndorsementInfoCard = ({
  endorsementScore,
  endorsementStatus,
  endorsementThreshold,
  isEndorsementStatusLoading,
}: Props) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { account } = useWallet()

  // App endorsement data
  const { data: appEndorsers, isLoading: isAppEndorsersLoading } = useAppEndorsers(app?.id ?? "")

  // User roles data
  const { data: isAppModerator, isLoading: isAppModeratorLoading } = useIsAppModerator(app?.id ?? "", account ?? "")
  const { data: isAppAdmin, isLoading: isAppAdminLoading } = useIsAppAdmin(app?.id ?? "", account ?? "")
  const isUserRolesDataLoading = isAppModeratorLoading || isAppAdminLoading

  // User xnodes, TODO support multiple xnodes
  const { isXNodeLoading, isEndorsingApp, isXNodeHolder, endorsedApp, xNodePoints } = useXNode()

  const isUserAppEndorser = useMemo(() => {
    if (!app || isXNodeLoading) return false
    return isXNodeHolder && isEndorsingApp && compareAddresses(app.id, endorsedApp?.id)
  }, [app, isXNodeLoading, isXNodeHolder, isEndorsingApp, endorsedApp])

  const isUserEndorsingOtherApp = useMemo(() => {
    if (!app || isXNodeLoading) return false
    return isXNodeHolder && isEndorsingApp && !compareAddresses(app.id, endorsedApp?.id)
  }, [app, isXNodeLoading, isXNodeHolder, isEndorsingApp, endorsedApp])

  // Call to actions
  const appUnendorsedStatus =
    endorsementStatus === XAppStatus.LOOKING_FOR_ENDORSEMENT ||
    endorsementStatus === XAppStatus.UNENDORSED_AND_ELIGIBLE ||
    endorsementStatus === XAppStatus.UNENDORSED_NOT_ELIGIBLE

  const shouldRenderEndorseButton = useMemo(() => {
    return isXNodeHolder && !isEndorsingApp && appUnendorsedStatus
  }, [isXNodeHolder, isEndorsingApp, appUnendorsedStatus])

  const shouldRenderSwitchEndorsementButton = useMemo(() => {
    return isXNodeHolder && isUserEndorsingOtherApp && appUnendorsedStatus
  }, [isXNodeHolder, isUserEndorsingOtherApp, appUnendorsedStatus])

  const shouldRenderLookForEndorsersButton = useMemo(() => {
    return (isAppModerator || isAppAdmin) && appUnendorsedStatus
  }, [isAppModerator, isAppAdmin, appUnendorsedStatus])
  const lookForEndorsersButtonVariant =
    !shouldRenderEndorseButton && !shouldRenderSwitchEndorsementButton ? "primaryAction" : "primarySubtle"

  // Modals
  const {
    isOpen: isEndorsementModalOpen,
    onOpen: onOpenEndorsementModal,
    onClose: onCloseEndorsementModal,
  } = useDisclosure()
  const {
    isOpen: isUnendorsementModalOpen,
    onOpen: onOpenUnendorsementModal,
    onClose: onCloseUnendorsementModal,
  } = useDisclosure()
  const {
    isOpen: isSwitchEndorsementModalOpen,
    onOpen: onOpenSwitchEndorsementModal,
    onClose: onCloseSwitchEndorsementModal,
  } = useDisclosure()

  const {
    isOpen: isEndorsementInfoOpen,
    onOpen: onOpenEndorsementInfoModal,
    onClose: onCloseEndorsementInfoModal,
  } = useDisclosure()

  return (
    <>
      <Card w={"full"} variant="baseWithBorder">
        <CardHeader>
          <HStack justifyContent="space-between" alignItems="flex-end" w="full">
            <Heading size="md">{t("Endorsement")}</Heading>
            <Link fontSize="16px" fontWeight={600} color="#004CFC" onClick={onOpenEndorsementInfoModal}>
              {t("History")}
            </Link>
          </HStack>
        </CardHeader>

        <CardBody py={0}>
          <Stack spacing={4} w="full">
            <Skeleton isLoaded={!isEndorsementStatusLoading}>
              <EndorsementStatusCallout endorsementStatus={endorsementStatus}></EndorsementStatusCallout>
            </Skeleton>

            <Stack direction="column" spacing={4} w="full" justify="space-between" alignItems="center">
              <EndorsementDetails
                endorsementScore={endorsementScore}
                endorsementStatus={endorsementStatus}
                endorsementThreshold={endorsementThreshold}
                isEndorsementStatusLoading={isEndorsementStatusLoading}
                xNodePoints={xNodePoints}
                isUserAppEndorser={isUserAppEndorser}
                isXNodeLoading={isXNodeLoading}
                endorsers={appEndorsers || []}
                isAppEndorsersLoading={isAppEndorsersLoading}></EndorsementDetails>
            </Stack>
          </Stack>
        </CardBody>
        <CardFooter>
          <Skeleton isLoaded={!isUserRolesDataLoading && !isEndorsementStatusLoading && !isXNodeLoading} w="full">
            <VStack spacing={2} w={"full"}>
              {shouldRenderEndorseButton && (
                <Button variant={"primaryAction"} onClick={onOpenEndorsementModal} w="full">
                  {t("Endorse with your {{value}} points", { value: xNodePoints })}
                </Button>
              )}

              {shouldRenderSwitchEndorsementButton && (
                <Button variant={"primaryAction"} onClick={onOpenSwitchEndorsementModal} w="full">
                  {t("Switch endorsement to this app")}
                </Button>
              )}

              {shouldRenderLookForEndorsersButton && (
                <Button variant={lookForEndorsersButtonVariant} w="full">
                  {t("Look for endorsers")}
                </Button>
              )}

              {isUserAppEndorser && (
                <Button variant={"link"} colorScheme="red" onClick={onOpenUnendorsementModal} w="full">
                  {t("Remove endorsement")}
                </Button>
              )}
            </VStack>
          </Skeleton>
        </CardFooter>
      </Card>

      <SwitchEndorsementAppModal
        isOpen={isSwitchEndorsementModalOpen}
        onClose={onCloseSwitchEndorsementModal}
        appIdToEndorse={app?.id}
        appIdToUnendorse={endorsedApp?.id}
      />

      <EndorseAppModal isOpen={isEndorsementModalOpen} onClose={onCloseEndorsementModal} xApp={app} />

      <UnendorseAppModal isOpen={isUnendorsementModalOpen} onClose={onCloseUnendorsementModal} />

      <AppEndorsementInfoCardModal
        isOpen={isEndorsementInfoOpen}
        onClose={onCloseEndorsementInfoModal}
        appId={app?.id ?? ""}
      />
    </>
  )
}
