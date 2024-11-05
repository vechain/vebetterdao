import { useIsAppAdmin, useIsAppModerator, useXNode } from "@/api"
import { VeBetterIcon } from "@/components"
import { XAppStatus } from "@/types"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  HStack,
  Link,
  Skeleton,
  Stack,
  Text,
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
import { AppEndorsersSection } from "./AppEndorsersSection"
import { EndorsementStatusCallout } from "./EndorsementStatusCallout"

type Props = {
  endorsementScore?: string
  endorsementStatus: XAppStatus
  endorsementThreshold?: string
  isEndorsementStatusLoading: boolean
  isLargeCard?: boolean
}

export const AppEndorsementInfoCard = ({
  endorsementScore,
  endorsementStatus,
  endorsementThreshold,
  isEndorsementStatusLoading,
  isLargeCard = false,
}: Props) => {
  const { t } = useTranslation()

  const { app } = useCurrentAppInfo()
  // const { account } = useWallet()

  // App endorsement data

  // User roles data
  // const { data: isAppModerator, isLoading: isAppModeratorLoading } = useIsAppModerator(app?.id ?? "", account ?? "")
  // const { data: isAppAdmin, isLoading: isAppAdminLoading } = useIsAppAdmin(app?.id ?? "", account ?? "")

  // const isUserRolesDataLoading = isAppModeratorLoading || isAppAdminLoading

  // // User xnodes, TODO support multiple xnodes
  // const { isXNodeLoading, isEndorsingApp, isXNodeHolder, endorsedApp, xNodePoints } = useXNode()

  // const isUserAppEndorser = useMemo(() => {
  //   if (!app || isXNodeLoading) return false
  //   return isXNodeHolder && isEndorsingApp && compareAddresses(app.id, endorsedApp?.id)
  // }, [app, isXNodeLoading, isXNodeHolder, isEndorsingApp, endorsedApp])

  // const isUserEndorsingOtherApp = useMemo(() => {
  //   if (!app || isXNodeLoading) return false
  //   return isXNodeHolder && isEndorsingApp && !compareAddresses(app.id, endorsedApp?.id)
  // }, [app, isXNodeLoading, isXNodeHolder, isEndorsingApp, endorsedApp])

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
      <Card align={"stretch"} p="24px" gap="24px" border="1px" borderRadius="12px">
        <CardHeader p={0}>
          <HStack justifyContent="space-between" alignItems="flex-end" w="full">
            <Heading fontSize="24px" fontWeight="bold">
              {t("Endorsement")}
            </Heading>
            <Link fontSize="14px" fontWeight="bold" color="#004CFC" onClick={onOpenEndorsementInfoModal}>
              {t("History")}
            </Link>
          </HStack>
        </CardHeader>
        <CardBody p={0}>
          <Stack spacing={3} w="full">
            <Skeleton isLoaded={!isEndorsementStatusLoading}>
              <EndorsementStatusCallout endorsementStatus={endorsementStatus}></EndorsementStatusCallout>
            </Skeleton>
            {/* <HStack spacing={12}>
              <Box>
                <Text fontSize="16px">{t("Current score")}</Text>
                <Skeleton
                  isLoaded={!isEndorsementStatusLoading && !isXNodeLoading}
                  as={HStack}
                  spacing={1}
                  lineHeight={1}
                  align="flex-end">
                  <Text
                    lineHeight={1}
                    fontSize={isUserAppEndorser ? "28px" : "26px"}
                    fontWeight="700"
                    color={SCORE_COLOR_SCHEME[endorsementStatus].textColor}>
                    {endorsementScore}
                  </Text>
                  <Text fontSize="14px" color="#6A6A6A">
                    {t("of {{value}}", { value: endorsementThreshold })}
                  </Text>
                </Skeleton>
              </Box>

              {isUserAppEndorser && (
                <Box>
                  <Text fontSize="16px">{t("Your endorsement")}</Text>
                  <Skeleton isLoaded={!isEndorsementStatusLoading && !isXNodeLoading}>
                    <Text fontSize="28px" fontWeight="700" color="#004CFC">
                      {xNodePoints}
                    </Text>
                  </Skeleton>
                </Box>
              )}
            </HStack> */}

            <Divider />

            <Stack
              direction={["column", "column", isLargeCard ? "row" : "column"]}
              spacing={4}
              w="full"
              justify={"space-between"}>
              {app && <AppEndorsersSection appId={app.id} />}

              {/* <Skeleton isLoaded={!isUserRolesDataLoading && !isEndorsementStatusLoading && !isXNodeLoading}>
                {(isAppModerator || isAppAdmin) &&
                (endorsementStatus === EndorsementStatus.PENDING || endorsementStatus === EndorsementStatus.LOST) ? (
                  <Button
                    leftIcon={<VeBetterIcon color="#004CFC" size={16} />}
                    variant={"primarySubtle"}
                    w={["full", "full", "auto"]}>
                    {t("Look for endorsers")}
                  </Button>
                ) : null}
                {isXNodeHolder && !isEndorsingApp && !(endorsementStatus === EndorsementStatus.SUCCESS) ? (
                  <Button variant={"primaryAction"} onClick={onOpenEndorsementModal} w={["full", "full", "auto"]}>
                    {t("Endorse with your {{value}} points", { value: xNodePoints })}
                  </Button>
                ) : null}
                {isUserEndorsingOtherApp ? (
                  <Button variant={"primaryAction"} onClick={onOpenSwitchEndorsementModal} w={["full", "full", "auto"]}>
                    {t("Switch endorsement to this app")}
                  </Button>
                ) : null}

                {isUserAppEndorser ? (
                  <Button
                    variant={"link"}
                    colorScheme="red"
                    onClick={onOpenUnendorsementModal}
                    w={["full", "full", "auto"]}>
                    {t("Remove endorsement")}
                  </Button>
                ) : null}
              </Skeleton> */}
            </Stack>
          </Stack>
        </CardBody>
      </Card>

      <SwitchEndorsementAppModal
        isOpen={isSwitchEndorsementModalOpen}
        onClose={onCloseSwitchEndorsementModal}
        appIdToEndorse={app?.id}
        appIdToUnendorse={""} // TODO reverse to endorsedApp?.id
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
