import { Text, HStack, VStack, Box, Popover, Skeleton, Portal } from "@chakra-ui/react"
import { UilTrash, UilCheck } from "@iconscout/react-unicons"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { HiDotsVertical } from "react-icons/hi"

import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { AddressIcon } from "@/components/AddressIcon"
import { useNodeEndorsementScore } from "@/hooks/node/useNodeEndorsementScore"
import { useGetNodeManager } from "@/hooks/node/useNodeManager"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"

type Props = {
  isAppAdmin: boolean
  event: AppEndorsedEvent
  setIsConfirmOpen: (value: boolean) => void
  setSelectedEndorserAddress: (value: string) => void
  setSelectedEndorserNodeId: (value: string) => void
  setSelectedEndorserNodePoints: (value: string) => void
}
export const EndorsersItem = ({
  isAppAdmin,
  event,
  setIsConfirmOpen,
  setSelectedEndorserAddress,
  setSelectedEndorserNodeId,
  setSelectedEndorserNodePoints,
}: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const endorserNodeId = event.nodeId

  // Get the current node manager address (handles ownership and delegation)
  const { data: endorserAddress, isLoading: endorserAddressLoading } = useGetNodeManager(endorserNodeId)
  const { data: nodePoints, isLoading: nodePointsLoading } = useNodeEndorsementScore(endorserNodeId)
  const lastEndorsementEpoch = useEstimateBlockTimestamp({ blockNumber: event.blockNumber })
  const endorsingSince = dayjs(lastEndorsementEpoch).fromNow()
  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Popover actions
  const handleRemoveClick = () => {
    setIsPopoverOpen(false)
    setIsConfirmOpen(true)
    setSelectedEndorserAddress(endorserAddress ?? "")
    setSelectedEndorserNodeId(endorserNodeId)
    setSelectedEndorserNodePoints(nodePoints ?? "")
  }
  const goToEndorserUserProfilePage = () => {
    router.push("/profile/" + endorserAddress + "?tab=gm")
  }
  const { data: vnsData } = useVechainDomain(endorserAddress)
  const domain = vnsData?.domain

  return (
    <HStack
      p={"12px"}
      borderRadius={"16px"}
      border="sm"
      borderColor="border.secondary"
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <HStack alignItems={"center"} gap={4}>
        <AddressIcon address={endorserAddress ?? ""} rounded="full" h="28px" w="28px" />
        <VStack align="start" justify={"center"} gap={0}>
          <Skeleton loading={endorserAddressLoading}>
            <Text>{domain ? humanDomain(domain, 4, 26) : humanAddress(endorserAddress ?? "", 6, 3)}</Text>
          </Skeleton>
          <Text textStyle="xs" color="text.subtle">
            {t("Endorsing since {{date}}", { date: endorsingSince })}
          </Text>
        </VStack>
      </HStack>
      <HStack alignItems={"center"} gap={4}>
        <Skeleton loading={nodePointsLoading}>
          <Text textStyle={"md"} fontWeight="semibold">
            <Trans
              i18nKey="{{value}} pts."
              values={{ value: nodePoints?.toString() ?? "0" }}
              components={{
                Text: <Text as="span" />,
              }}
            />
          </Text>
        </Skeleton>

        <Popover.Root
          positioning={{
            placement: "bottom-end",
          }}
          open={isPopoverOpen}
          onOpenChange={details => setIsPopoverOpen(details.open)}>
          <Popover.Trigger>
            <Box as="button" onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
              <HiDotsVertical />
            </Box>
          </Popover.Trigger>
          <Portal>
            <Popover.Positioner>
              <Popover.Content width="auto" boxShadow="md" border="1px solid #EFEFEF">
                <Popover.Body p={2}>
                  <VStack alignItems="stretch" gap={3}>
                    {isAppAdmin && (
                      <HStack color="status.negative.primary" onClick={handleRemoveClick} cursor="pointer">
                        <UilTrash />
                        <Text whiteSpace="nowrap" textStyle={["sm", "md"]}>
                          {t("Remove this endorsement")}
                        </Text>
                      </HStack>
                    )}
                    <HStack onClick={goToEndorserUserProfilePage} cursor="pointer">
                      <UilCheck color={"#004CFC"} />
                      <Text textStyle={["sm", "md"]}>{t("See endorser info")}</Text>
                    </HStack>
                  </VStack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </HStack>
    </HStack>
  )
}
