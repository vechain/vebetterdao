import {
  VStack,
  HStack,
  Text,
  Stack,
  Image,
  Heading,
  Center,
  Separator,
  Button,
  useDisclosure,
  Flex,
  Card,
} from "@chakra-ui/react"
import { UilTrash } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { normalize } from "@repo/utils/HexUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo, useState } from "react"
import { useTranslation, Trans } from "react-i18next"

import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { BaseModal } from "@/components/BaseModal"

import { useAppEndorsementStatus } from "../../../../../api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useAppEndorsers } from "../../../../../api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { useIsAppAdmin } from "../../../../../api/contracts/xApps/hooks/useIsAppAdmin"
import { UserNode } from "../../../../../api/contracts/xNodes/useGetUserNodes"

import { EndorsementDetails } from "./EndorsementDetails"
import { EndorsementHistoryItem } from "./EndorsementHistoryItem"
import { EndorsementStatusCallout } from "./EndorsementStatusCallout"
import { EndorsersItem } from "./EndorsersItem"
import { UnendorseAppModalAdminsOnly } from "./UnendorseAppModalAdminsOnly"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
  userNode?: UserNode
}
export const AppEndorsementInfoCardModal = ({ isOpen, onClose, appId, userNode }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  // App endorsement data
  const { data: appEndorsers, isLoading: isAppEndorsersLoading } = useAppEndorsers(appId ?? "")
  const { data: endorsementEvents } = useAppEndorsedEvents({ appId })
  const {
    score: endorsementScore,
    status: endorsementStatus,
    threshold: endorsementThreshold,
    isLoading: isEndorsementStatusLoading,
  } = useAppEndorsementStatus(appId)

  // User roles data
  const { data: isAppAdmin } = useIsAppAdmin(appId ?? "", account?.address ?? "")

  const isUserAppEndorser = useMemo(() => {
    if (!appId || !userNode) return false
    return userNode.activeEndorsements.some(e => e.appId === appId)
  }, [appId, userNode])

  // Get currently endorsed nodes by tracking the latest state for each node
  const currentlyEndorsedEvents = useMemo(() => {
    if (!endorsementEvents) return []

    // Create a map to track the latest endorsement event for each nodeId
    const latestEventByNode = new Map<string, (typeof endorsementEvents)[0]>()

    // Process events from oldest to newest to get latest event per node
    const sortedEvents = [...endorsementEvents]
      .filter(event => event.appId === appId)
      .sort((a, b) => a.blockNumber - b.blockNumber)

    sortedEvents.forEach(event => {
      latestEventByNode.set(event.nodeId, event)
    })

    // Return only nodes that are currently endorsed (latest event has endorsed:true)
    return Array.from(latestEventByNode.values()).filter(event => event.endorsed)
  }, [endorsementEvents, appId])
  // Confirm unendorsement, unendorsement modal controls
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedEndorserAddress, setSelectedEndorserAddress] = useState("")
  const [selectedEndorserNodeId, setSelectedEndorserNodeId] = useState("")
  const [selectedEndorserNodePoints, setSelectedEndorserNodePoints] = useState("")
  const resetSelectedEndorser = () => {
    setSelectedEndorserAddress("")
    setSelectedEndorserNodeId("")
    setSelectedEndorserNodePoints("")
  }
  const handleCancelClick = () => {
    setIsConfirmOpen(false)
    resetSelectedEndorser()
  }
  const {
    open: isUnendorsementModalOpen,
    onOpen: onOpenUnendorsementModal,
    onClose: onCloseUnendorsementModal,
  } = useDisclosure()
  const handleUnendorsementSuccess = () => {
    onCloseUnendorsementModal()
    setIsConfirmOpen(false)
    resetSelectedEndorser()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      isCloseable
      showCloseButton
      onClose={onClose}
      modalProps={{ size: "5xl" }}
      modalContentProps={{ pt: 5 }}>
      <VStack gap={6} align="flex-start" w="full">
        <HStack w="full" justify="space-between">
          <Heading size={"2xl"}>{t("Endorsement history")}</Heading>
          <Flex>
            <EndorsementStatusCallout
              endorsementStatus={endorsementStatus}
              showDescription={false}
              padding={2}></EndorsementStatusCallout>
          </Flex>
        </HStack>

        <Stack direction={["column", "column", "row"]} w={"full"} alignItems={"stretch"} gap={5}>
          <VStack flex={1.5} h="full" maxH={["auto", "auto", "50vh"]} minH={["auto", "auto", "50vh"]} gap={4}>
            <Stack
              direction={["column", "column", "row"]}
              w="full"
              justify="space-between"
              alignItems={["center", "center", "center"]}>
              <EndorsementDetails
                appId={appId}
                endorsementScore={endorsementScore}
                endorsementStatus={endorsementStatus}
                endorsementThreshold={endorsementThreshold}
                isEndorsementStatusLoading={isEndorsementStatusLoading}
                isUserAppEndorser={isUserAppEndorser ?? false}
                endorsers={appEndorsers || []}
                isAppEndorsersLoading={isAppEndorsersLoading}></EndorsementDetails>
            </Stack>
            <Separator hideFrom="md" w="full" />
            <Card.Root variant="primary" p="4" gap={4} w={"full"} height={["auto", "auto", "40vh"]} overflowY="auto">
              <Card.Header p={0}>
                <Heading size="xl" alignSelf="flex-start">
                  {t("Endorsers")}
                </Heading>
              </Card.Header>

              <Card.Body p={0}>
                {currentlyEndorsedEvents.length ? (
                  <VStack flex={1} w="full" overflowY="auto" h="full" gap={2}>
                    {isAppAdmin && isConfirmOpen && (
                      <VStack
                        border={"1px solid #EC9BAF"}
                        p={4}
                        mx={2}
                        borderRadius={"16px"}
                        bg={"profile-bg"}
                        alignItems="end">
                        <Text mb={2} maxW="full">
                          <Trans
                            i18nKey="<bold>Are you sure?</bold> If you remove {{endorsedAddress}} endorsement you'll lose {{value}} pts and your app may lose its endorsement"
                            values={{
                              endorsedAddress: humanAddress(normalize(selectedEndorserAddress), 6, 3),
                              value: selectedEndorserNodePoints,
                            }}
                            components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                          />
                        </Text>
                        <HStack>
                          <Button
                            borderRadius="16px"
                            bg="#C84968"
                            color={"white"}
                            onClick={onOpenUnendorsementModal}
                            size={["md", "sm"]}>
                            <UilTrash />
                            {t("Remove")}
                          </Button>
                          <Button
                            borderRadius="16px"
                            bg="#E0E9FE"
                            color={"#004CFC"}
                            onClick={handleCancelClick}
                            size={["md", "sm"]}>
                            {t("Cancel")}
                          </Button>
                        </HStack>
                      </VStack>
                    )}

                    {currentlyEndorsedEvents.map(event => (
                      <EndorsersItem
                        key={`${event.nodeId}-${event.txOrigin}-${event.blockNumber}`}
                        isAppAdmin={isAppAdmin || false}
                        event={event}
                        setIsConfirmOpen={setIsConfirmOpen}
                        setSelectedEndorserAddress={setSelectedEndorserAddress}
                        setSelectedEndorserNodeId={setSelectedEndorserNodeId}
                        setSelectedEndorserNodePoints={setSelectedEndorserNodePoints}
                      />
                    ))}
                  </VStack>
                ) : (
                  <Center w="full" h="full">
                    <Image src="/assets/icons/nothing-to-show-endorsement.svg" alt="No endorsement" />
                    <Text textStyle="sm" color="text.subtle">
                      {t("There is nothing to show here !")}
                    </Text>
                  </Center>
                )}
              </Card.Body>
            </Card.Root>
          </VStack>
          <Separator hideFrom="md" w="full" />
          <Card.Root
            bg="bg.primary"
            flex={1}
            p={4}
            rounded={"16px"}
            overflowY="auto"
            minHeight={["auto", "auto", "50vh"]}
            maxH={["auto", "auto", "50vh"]}>
            <Card.Header p={0}>
              <Heading size="xl" alignSelf={"flex-start"}>
                {t("Endorsement history")}
              </Heading>
            </Card.Header>

            <Card.Body px={0} py={0.5}>
              {endorsementEvents && endorsementEvents.length > 0 ? (
                <VStack flex={1} w="full" overflowY="auto" h="full">
                  {endorsementEvents.map(endorsementEvent => (
                    <EndorsementHistoryItem
                      key={`${endorsementEvent.appId}-${endorsementEvent.nodeId}-${endorsementEvent.blockNumber}`}
                      event={endorsementEvent}
                    />
                  ))}
                </VStack>
              ) : (
                <Center w="full" h="full">
                  <Image src="/assets/icons/nothing-to-show-endorsement.svg" alt="No endorsement" />
                  <Text textStyle="sm" color="text.subtle">
                    {t("There is nothing to show here !")}
                  </Text>
                </Center>
              )}
            </Card.Body>
          </Card.Root>
        </Stack>
      </VStack>

      {isAppAdmin && isUnendorsementModalOpen && (
        <UnendorseAppModalAdminsOnly
          isOpen={isUnendorsementModalOpen}
          onClose={handleUnendorsementSuccess}
          appId={appId}
          nodeId={selectedEndorserNodeId}
          nodePoints={selectedEndorserNodePoints}
        />
      )}
    </BaseModal>
  )
}
