import {
  useAllocationsRound,
  useAppEndorsers,
  useCurrentAllocationsRoundId,
  useIsAppAdmin,
  useIsAppModerator,
} from "@/api"
import { XAppStatus } from "@/types"
import { Button, Card, Heading, HStack, Link, Skeleton, Stack, VStack, useDisclosure } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useWallet } from "@vechain/vechain-kit"
import { EndorsementStatusCallout } from "./EndorsementStatusCallout"
import { EndorsementDetails } from "./EndorsementDetails"
import { buttonClickActions, buttonClicked, ButtonClickProperties, DISCORD_URL } from "@/constants"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import dayjs from "dayjs"
import { GenericAlert } from "@/app/components/Alert"
import { useGetUserNodes } from "@/api/contracts/xNodes/useGetUserNodes"
import { EndorseAppModal } from "@/app/apps/components/EndorseAppModal"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"

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

  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes()
  const nodeEndorsingApp = userNodes?.allNodes?.find(node => node.endorsedAppId === app?.id)
  const isXNodeHolder = userNodes?.allNodes?.some(node => node.isXNodeHolder && !node.endorsedAppId)
  const totalXNodePoints = Math.max(
    ...(userNodes?.allNodes?.filter(node => !node.endorsedAppId).map(node => node.xNodePoints) ?? []),
  )

  // Call to actions
  const appUnendorsedStatus =
    endorsementStatus === XAppStatus.LOOKING_FOR_ENDORSEMENT ||
    endorsementStatus === XAppStatus.UNENDORSED_AND_ELIGIBLE ||
    endorsementStatus === XAppStatus.UNENDORSED_NOT_ELIGIBLE

  const shouldRenderEndorseButton = useMemo(() => {
    return isXNodeHolder && !nodeEndorsingApp && appUnendorsedStatus
  }, [isXNodeHolder, nodeEndorsingApp, appUnendorsedStatus])

  const shouldRenderLookForEndorsersButton = useMemo(() => {
    return (isAppModerator || isAppAdmin) && appUnendorsedStatus
  }, [isAppModerator, isAppAdmin, appUnendorsedStatus])

  const lookForEndorsersButtonVariant = !shouldRenderEndorseButton ? "primaryAction" : "primarySubtle"

  const shouldDisableEndorsementButton = useMemo(() => {
    return (
      nodeEndorsingApp?.isXNodeDelegator || nodeEndorsingApp?.isXNodeOnCooldown || nodeEndorsingApp?.xNodePoints === 0
    )
  }, [nodeEndorsingApp])

  const shouldDisplayCooldownAlert = useMemo(() => {
    return account && nodeEndorsingApp?.isXNodeOnCooldown && nodeEndorsingApp?.nodeId === app?.id
  }, [account, app?.id, nodeEndorsingApp?.isXNodeOnCooldown, nodeEndorsingApp?.nodeId])

  // // Modals
  const {
    open: isEndorsementModalOpen,
    onOpen: onOpenEndorsementModal,
    onClose: onCloseEndorsementModal,
  } = useDisclosure()
  const {
    open: isUnendorsementModalOpen,
    onOpen: onOpenUnendorsementModal,
    onClose: onCloseUnendorsementModal,
  } = useDisclosure()
  const {
    open: isEndorsementInfoOpen,
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
          disabled={shouldDisableEndorsementButton}
          w="full">
          {t("Endorse with your {{value}} points", { value: totalXNodePoints })}
        </Button>,
      )
    }

    if (shouldRenderLookForEndorsersButton) {
      buttonComponents.push(
        <Link
          key="lookForEndorsersButton"
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
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

    if (nodeEndorsingApp) {
      buttonComponents.push(
        <Link asChild>
          <Button
            key="removeEndorsementButton"
            variant="plain"
            color="red.300"
            textStyle="md"
            fontWeight="semibold"
            onClick={onOpenUnendorsementModal}
            w="full"
            disabled={shouldDisableEndorsementButton}>
            {t("Remove endorsement")}
          </Button>
        </Link>,
      )
    }

    return buttonComponents
  }, [
    shouldDisplayCooldownAlert,
    shouldRenderEndorseButton,
    shouldRenderLookForEndorsersButton,
    nodeEndorsingApp,
    roundInfoLoading,
    t,
    roundInfo?.voteEndTimestamp,
    onOpenEndorsementModal,
    shouldDisableEndorsementButton,
    totalXNodePoints,
    lookForEndorsersButtonVariant,
    onOpenUnendorsementModal,
  ])

  return (
    <>
      <Card.Root w={"full"} variant="baseWithBorder">
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" w="full">
            <Heading size="xl">{t("Endorsement")}</Heading>
            <Link
              textStyle="md"
              fontWeight="semibold"
              color="actions.secondary.text-lighter"
              onClick={onOpenEndorsementInfoModal}>
              {t("History")}
            </Link>
          </HStack>
        </Card.Header>

        <Card.Body>
          <Stack gap={4} w="full">
            <Skeleton loading={isEndorsementStatusLoading}>
              <EndorsementStatusCallout endorsementStatus={endorsementStatus}></EndorsementStatusCallout>
            </Skeleton>

            <Stack direction="column" gap={4} w="full" justify="space-between" alignItems="center">
              <EndorsementDetails
                appId={app?.id ?? ""}
                endorsementScore={endorsementScore}
                endorsementStatus={endorsementStatus}
                endorsementThreshold={endorsementThreshold}
                isEndorsementStatusLoading={isEndorsementStatusLoading}
                isUserAppEndorser={!!nodeEndorsingApp}
                endorsers={appEndorsers || []}
                isAppEndorsersLoading={isAppEndorsersLoading}></EndorsementDetails>
            </Stack>
          </Stack>
        </Card.Body>
        {actionButtons.length > 0 && (
          <Card.Footer>
            <Skeleton loading={isUserRolesDataLoading || isEndorsementStatusLoading || isUserNodesLoading} w="full">
              <VStack gap={2} w={"full"}>
                {actionButtons}
              </VStack>
            </Skeleton>
          </Card.Footer>
        )}
      </Card.Root>

      <EndorseAppModal xApp={app} isOpen={isEndorsementModalOpen} onClose={onCloseEndorsementModal} />
      <UnendorseAppModal
        xNodeId={nodeEndorsingApp?.nodeId ?? ""}
        isOpen={isUnendorsementModalOpen}
        onClose={onCloseUnendorsementModal}
      />
      <AppEndorsementInfoCardModal
        isOpen={isEndorsementInfoOpen}
        onClose={onCloseEndorsementInfoModal}
        userNode={nodeEndorsingApp}
        appId={app?.id ?? ""}
      />
    </>
  )
}
