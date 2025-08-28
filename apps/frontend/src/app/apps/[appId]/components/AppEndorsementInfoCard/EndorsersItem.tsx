import { useRouter } from "next/navigation"
import { Text, HStack, VStack, Box, Popover, Skeleton, Portal } from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { HiDotsVertical } from "react-icons/hi"
import { UilTrash, UilCheck } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { useNodeEndorsementScore } from "@/hooks/useNodeEndorsementScore"
import { useState } from "react"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useGetUserNodes } from "@/api/contracts/xNodes/useGetUserNodes"

type Props = {
  appId: string
  isAppAdmin: boolean
  endorserAddress: string
  endorsementEvents: AppEndorsedEvent[]
  setIsConfirmOpen: (value: boolean) => void
  setSelectedEndorserAddress: (value: string) => void
  setSelectedEndorserNodeId: (value: string) => void
  setSelectedEndorserNodePoints: (value: string) => void
}

export const EndorsersItem = ({
  appId,
  isAppAdmin,
  endorserAddress,
  endorsementEvents,
  setIsConfirmOpen,
  setSelectedEndorserAddress,
  setSelectedEndorserNodeId,
  setSelectedEndorserNodePoints,
}: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const { data: userNodes, isLoading: endorserNodesLoading } = useGetUserNodes(endorserAddress)
  const endorserNodeId = userNodes?.allNodes?.find(node => node.endorsedAppId === appId)?.nodeId
  const { data: nodePoints, isLoading: nodePointsLoading } = useNodeEndorsementScore(endorserNodeId ?? "")

  // Find the first element in events (ie most recent) where the endorser endorsed the app
  const lastEndorsementEvent = endorsementEvents.find(event => event.nodeId === endorserNodeId && event.endorsed)
  const lastEndorsementEpoch = useEstimateBlockTimestamp({ blockNumber: lastEndorsementEvent?.blockNumber })
  const endorsingSince = dayjs(lastEndorsementEpoch).fromNow()

  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Popover actions
  const handleRemoveClick = () => {
    setIsPopoverOpen(false)
    setIsConfirmOpen(true)
    setSelectedEndorserAddress(endorserAddress)
    setSelectedEndorserNodeId(endorserNodeId ?? "")
    setSelectedEndorserNodePoints(nodePoints ?? "")
  }
  const goToEndorserUserProfilePage = () => {
    router.push("/profile/" + endorserAddress + "?tab=gm")
  }
  const { data: vnsData } = useVechainDomain(endorserAddress)
  const domain = vnsData?.domain

  return (
    <HStack p={"12px"} borderRadius={"16px"} boxShadow="sm" w={"full"} alignItems={"center"} justify={"space-between"}>
      <HStack alignItems={"center"} gap={4}>
        <AddressIcon address={endorserAddress} rounded="full" h="28px" w="28px" />
        <VStack align="start" justify={"center"} gap={0}>
          <Text>{domain ? humanDomain(domain, 4, 26) : humanAddress(endorserAddress, 6, 3)}</Text>
          <Skeleton loading={endorserNodesLoading}>
            <Text textStyle="xs" color="#6A6A6A">
              {t("Endorsing since {{date}}", { date: endorsingSince })}
            </Text>
          </Skeleton>
        </VStack>
      </HStack>
      <HStack alignItems={"center"} gap={4}>
        <Skeleton loading={endorserNodesLoading || nodePointsLoading}>
          <Text textStyle={"md"} fontWeight={600}>
            <Trans
              i18nKey="{{value}} pts."
              values={{ value: nodePoints }}
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
                      <HStack color="#C84968" onClick={handleRemoveClick} cursor="pointer">
                        <UilTrash />
                        <Text whiteSpace="nowrap" fontSize={["sm", "md"]}>
                          {t("Remove this endorsement")}
                        </Text>
                      </HStack>
                    )}
                    <HStack onClick={goToEndorserUserProfilePage} cursor="pointer">
                      <UilCheck color={"#004CFC"} />
                      <Text fontSize={["sm", "md"]}>{t("See endorser info")}</Text>
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
