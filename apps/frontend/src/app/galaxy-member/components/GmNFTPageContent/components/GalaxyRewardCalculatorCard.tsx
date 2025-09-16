import { Button, Card, Heading, Icon, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { UilCalculatorAlt } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"

export const GalaxyRewardCalculatorCard = () => {
  const { t } = useTranslation()

  const router = useRouter()

  const goToCalculator = () => {
    router.push("/galaxy-member/rewards-calculator")
  }

  return (
    <Card.Root variant="primary">
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <Heading textStyle="lg">{t("GM Reward Calculator")}</Heading>
            <Text textStyle="sm" color="text.subtle">
              {t("Estimate your rewards based on your GM NFT level, and potential upgrades")}
            </Text>
          </VStack>

          <Button onClick={goToCalculator} variant="ghost" color="actions.tertiary.default">
            <Icon as={UilCalculatorAlt} color="actions.tertiary.default" />
            {t("Estimate Rewards")}
          </Button>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
