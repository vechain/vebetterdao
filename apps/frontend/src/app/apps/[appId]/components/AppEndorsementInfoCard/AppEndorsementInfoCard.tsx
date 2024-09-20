import {
  useAppEndorsers,
  useIsAppAdmin,
  useIsAppModerator,
  useNodesEndorsedApps,
  useNodesEndorsementScore,
  useUserEndorsementScore,
  useUserXNodes,
} from "@/api"
import { VeBetterIcon } from "@/components"
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
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AppEndorsementInfoCardModal } from "./AppEndorsementInfoCardModal"
import { AddressIcon } from "@/components/AddressIcon"
import { useMemo } from "react"
import { EndorseAppModal } from "@/app/apps/components/EndorseAppModal"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useWallet } from "@vechain/dapp-kit-react"
import { isAddressInListOfAddresses } from "@repo/utils/AddressUtils"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"
import { useCurrentAppEndorsementStatus } from "../../hooks"

export const AppEndorsementInfoCard = () => {
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
  const { data: appEndorsers, isLoading: appEndorsersLoading } = useAppEndorsers(app?.id ?? "")
  const {
    isLoading: isEndorsementStatusLoading,
    score: endorsementScore,
    status: endorsementStatus,
    threshold: endorsementThreshold,
  } = useCurrentAppEndorsementStatus()

  // User data
  const { data: isAppModerator } = useIsAppModerator(app?.id ?? "", account ?? "")
  const { data: isAppAdmin } = useIsAppAdmin(app?.id ?? "", account ?? "")

  // User x-nodes, endorsements and score
  const { data: userXNodes } = useUserXNodes()
  const { data: nodesLevelToEndorsementScore } = useNodesEndorsementScore()
  const { data: endorsedApps } = useNodesEndorsedApps(userXNodes?.map(node => node.id) ?? [])
  const { data: userEndorsementScore, isLoading: userEndorsementScoreLoading } = useUserEndorsementScore(account)

  //TODO: Support multiple nodes
  const availablePoints = useMemo(() => {
    if (!userXNodes || !nodesLevelToEndorsementScore || !endorsedApps) return 0

    const availableNodes = userXNodes.filter((_node, index) => !endorsedApps[index]?.endorsedApp)
    return availableNodes.reduce((acc, node) => acc + Number(nodesLevelToEndorsementScore[Number(node.level)]), 0) ?? 0
  }, [userXNodes, nodesLevelToEndorsementScore, endorsedApps])

  const isUserAppEndorser = useMemo(() => {
    if (!account || !appEndorsers) return false
    return isAddressInListOfAddresses(account, appEndorsers)
  }, [account, appEndorsers])

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

  return (
    <Card
      h="full"
      w="100%"
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
            <Link pl={1} color="#004CFC">
              {t("Know more")}
            </Link>
          </Text>
        </Skeleton>
      </CardHeader>

      <CardBody p={0}>
        <Stack spacing={3} w="full">
          <Skeleton isLoaded={!isEndorsementStatusLoading && !appEndorsersLoading && !userEndorsementScoreLoading}>
            <HStack spacing={3}>
              <Box>
                <Text fontSize="16px">{t("Current score")}</Text>
                <Box display="flex" alignItems="center">
                  <Text fontSize="36px" fontWeight="700" color={SCORE_COLOR_SCHEME[endorsementStatus].textColor}>
                    {endorsementScore}
                  </Text>
                  <Text fontSize="14px" color="#6A6A6A" pt={4} pl={1}>
                    {t("of {{value}}", { value: endorsementThreshold })}
                  </Text>
                </Box>
              </Box>

              {isUserAppEndorser && (
                <Box>
                  <Text fontSize="16px">{t("Your endorsement")}</Text>
                  <Box display="flex" alignItems="center">
                    <Text fontSize="36px" fontWeight="700" color="#004CFC">
                      {userEndorsementScore}
                    </Text>
                  </Box>
                </Box>
              )}
            </HStack>
          </Skeleton>

          <Divider />

          <Skeleton isLoaded={!appEndorsersLoading}>
            <Box textAlign="center">
              {appEndorsers && appEndorsers.length ? (
                <HStack justify={"space-between"}>
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
                  <Link fontSize="14px" color="#004CFC" onClick={onOpenEndorsementInfoModal}>
                    {t("See all")}
                  </Link>
                </HStack>
              ) : (
                <Text fontSize="14px" fontWeight="bold">
                  {isAppModerator || isAppAdmin ? t("Nobody is endorsing your app") : t("Not endorsed by anyone")}
                </Text>
              )}
            </Box>
          </Skeleton>

          <Box textAlign="center" py={6}>
            <Stack spacing={4} align="center">
              {(isAppModerator || isAppAdmin) &&
                (endorsementStatus === EndorsementStatus.PENDING || endorsementStatus === EndorsementStatus.LOST) && (
                  <Button
                    leftIcon={<VeBetterIcon color="#004CFC" size={16} />}
                    w="full"
                    borderRadius="full"
                    color="#E0E9FE"
                    display="flex"
                    alignItems="center">
                    <Text fontSize="18px" fontWeight="500" color="#004CFC">
                      {t("Look for endorsers")}
                    </Text>
                  </Button>
                )}
              {availablePoints > 0 && (
                <Button variant={"primaryAction"} onClick={onOpenEndorsementModal}>
                  {t("Endorse with your {{value}} points", { value: availablePoints })}
                </Button>
              )}
              {isUserAppEndorser && (
                <Button variant={"ghost"} fontWeight="500" color="#C84968" onClick={onOpenUnendorsementModal}>
                  {t("Remove endorsement")}
                </Button>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardBody>

      <AppEndorsementInfoCardModal
        isOpen={isEndorsementInfoOpen}
        onClose={onCloseEndorsementInfoModal}
        appId={app?.id || ""}
      />

      <EndorseAppModal isOpen={isEndorsementModalOpen} onClose={onCloseEndorsementModal} xApp={app} />

      <UnendorseAppModal isOpen={isUnendorsementModalOpen} onClose={onCloseUnendorsementModal} />
    </Card>
  )
}
