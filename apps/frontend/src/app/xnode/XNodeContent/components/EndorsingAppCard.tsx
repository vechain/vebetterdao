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
  useDisclosure,
  VStack,
  Icon,
} from "@chakra-ui/react"
import { UilInfoCircle, UilSearch } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { EndorsementDetails } from "@/app/apps/[appId]/components/AppEndorsementInfoCard/EndorsementDetails"
import { EndorsementStatusCallout } from "@/app/apps/[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"
import { UnendorseAppModal } from "@/app/apps/components/UnendorseAppModal"
import { EmptyState } from "@/components/ui/empty-state"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { convertUriToUrl } from "@/utils/uri"

import { useAllocationsRound } from "../../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useAppEndorsementStatus } from "../../../../api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useAppEndorsers } from "../../../../api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"
import { GenericAlert } from "../../../components/Alert/GenericAlert"

export const EndorsingAppCard = ({ node }: { node: UserNode }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const isEndorsingApp = node?.isEndorsingApp
  const endorsedAppId = node?.endorsedAppId
  // get the number of endorsers for the endorsed app
  const { data: appEndorsers, isLoading: isAppEndorsersLoading } = useAppEndorsers(endorsedAppId ?? "")
  // get app status and score
  const {
    score: endorsementScore,
    status: endorsementStatus,
    threshold: endorsementThreshold,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(endorsedAppId ?? "")

  // get the last endorsement event for the endorsed app
  const { data: appEndorsedEvents } = useAppEndorsedEvents({
    nodeId: node.id.toString(),
    appId: endorsedAppId,
    endorsed: true,
  })
  const { data: appMetadata } = useXAppMetadata(endorsedAppId ?? "")
  const unendorseAppModal = useDisclosure()
  const lastEndorsementTimestamp = useEstimateBlockTimestamp({ blockNumber: appEndorsedEvents?.[0]?.blockNumber })
  const endorsingSince = dayjs(lastEndorsementTimestamp).fromNow()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(currentRoundId)

  const shouldDisableEndorsementButton = useMemo(() => {
    return node?.isOnCooldown || !node?.currentUserIsManager
  }, [node?.currentUserIsManager, node?.isOnCooldown])

  const shouldDisplayCooldownAlert = useMemo(() => {
    return account?.address && !node?.currentUserIsManager
  }, [account?.address, node?.currentUserIsManager])

  return (
    <Card.Root variant="primary" w="full" h="min-content">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="xl">{t("Endorsed app")}</Heading>
              {!isEndorsingApp && <Icon as={UilInfoCircle} color="icon.default" />}
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
              type={node?.isOnCooldown ? "warning" : "error"}
              isLoading={roundInfoLoading}
              message={
                node?.isOnCooldown
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
            <Card.Root variant="primary" p={4} rounded="lg">
              <VStack align="stretch" gap={6}>
                <Stack direction={["column", "column", "row"]} justify="space-between">
                  <HStack>
                    <Image
                      src={convertUriToUrl(appMetadata?.logo ?? "")}
                      alt="endorsed-app"
                      w="12"
                      h="12"
                      rounded="xl"
                    />
                    <Heading textStyle="lg" fontWeight="semibold">
                      {appMetadata?.name}
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
                      appId={endorsedAppId}
                      endorsementScore={endorsementScore}
                      endorsementStatus={endorsementStatus}
                      endorsementThreshold={endorsementThreshold}
                      isEndorsementStatusLoading={isEndorsementStatusLoading}
                      isUserAppEndorser={true}
                      endorsers={appEndorsers || []}
                      isAppEndorsersLoading={isAppEndorsersLoading}></EndorsementDetails>
                  </Flex>

                  <Button
                    variant="ghost"
                    color="status.negative.primary"
                    onClick={unendorseAppModal.onOpen}
                    w={["full", "full", "auto"]}
                    disabled={shouldDisableEndorsementButton}>
                    {t("Remove endorsement")}
                  </Button>
                </Stack>
              </VStack>
            </Card.Root>
          ) : (
            <EmptyState
              bg="transparent"
              icon={<Icon as={UilSearch} boxSize={{ base: "16", md: "24" }} />}
              title={t("You’re not endorsing any app")}
              description={
                node?.currentUserIsManager
                  ? t(
                      "Browse the apps that are looking for endorsement and use your score to help them join the allocation rounds!",
                    )
                  : t(
                      "You can't endorse apps with this account if you delegated your Node. Cancel the delegation to be able to endorse apps with this account again.",
                    )
              }>
              {!node?.currentUserIsManager && (
                <Button variant="primary" asChild mt={4} w={["full", "full", "auto"]}>
                  <NextLink href="/apps">{t("Browse apps")}</NextLink>
                </Button>
              )}
            </EmptyState>
          )}
        </VStack>
      </Card.Body>
      <UnendorseAppModal
        xNodeId={node.id.toString()}
        isOpen={unendorseAppModal.open}
        onClose={unendorseAppModal.onClose}
      />
    </Card.Root>
  )
}
