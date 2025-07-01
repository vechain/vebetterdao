import { Card, CardBody, Heading, HStack, Text, VStack, Flex, Badge } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useGMPoolAmount } from "@/hooks"
import { useCurrentAllocationsRoundId } from "@/api"

export const GmPoolAmountCard = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  // TODO : for the first round, getting the gm amount from a constant value
  const { formatted: gmPoolAmount } = useGMPoolAmount(Number(currentRoundId))

  return (
    <Card variant="primaryBoxShadow">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <HStack spacing={2}>
            <Heading fontSize="lg">{t("GM Pool Amount")}</Heading>
          </HStack>
          <Flex p={4} borderRadius="md" justify="center" align="center" direction="column">
            <Text fontSize="2xl" fontWeight="bold">
              {gmPoolAmount} {"B3TR"}
            </Text>
            <Badge mt={1} borderRadius="full" px={2}>
              {t("Round")} {"#" + currentRoundId}
            </Badge>
          </Flex>

          <Text fontSize="sm" color="gray.600">
            {t("Total B3TR in the GM Pool for the current round")}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}
