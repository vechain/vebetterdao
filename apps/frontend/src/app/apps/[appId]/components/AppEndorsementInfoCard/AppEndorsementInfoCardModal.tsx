import { useAppEndorsers, useAppEndorsementStatus, useIsAppAdmin, UserNode } from "@/api"
import { EndorsersItem } from "./EndorsersItem"
import { EndorsementHistoryItem } from "./EndorsementHistoryItem"
import { useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { normalize } from "@repo/utils/HexUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { UilTrash } from "@iconscout/react-unicons"
import {
  VStack,
  HStack,
  Text,
  Stack,
  Image,
  Heading,
  Center,
  Separator,
  Show,
  Button,
  useDisclosure,
  Flex,
} from "@chakra-ui/react"
import { useTranslation, Trans } from "react-i18next"
import { useMemo, useState } from "react"
import { BaseModal } from "@/components/BaseModal"
import { useWallet } from "@vechain/vechain-kit"
import { EndorsementDetails } from "./EndorsementDetails"
import { EndorsementStatusCallout } from "./EndorsementStatusCallout"
import { UnendorseAppModalAdminsOnly } from "./UnendorseAppModalAdminsOnly"
import { useBreakpoints } from "@/hooks"

type Props = {
  isOpen: boolean
  onClose: () => void
  appId: string
  userNode?: UserNode
}

export const AppEndorsementInfoCardModal = ({ isOpen, onClose, appId, userNode }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isMobile } = useBreakpoints()

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
    if (!appId) return false
    return userNode?.isXNodeHolder && compareAddresses(appId, userNode?.endorsedAppId)
  }, [appId, userNode])

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
      onClose={onClose}
      modalProps={{
        size: "full",
        // size: "6xl",
      }}>
      <VStack gap={6} align="flex-start" w="full">
        <HStack w="full" justify="space-between">
          <Heading fontSize={"24px"}>{t("Endorsement history")}</Heading>
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

            <Show when={isMobile}>
              <Separator w="full" />
            </Show>

            <VStack
              display={"flex"}
              bg="info-bg"
              justify={"space-between"}
              rounded={"16px"}
              p={[0, 0, 4]}
              gap={4}
              w={"full"}
              height={["auto", "auto", "40vh"]}
              overflowY="auto">
              <Heading fontWeight="700" fontSize="20px" alignSelf="flex-start">
                {t("Endorsers")}
              </Heading>

              {appEndorsers && appEndorsers.length > 0 ? (
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
                          components={{ bold: <Text as="span" fontWeight={"600"} /> }}
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

                  {appEndorsers
                    .slice()
                    .reverse()
                    .map(endorser => (
                      <EndorsersItem
                        appId={appId}
                        key={endorser}
                        isAppAdmin={isAppAdmin || false}
                        endorserAddress={endorser}
                        endorsementEvents={endorsementEvents || []}
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
                  <Text fontSize="14px" color="#6A6A6A">
                    {t("There is nothing to show here !")}
                  </Text>
                </Center>
              )}
            </VStack>
          </VStack>

          <Show when={isMobile}>
            <Separator w="full" />
          </Show>

          <VStack
            bg="info-bg"
            flex={1}
            p={[0, 0, 4]}
            rounded={"16px"}
            justify={"space-between"}
            overflowY="auto"
            minHeight={["auto", "auto", "50vh"]}
            maxH={["auto", "auto", "50vh"]}>
            <Heading fontWeight="700" fontSize="20px" alignSelf={"flex-start"}>
              {t("Endorsement history")}
            </Heading>

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
                <Text fontSize="14px" color="#6A6A6A">
                  {t("There is nothing to show here !")}
                </Text>
              </Center>
            )}
          </VStack>
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
