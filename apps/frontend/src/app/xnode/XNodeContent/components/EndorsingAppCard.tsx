import {
  useAllocationsRound,
  useAppEndorsementStatus,
  useAppEndorsers,
  useCurrentAllocationsRoundId,
  UserNode,
  useNodesEndorsedApps,
} from "@/api"
import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { EndorsementDetails } from "@/app/apps/[appId]/components/AppEndorsementInfoCard/EndorsementDetails"
import { EndorsementStatusCallout } from "@/app/apps/[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"
import { GenericAlert } from "@/app/components/Alert"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import {
  Button,
  Card,
  Separator,
  Flex,
  Heading,
  HStack,
  Image,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilInfoCircle, UilSearch } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const EndorsingAppCard = ({ xNode }: { xNode: UserNode }) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const isEndorsingApp = !!xNode.endorsedAppId

  const { data: endorsedApps } = useNodesEndorsedApps([xNode.nodeId])
  const endorsedApp = endorsedApps?.[0]?.endorsedApp

  // get the number of endorsers for the endorsed app
  const { data: appEndorsers, isLoading: isAppEndorsersLoading } = useAppEndorsers(xNode.endorsedAppId ?? "")
  // get app status and score
  const {
    score: endorsementScore,
    status: endorsementStatus,
    threshold: endorsementThreshold,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(xNode.endorsedAppId ?? "")

  // get the last endorsement event for the endorsed app
  const { data: appEndorsedEvents } = useAppEndorsedEvents({
    nodeId: xNode.nodeId,
    appId: xNode.endorsedAppId,
    endorsed: true,
  })

  const unendorseAppModal = useDisclosure()

  const lastEndorsementTimestamp = useEstimateBlockTimestamp({ blockNumber: appEndorsedEvents?.[0]?.blockNumber })
  const endorsingSince = dayjs(lastEndorsementTimestamp).fromNow()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(currentRoundId)

  const router = useRouter()
  const goToApps = useCallback(() => {
    router.push("/apps")
  }, [router])

  const searchIconSize = useBreakpointValue({ base: "4rem", md: "6rem" })
  const shouldDisableEndorsementButton = useMemo(() => {
    return xNode.isXNodeDelegated || xNode.isXNodeOnCooldown
  }, [xNode.isXNodeDelegated, xNode.isXNodeOnCooldown])
  const shouldDisplayCooldownAlert = useMemo(() => {
    return account?.address && !xNode.isXNodeDelegated
  }, [account?.address, xNode.isXNodeDelegated])

  return (
    <Card.Root variant="baseWithBorder" w="full" h="min-content">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="lg">{t("Endorsed app")}</Heading>
              {!isEndorsingApp && <UilInfoCircle color="#004CFC" />}
            </HStack>
            {!isEndorsingApp && (
              <Text textStyle="sm">
                {t(
                  "As the owner of an Node, you can use your points to endorse apps and help them be voted in allocation rounds.",
                )}
              </Text>
            )}
          </VStack>
          {shouldDisplayCooldownAlert ? (
            <GenericAlert
              type={!xNode.isXNodeOnCooldown ? "warning" : "error"}
              isLoading={roundInfoLoading}
              message={
                xNode.isXNodeOnCooldown
                  ? t("You cannot change your endorsement until the start of the next round, on {{roundStartDate}}.", {
                      roundStartDate: dayjs(roundInfo?.voteEndTimestamp).format("MMMM D"),
                    })
                  : t(
                      "Once endorsed you cannot change your endorsement until the start of the next round, on {{roundStartDate}}.",
                      {
                        roundStartDate: dayjs(roundInfo?.voteEndTimestamp).format("MMMM D"),
                      },
                    )
              }
            />
          ) : null}
          {isEndorsingApp ? (
            <Card.Root variant={"baseWithBorder"} p={4} rounded="lg">
              <VStack align="stretch" gap={6}>
                <Stack direction={["column", "column", "row"]} justify="space-between">
                  <HStack>
                    <Image src={endorsedApp?.metadata.logo} alt="endorsed-app" w="12" h="12" rounded="xl" />
                    <Heading textStyle="lg" fontWeight={"600"}>
                      {endorsedApp?.name}
                    </Heading>
                  </HStack>
                  <Flex alignSelf={["flex-start", "flex-start", "center"]}>
                    <EndorsementStatusCallout
                      endorsementStatus={endorsementStatus}
                      showDescription={false}
                      padding={2}
                    />
                  </Flex>
                  <Stack
                    direction={["row", "row", "column"]}
                    alignItems={["flex-start", "flex-start", "flex-end"]}
                    justifyContent={["flex-start", "flex-start", "flex-end"]}
                    gap={0}>
                    <Text
                      textStyle={["xs", "xs", "md"]}
                      color={["#6A6A6A", "#6A6A6A", "inherit"]}
                      order={[1, 1, 2]} // Change order for large viewports
                    >
                      {endorsingSince}
                    </Text>
                    <Text
                      textStyle="xs"
                      color="text.subtle"
                      order={[0, 0, 1]} // Change order for large viewports
                      pr={[1, 2, 0]} // Change padding for large viewports
                    >
                      {t("Endorsing since")}
                    </Text>
                  </Stack>
                </Stack>
                <Separator />
                <Stack
                  direction={["column", "column", "row"]}
                  alignItems={["flex-start", "flex-start", "center"]}
                  justifyContent={["flex-start", "flex-start", "space-between"]}
                  gap={4}
                  w="full">
                  <Flex>
                    <EndorsementDetails
                      appId={xNode.endorsedAppId ?? ""}
                      endorsementScore={endorsementScore}
                      endorsementStatus={endorsementStatus}
                      endorsementThreshold={endorsementThreshold}
                      isEndorsementStatusLoading={isEndorsementStatusLoading}
                      isUserAppEndorser={true}
                      endorsers={appEndorsers || []}
                      isAppEndorsersLoading={isAppEndorsersLoading}></EndorsementDetails>
                  </Flex>

                  <Button
                    variant="dangerGhost"
                    onClick={unendorseAppModal.onOpen}
                    w={["full", "full", "auto"]}
                    disabled={shouldDisableEndorsementButton}>
                    {t("Remove endorsement")}
                  </Button>
                </Stack>
              </VStack>
            </Card.Root>
          ) : (
            <Flex align="center" justify={"center"} p={["8", "8", "12"]} bg="#F8F8F8" rounded="2xl" mt="2">
              <VStack align="center" gap={2} maxW="27rem" textAlign={"center"}>
                <UilSearch size={searchIconSize} color="#757575" />
                <Heading textStyle="xl" color="#757575" fontWeight={"500"}>
                  {t("You’re not endorsing any app")}
                </Heading>
                {xNode.isXNodeDelegator ? (
                  <Text color="#757575">
                    {t(
                      "You can't endorse apps with this account if you delegated your Node. Cancel the delegation to be able to endorse apps with this account again.",
                    )}
                  </Text>
                ) : (
                  <>
                    <Text color="#757575">
                      {t(
                        "Browse the apps that are looking for endorsement and use your score to help them join the allocation rounds!",
                      )}
                    </Text>
                    <Button variant="primaryAction" onClick={goToApps} mt={4} w={["full", "full", "auto"]}>
                      {t("Browse apps")}
                    </Button>
                  </>
                )}
              </VStack>
            </Flex>
          )}
        </VStack>
      </Card.Body>
      <UnendorseAppModal xNodeId={xNode.nodeId} isOpen={unendorseAppModal.open} onClose={unendorseAppModal.onClose} />
    </Card.Root>
  )
}
