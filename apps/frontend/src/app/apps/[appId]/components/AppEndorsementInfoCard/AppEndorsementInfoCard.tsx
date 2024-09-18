import {
  useAppEndorsementScore,
  useAppEndorsers,
  useAppExists,
  useEndorsementScoreThreshold,
  useIsAppAdmin,
  useIsAppModerator,
  useNodesEndorsedApps,
  useNodesEndorsementScore,
  useUserEndorsementScore,
  useUserXNodes,
} from "@/api"
import { VeBetterIcon } from "@/components"
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

enum AppEndorsementStatus {
  NEW_UNENDORSED = "NEW_UNENDORSED",
  ENDORSED = "ENDORSED",
  ENDORSEMENT_LOST = "ENDORSEMENT_LOST",
  UNKNOWN = "UNKNOWN",
}

function getAppEndorsementStatus(
  appExists?: boolean,
  appEndorsementScore?: string,
  endorsementScoreThreshold?: string,
): AppEndorsementStatus {
  if (appExists === undefined || appEndorsementScore === undefined || endorsementScoreThreshold === undefined) {
    return AppEndorsementStatus.UNKNOWN
  }

  const appEndorsementScoreNumber = parseInt(appEndorsementScore, 10)
  const endorsementScoreThresholdNumber = parseInt(endorsementScoreThreshold, 10)

  if (isNaN(appEndorsementScoreNumber) || isNaN(endorsementScoreThresholdNumber)) {
    return AppEndorsementStatus.UNKNOWN
  }

  if (appEndorsementScoreNumber < endorsementScoreThresholdNumber) {
    return appExists ? AppEndorsementStatus.ENDORSEMENT_LOST : AppEndorsementStatus.NEW_UNENDORSED
  }

  return AppEndorsementStatus.ENDORSED
}

type scoreColorScheme = {
  cardBorderColor: string
  cardBoxShadow?: string
  textColor: string
}

function getScoreColorScheme(appEndorsementStatus: string): scoreColorScheme {
  // Gray
  const DEFAULT_STYLE = { cardBorderColor: "#D5D5D5", textColor: "#6A6A6A" }
  // Red
  const FAILURE_STYLE = { cardBorderColor: "#C84968", cardBoxShadow: "0px 0px 5px 0px #D23F6366", textColor: "#C84968" }
  // Yellow
  const WARNING_STYLE = {
    cardBorderColor: "#FFE4C3",
    cardBoxShadow: "0px 0px 7.9px 0px #F29B3280",
    textColor: "#F29B32",
  }
  // Green
  const SUCCESS_STYLE = { cardBorderColor: "#D5D5D5", textColor: "#3DBA67" }

  switch (appEndorsementStatus) {
    case AppEndorsementStatus.NEW_UNENDORSED:
      return WARNING_STYLE
    case AppEndorsementStatus.ENDORSEMENT_LOST:
      return FAILURE_STYLE
    case AppEndorsementStatus.ENDORSED:
      return SUCCESS_STYLE
    default:
      return DEFAULT_STYLE
  }
}

export const AppEndorsementInfoCard = () => {
  const { t } = useTranslation()

  const { app } = useCurrentAppInfo()
  const { account } = useWallet()

  // App endorsement data
  const { data: appHasBeenIntoAllocationRounds } = useAppExists(app?.id ?? "")
  const { data: appEndorsementScore, isLoading: appEndorsementScoreLoading } = useAppEndorsementScore(app?.id ?? "")
  const { data: appEndorsers, isLoading: appEndorsersLoading } = useAppEndorsers(app?.id ?? "")
  const { data: endorsementScoreThreshold, isLoading: endorsementScoreThresholdLoading } =
    useEndorsementScoreThreshold()

  // Figure out the app current endorsement status to determine the color scheme
  const appEndorsementStatus = useMemo(() => {
    return getAppEndorsementStatus(appHasBeenIntoAllocationRounds, appEndorsementScore, endorsementScoreThreshold)
  }, [appHasBeenIntoAllocationRounds, appEndorsementScore, endorsementScoreThreshold])
  const scoreColorScheme = getScoreColorScheme(appEndorsementStatus)

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

  return (
    <Card
      h="full"
      w="100%"
      p="24px"
      gap="24px"
      border="1px"
      borderRadius="12px"
      borderColor={scoreColorScheme.cardBorderColor}
      boxShadow={scoreColorScheme.cardBoxShadow}>
      <CardHeader p={0}>
        <Heading fontSize="24px" fontWeight="bold">
          {t("Endorsement")}
        </Heading>
        <Skeleton isLoaded={!endorsementScoreThresholdLoading}>
          <Text pt={3} fontSize="14px" color="#6A6A6A">
            <Trans
              i18nKey="A dApp has to reach {{value}} endorsement points to join allocations."
              values={{ value: endorsementScoreThreshold }}
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
          <Skeleton
            isLoaded={
              !appEndorsementScoreLoading &&
              !endorsementScoreThresholdLoading &&
              !appEndorsersLoading &&
              !userEndorsementScoreLoading
            }>
            <HStack spacing={3}>
              <Box>
                <Text fontSize="16px">{t("Current score")}</Text>
                <Box display="flex" alignItems="center">
                  <Text fontSize="36px" fontWeight="700" color={scoreColorScheme.textColor}>
                    {appEndorsementScore}
                  </Text>
                  <Text fontSize="14px" color="#6A6A6A" pt={4} pl={1}>
                    {t("of {{value}}", { value: endorsementScoreThreshold })}
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
                (appEndorsementStatus === AppEndorsementStatus.NEW_UNENDORSED ||
                  appEndorsementStatus === AppEndorsementStatus.ENDORSEMENT_LOST) && (
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
    </Card>
  )
}
