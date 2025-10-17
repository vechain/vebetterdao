import { Card, Heading, HStack, Text, VStack, Flex, Badge } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useCurrentAllocationsRoundId } from "../../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useGMPoolAmount } from "../../../../../hooks/useGMPoolAmount"

export const GmPoolAmountCard = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  // TODO : for the first round, getting the gm amount from a constant value
  const { formatted: gmPoolAmount } = useGMPoolAmount(Number(currentRoundId))
  return (
    <Card.Root variant="primary" border="sm" borderColor="border.active">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <HStack gap={2}>
            <Heading textStyle="lg">{t("GM Pool Amount")}</Heading>
          </HStack>
          <Flex p={4} borderRadius="md" justify="center" align="center" direction="column">
            <Text textStyle="2xl">
              {gmPoolAmount} {"B3TR"}
            </Text>
            <Badge mt={1} borderRadius="full" px={2}>
              {t("Round")} {"#" + currentRoundId}
            </Badge>
          </Flex>
          <Text textStyle="sm" color="gray.600">
            {t("Total B3TR in the GM Pool for the current round")}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
