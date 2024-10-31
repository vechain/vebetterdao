import { Card, CardBody, VStack, Heading, Text, Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const SimulateUpgrade = () => {
  const router = useRouter()
  const { t } = useTranslation()

  const onClick = () => {
    router.push("/galaxy-member/rewards-calculator")
  }
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <Heading fontSize="lg">{t("Maximize Your Rewards")}</Heading>
            <Text fontSize="sm" color="#6A6A6A">
              {t("Discover the potential B3TR rewards you could earn by upgrading your GMNFT")}
            </Text>
          </VStack>
        </VStack>

        <Button variant={"primarySubtle"} w={"full"} onClick={onClick} fontSize="lg">
          {t("Simulate Your Rewards Now")}
        </Button>
      </CardBody>
    </Card>
  )
}
