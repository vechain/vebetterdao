import { useCurrentProposal } from "@/api"
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Circle,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

export const ProposalCreatedTimelineItem = () => {
  const { t } = useTranslation()
  const { proposal } = useCurrentProposal()
  const activeColor = "#004CFC"
  const inactiveColor = "#E1E1E1"
  return (
    <Accordion allowToggle w="full">
      <AccordionItem border={"none"} w="full">
        <AccordionButton rounded={"12px"} px={"8px"} py={0} _hover={{ textDecor: "underline" }}>
          <HStack justify={"space-between"} w="full">
            <VStack align="flex-start" gap={0}>
              <Text>{t("Proposal created")}</Text>
              {proposal.proposalCreationDate && (
                <Text color="#6A6A6A" fontWeight={400} fontSize={"14px"}>
                  {dayjs(proposal.proposalCreationDate).format("MMM D, YYYY")}
                </Text>
              )}
            </VStack>
            <AccordionIcon />
          </HStack>
        </AccordionButton>
        <AccordionPanel p={"8px"}>
          <VStack>
            <HStack align={"flex-start"} w="full">
              <Circle size="8px" bg={activeColor} mt={2} />
              <VStack align="flex-start" gap={0}>
                <Text fontSize={"14px"}>{t("Looking for support")}</Text>
              </VStack>
            </HStack>
            <HStack align={"flex-start"} w="full">
              <Circle size="8px" bg={proposal.isDepositReached ? activeColor : inactiveColor} mt={2} />
              <VStack align="flex-start" gap={0}>
                <Text fontSize={"14px"}>{t("Support reached")}</Text>
              </VStack>
            </HStack>
          </VStack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}
