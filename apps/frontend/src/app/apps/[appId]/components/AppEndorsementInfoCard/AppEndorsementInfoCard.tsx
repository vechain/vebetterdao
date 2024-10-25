import { useAppEndorsers, useIsAppAdmin, useIsAppModerator, useXNode } from "@/api"
import { VeBetterIcon } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import { EndorsementStatus } from "@/types"
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
  VStack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"
import { EndorseAppModal } from "@/app/apps/components/EndorseAppModal"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { SwitchEndorsementAppModal } from "@/app/apps/components/SwitchEndorsementAppModal"
type Props = {
  endorsementScore?: string
  endorsementStatus: EndorsementStatus
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
  const SCORE_COLOR_SCHEME = {
    LOST: {
      cardBorderColor: "#C84968",
      cardBoxShadow: "0px 0px 5px 0px #D23F6366",
      textColor: "#C84968",
    },
    PENDING: {
      cardBorderColor: "#FFE4C3",
      cardBoxShadow: "0px 0px 7.9px 0px #F29B3280",
      textColor: "#F29B32",
    },
    SUCCESS: {
      cardBorderColor: "#D5D5D5",
      cardBoxShadow: "none",
      textColor: "#3DBA67",
    },
    UNKNOWN: {
      cardBorderColor: "#D5D5D5",
      cardBoxShadow: "none",
      textColor: "#6A6A6A",
    },
  }

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

  // Modals
  const {
    isOpen: isEndorsementInfoOpen,
    onOpen: onOpenEndorsementInfoModal,
    onClose: onCloseEndorsementInfoModal,
  } = useDisclosure()
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

  return (
    <>
      <Card
        align={"stretch"}
        p="24px"
        gap="24px"
        border="1px"
        borderRadius="12px"
        borderColor={SCORE_COLOR_SCHEME[endorsementStatus].cardBorderColor}
        boxShadow={SCORE_COLOR_SCHEME[endorsementStatus].cardBoxShadow}>
        <CardHeader p={0}>
          <Heading fontSize="24px" fontWeight="bold">
            {t("Endorsement")}
          </Heading>
          <Skeleton isLoaded={!isEndorsementStatusLoading}>
            <Text pt={3} fontSize="14px" color="#6A6A6A">
              <Trans
                i18nKey="A dApp has to reach {{value}} endorsement points to join allocations."
                values={{ value: endorsementThreshold }}
                t={t}
              />
              {/* <Link pl={1} color="#004CFC">
                {t("Know more")}
              </Link> */}
            </Text>
          </Skeleton>
        </CardHeader>
        <CardBody p={0}>
          <Stack spacing={3} w="full">
            <HStack spacing={12}>
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
            </HStack>

            <Divider />

            <Stack
              direction={["column", "column", isLargeCard ? "row" : "column"]}
              spacing={4}
              w="full"
              justify={"space-between"}>
              <Skeleton isLoaded={!isAppEndorsersLoading && !isUserRolesDataLoading}>
                {appEndorsers && appEndorsers.length ? (
                  <HStack justify={"space-between"} w="full">
                    <HStack>
                      <HStack>
                        {appEndorsers.map((endorser: string, index: number) => (
                          <Box key={index}>
                            <AddressIcon address={endorser} rounded="full" h="20px" w="20px" />
                          </Box>
                        ))}
                      </HStack>
                      <Text as="span" fontSize="14px" fontWeight="bold">
                        {appEndorsers.length > 1
                          ? t("{{value}}-x-node-users", { value: appEndorsers.length })
                          : t("1-x-node-user")}
                      </Text>
                    </HStack>
                    <Link fontSize="14px" color="#004CFC" onClick={onOpenEndorsementInfoModal}>
                      {t("See all")}
                    </Link>
                  </HStack>
                ) : (
                  <VStack>
                    <Text fontSize="14px" fontWeight="bold">
                      {isAppModerator || isAppAdmin ? t("Nobody is endorsing your app") : t("Not endorsed by anyone")}
                      <br />
                      <Link fontSize="14px" color="#004CFC" onClick={onOpenEndorsementInfoModal}>
                        {t("See endorsement history")}
                      </Link>
                    </Text>
                  </VStack>
                )}
              </Skeleton>

              <Skeleton isLoaded={!isUserRolesDataLoading && !isEndorsementStatusLoading && !isXNodeLoading}>
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
              </Skeleton>
            </Stack>
          </Stack>
        </CardBody>
      </Card>
      <AppEndorsementInfoCardModal
        isOpen={isEndorsementInfoOpen}
        onClose={onCloseEndorsementInfoModal}
        appId={app?.id || ""}
      />
      <SwitchEndorsementAppModal
        isOpen={isSwitchEndorsementModalOpen}
        onClose={onCloseSwitchEndorsementModal}
        appIdToEndorse={app?.id}
        appIdToUnendorse={endorsedApp?.id}
      />

      <EndorseAppModal isOpen={isEndorsementModalOpen} onClose={onCloseEndorsementModal} xApp={app} />

      <UnendorseAppModal isOpen={isUnendorsementModalOpen} onClose={onCloseUnendorsementModal} />
    </>
  )
}
