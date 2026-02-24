import { Button, Card, Heading, HStack, Link, Skeleton, Stack, VStack, useDisclosure } from "@chakra-ui/react"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useMaxPointsPerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useGetUserNodes, UserNode } from "@/api/contracts/xNodes/useGetUserNodes"
import { EndorseAppModal } from "@/app/apps/components/EndorseAppModal"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"

import { useAppEndorsers } from "../../../../../api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { useIsAppAdmin } from "../../../../../api/contracts/xApps/hooks/useIsAppAdmin"
import { useIsAppModerator } from "../../../../../api/contracts/xApps/hooks/useIsAppModerator"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../../../constants/AnalyticsEvents"
import { DISCORD_URL } from "../../../../../constants/links"
import { XAppStatus } from "../../../../../types/appDetails"
import AnalyticsUtils from "../../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"

import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"
import { EndorsementDetails } from "./EndorsementDetails"
import { EndorsementStatusCallout } from "./EndorsementStatusCallout"

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
  const { data: rawAppEndorsers, isLoading: isAppEndorsersLoading } = useAppEndorsers(app?.id ?? "")
  const { data: appScoreStr } = useAppEndorsementScore(app?.id ?? "")
  const { data: maxPointsPerAppValue } = useMaxPointsPerApp()
  const appEndorsers = useMemo(() => {
    if (!rawAppEndorsers) return []
    return [...new Set(rawAppEndorsers.map(a => a.toLowerCase()))].map(
      lower => rawAppEndorsers.find(a => a.toLowerCase() === lower) ?? lower,
    )
  }, [rawAppEndorsers])
  const { data: isAppModerator, isLoading: isAppModeratorLoading } = useIsAppModerator(
    app?.id ?? "",
    account?.address ?? "",
  )
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: isAppAdmin, isLoading: isAppAdminLoading } = useIsAppAdmin(app?.id ?? "", account?.address ?? "")
  const isUserRolesDataLoading = isAppModeratorLoading || isAppAdminLoading

  const nodesEndorsingApp = useMemo(
    () =>
      userNodesInfo?.nodesManagedByUser?.filter((node: UserNode) =>
        node.activeEndorsements.some(e => e.appId === app?.id),
      ) ?? [],
    [userNodesInfo, app?.id],
  )
  const firstNodeEndorsing = nodesEndorsingApp[0]

  const userNodesHasPoints = userNodesInfo?.nodesManagedByUser?.some(
    (node: UserNode) => node.availablePoints > BigInt(0),
  )

  const appUnendorsedStatus =
    endorsementStatus === XAppStatus.LOOKING_FOR_ENDORSEMENT ||
    endorsementStatus === XAppStatus.UNENDORSED_AND_ELIGIBLE ||
    endorsementStatus === XAppStatus.UNENDORSED_NOT_ELIGIBLE

  const appBelowMaxCap = useMemo(() => {
    const score = Number(appScoreStr ?? 0)
    const max = Number(maxPointsPerAppValue ?? 110)
    return score < max
  }, [appScoreStr, maxPointsPerAppValue])

  const canReceiveEndorsements =
    appUnendorsedStatus || (endorsementStatus === XAppStatus.ENDORSED_AND_ELIGIBLE && appBelowMaxCap)

  const shouldRenderEndorseButton = useMemo(() => {
    return userNodesHasPoints && canReceiveEndorsements
  }, [userNodesHasPoints, canReceiveEndorsements])

  const shouldRenderLookForEndorsersButton = useMemo(() => {
    return (isAppModerator || isAppAdmin) && appUnendorsedStatus
  }, [isAppModerator, isAppAdmin, appUnendorsedStatus])

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

    if (shouldRenderEndorseButton) {
      buttonComponents.push(
        <Button key="endorseButton" variant="primary" onClick={onOpenEndorsementModal} w="full">
          {t("Endorse {{appName}}", { appName: app?.name ?? "" })}
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
          <Button w="full" variant={shouldRenderEndorseButton ? "secondary" : "primary"}>
            {t("Look for endorsers")}
          </Button>
        </Link>,
      )
    }

    if (firstNodeEndorsing) {
      buttonComponents.push(
        <Button
          key="removeEndorsementButton"
          variant="link"
          rounded="xl"
          mt="4"
          colorPalette="red"
          textStyle="md"
          fontWeight="semibold"
          onClick={onOpenUnendorsementModal}
          w="full">
          {t("Remove endorsement")}
        </Button>,
      )
    }

    return buttonComponents
  }, [
    shouldRenderEndorseButton,
    shouldRenderLookForEndorsersButton,
    firstNodeEndorsing,
    t,
    onOpenEndorsementModal,
    onOpenUnendorsementModal,
    app?.name,
  ])

  return (
    <>
      <Card.Root w={"full"} variant="primary" gap={8}>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" w="full">
            <Heading size="xl">{t("Endorsement")}</Heading>
            <Link
              textStyle="md"
              fontWeight="semibold"
              color="actions.secondary.text-lighter"
              onClick={onOpenEndorsementInfoModal}>
              {t("History")}
              <UilArrowUpRight />
            </Link>
          </HStack>
        </Card.Header>

        <Card.Body>
          <Stack gap={6} w="full">
            <Skeleton loading={isEndorsementStatusLoading}>
              <EndorsementStatusCallout endorsementStatus={endorsementStatus} />
            </Skeleton>

            <Stack direction="column" gap={4} w="full" justify="space-between" alignItems="center">
              <EndorsementDetails
                appId={app?.id ?? ""}
                endorsementScore={endorsementScore}
                endorsementStatus={endorsementStatus}
                endorsementThreshold={endorsementThreshold}
                isEndorsementStatusLoading={isEndorsementStatusLoading}
                isUserAppEndorser={nodesEndorsingApp.length > 0}
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
        appId={app?.id ?? ""}
        appName={app?.name ?? ""}
        isOpen={isUnendorsementModalOpen}
        onClose={onCloseUnendorsementModal}
      />
      <AppEndorsementInfoCardModal
        isOpen={isEndorsementInfoOpen}
        onClose={onCloseEndorsementInfoModal}
        userNode={firstNodeEndorsing}
        appId={app?.id ?? ""}
      />
    </>
  )
}
