import {
  useAllocationsRound,
  useAppEndorsers,
  useCurrentAllocationsRoundId,
  useIsAppAdmin,
  useIsAppModerator,
  useXNode,
} from "@/api"
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
import { useWallet } from "@vechain/vechain-kit"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { SwitchEndorsementAppModal } from "@/app/apps/components/SwitchEndorsementAppModal"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"
import { EndorsementStatusCallout } from "./EndorsementStatusCallout"
import { EndorsementDetails } from "./EndorsementDetails"
import { buttonClickActions, buttonClicked, ButtonClickProperties, DISCORD_URL } from "@/constants"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import dayjs from "dayjs"
import { GenericAlert } from "@/app/components/Alert"

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
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(currentRoundId)
  // User roles data
  const { data: isAppModerator, isLoading: isAppModeratorLoading } = useIsAppModerator(
    app?.id ?? "",
    account?.address ?? "",
  )
  const { data: isAppAdmin, isLoading: isAppAdminLoading } = useIsAppAdmin(app?.id ?? "", account?.address ?? "")
  const isUserRolesDataLoading = isAppModeratorLoading || isAppAdminLoading

  // User xnodes, TODO support multiple xnodes
  const {
    isXNodeLoading,
    isEndorsingApp,
    isXNodeHolder,
    endorsedApp,
    xNodePoints,
    isXNodeDelegator,
    isXNodeOnCooldown,
  } = useXNode()

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

  const shouldRenderRemoveEndorsementButton = useMemo(() => {
    return isUserAppEndorser
  }, [isUserAppEndorser])
  const lookForEndorsersButtonVariant =
    !shouldRenderEndorseButton && !shouldRenderSwitchEndorsementButton ? "primaryAction" : "primarySubtle"

  const shouldDisableEndorsementButton = useMemo(() => {
    return isXNodeDelegator || isXNodeOnCooldown || xNodePoints === 0
  }, [isXNodeDelegator, isXNodeOnCooldown, xNodePoints])

  const shouldDisplayCooldownAlert = useMemo(() => {
    return account && isXNodeOnCooldown && isUserAppEndorser
  }, [account, isXNodeOnCooldown, isUserAppEndorser])
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

  const actionButtons = useMemo(() => {
    const buttonComponents = []

    if (shouldDisplayCooldownAlert) {
      buttonComponents.push(
        <GenericAlert
          type="error"
          isLoading={roundInfoLoading}
          message={t("You cannot change your endorsement until the start of the next round, on {{roundStartDate}}.", {
            roundStartDate: dayjs(roundInfo?.voteEndTimestamp).format("MMMM D"),
          })}
        />,
      )
    }

    if (shouldRenderEndorseButton) {
      buttonComponents.push(
        <Button
          key="endorseButton"
          variant="primaryAction"
          onClick={onOpenEndorsementModal}
          isDisabled={shouldDisableEndorsementButton}
          w="full">
          {t("Endorse with your {{value}} points", { value: xNodePoints })}
        </Button>,
      )
    }

    if (shouldRenderSwitchEndorsementButton) {
      buttonComponents.push(
        <Button
          key="switchEndorsementButton"
          variant="primaryAction"
          onClick={onOpenSwitchEndorsementModal}
          isDisabled={shouldDisableEndorsementButton}
          w="full">
          {t("Switch endorsement to this app")}
        </Button>,
      )
    }

    if (shouldRenderLookForEndorsersButton) {
      buttonComponents.push(
        <Link
          key="lookForEndorsersButton"
          href={DISCORD_URL}
          isExternal
          w="full"
          onClick={() =>
            AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_DISCORD))
          }>
          <Button w="full" variant={lookForEndorsersButtonVariant}>
            {t("Look for endorsers")}
          </Button>
        </Link>,
      )
    }

    if (shouldRenderRemoveEndorsementButton) {
      buttonComponents.push(
        <Button
          key="removeEndorsementButton"
          variant="link"
          colorScheme="red"
          onClick={onOpenUnendorsementModal}
          w="full"
          isDisabled={shouldDisableEndorsementButton}>
          {t("Remove endorsement")}
        </Button>,
      )
    }

    return buttonComponents
  }, [
    shouldDisplayCooldownAlert,
    shouldRenderEndorseButton,
    shouldRenderSwitchEndorsementButton,
    shouldRenderLookForEndorsersButton,
    xNodePoints,
    onOpenEndorsementModal,
    onOpenSwitchEndorsementModal,
    onOpenUnendorsementModal,
    lookForEndorsersButtonVariant,
    t,
    roundInfo,
    roundInfoLoading,
    shouldDisableEndorsementButton,
    shouldRenderRemoveEndorsementButton,
  ])

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
              {actionButtons}
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
