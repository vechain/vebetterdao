import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { Accordion, Circle, HStack, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { useTranslation } from "react-i18next"

export const ProposalCreatedTimeLineItem = () => {
  const { t } = useTranslation()
  const { proposal } = useProposalDetail()
  const activeColor = "#004CFC"
  const inactiveColor = "#E1E1E1"
  return (
    <Accordion.Root collapsible w="full" defaultValue={[]}>
      <Accordion.Item value="first" border={"none"} w="full">
        <Accordion.ItemTrigger w="full" rounded={"12px"} px={"8px"} py={0} _hover={{ textDecor: "underline" }}>
          <HStack justify={"space-between"} w="full">
            <VStack flex={1} align="flex-start" gap={0}>
              <Text>{t("Proposal created")}</Text>
              {proposal.proposalCreationDate && (
                <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
                  {dayjs(proposal.proposalCreationDate).format("MMM D, YYYY")}
                </Text>
              )}
            </VStack>
            <Accordion.ItemIndicator />
          </HStack>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent p={"8px"}>
          <VStack py={2}>
            <HStack alignItems="center" w="full">
              <Circle size="8px" bg={activeColor} />
              <VStack align="flex-start" gap={0}>
                <Text fontSize={"14px"}>{t("Looking for support")}</Text>
              </VStack>
            </HStack>
            {proposal.state === ProposalState.DepositNotMet ? (
              <HStack alignItems={"center"} w="full">
                <Circle size="8px" bg={"#D23F63"} />
                <VStack align="flex-start" gap={0}>
                  <Text fontSize={"14px"} color="#D23F63">
                    {t("Support not reached")}
                  </Text>
                </VStack>
              </HStack>
            ) : (
              <HStack alignItems={"center"} w="full">
                <Circle size="8px" bg={proposal.isDepositReached ? activeColor : inactiveColor} />
                <VStack align="flex-start" gap={0}>
                  <Text fontSize={"14px"}>{t("Support reached")}</Text>
                </VStack>
              </HStack>
            )}
          </VStack>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  )
}
