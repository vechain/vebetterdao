import { useRouter } from "next/navigation"
import {
  Text,
  HStack,
  VStack,
  Box,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverBody,
  Skeleton,
} from "@chakra-ui/react"
import { Trans, useTranslation } from "react-i18next"
import { AddressIcon } from "@/components/AddressIcon"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { HiDotsVertical } from "react-icons/hi"
import { UilTrash, UilCheck } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useXNodes } from "@/api"
import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { useNodeEndorsementScore } from "@/hooks/useNodeEndorsementScore"
import { useState } from "react"
import { useVechainDomain } from "@vechain/vechain-kit"

type Props = {
  isAppAdmin: boolean
  endorserAddress: string
  endorsementEvents: AppEndorsedEvent[]
  setIsConfirmOpen: (value: boolean) => void
  setSelectedEndorserAddress: (value: string) => void
  setSelectedEndorserNodeId: (value: string) => void
  setSelectedEndorserNodePoints: (value: string) => void
}

export const EndorsersItem = ({
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

  // Get the endorser's first node and the node endorsement score
  const { data: endorserNodes, isLoading: endorserNodesLoading } = useXNodes(endorserAddress)
  // TODO support multiple nodes
  const endorserNodeId = endorserNodes?.[0]?.id
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
    <HStack
      bg="light-contrast-on-card-bg"
      p={"12px"}
      borderRadius={"16px"}
      boxShadow="sm"
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <HStack alignItems={"center"} gap={4}>
        <AddressIcon address={endorserAddress} rounded="full" h="28px" w="28px" />
        <VStack align="start" justify={"center"} spacing={0}>
          <Text>{domain ? humanDomain(domain, 4, 26) : humanAddress(endorserAddress, 6, 3)}</Text>
          <Skeleton isLoaded={!endorserNodesLoading}>
            <Text fontSize="12" fontWeight={400} color="#6A6A6A">
              {t("Endorsing since {{date}}", { date: endorsingSince })}
            </Text>
          </Skeleton>
        </VStack>
      </HStack>
      <HStack alignItems={"center"} gap={4}>
        <Skeleton isLoaded={!endorserNodesLoading && !nodePointsLoading}>
          <Text fontSize={"16px"} fontWeight={600}>
            <Trans
              i18nKey="{{value}} pts."
              values={{ value: nodePoints }}
              components={{
                Text: <Text as="span" />,
              }}
            />
          </Text>
        </Skeleton>

        <Popover placement="bottom-end" isOpen={isPopoverOpen} onClose={() => setIsPopoverOpen(false)}>
          <PopoverTrigger>
            <Box as="button" onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
              <HiDotsVertical />
            </Box>
          </PopoverTrigger>
          <PopoverContent width="auto" boxShadow="md" border="1px solid #EFEFEF">
            <PopoverBody p={2}>
              <VStack alignItems="stretch" spacing={3}>
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
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>
    </HStack>
  )
}
