import { UserSustainabilityOverviewStats } from "@/components"
import { Card, CardBody, Heading, VStack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const YourBetterActionsSummary = () => {
  const { t } = useTranslation()

  return (
    <Card w={"full"} variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <VStack spacing={2} align="stretch">
            <Heading size="md">{t("Your better actions")}</Heading>
            <Text fontSize="sm" color="#6A6A6A" fontWeight={400}>
              {t("Use Apps to earn B3TR tokens through your Better Actions")}
            </Text>
          </VStack>
          <UserSustainabilityOverviewStats />
        </VStack>
      </CardBody>
    </Card>
  )
}
