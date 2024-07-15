import { StepCardProps, StepCard } from "@/components/StepCard"
import { Button, Card, CardBody, Grid, GridItem, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

const Steps: StepCardProps[] = [
  {
    stepImageSrc: "/images/sign.svg",
    stepNumber: 1,
    stepTitle: "Testnet submission",
    stepDescription: "Submit your app to optain the APP_ID and have a testing environment.",
  },

  {
    stepImageSrc: "/images/vote.svg",
    stepNumber: 2,
    stepTitle: "Allocation voting",
    stepDescription:
      "The allocation rounds determine the resources and support your app receives from the ecosystem community.",
  },
  {
    stepImageSrc: "/images/handshake.svg",
    stepNumber: 3,
    stepTitle: "Farm B3TR",
    stepDescription:
      "To distribute funds to your contract, you need to farm B3TR tokens. Participate in governace to do so, rounds are held every 10 minutes.",
  },
]
export const NewAppPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const onContinueClick = () => {
    router.push("/apps/new/form")
  }
  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(4, 1fr)"]}
      gap={6}
      w="full"
      data-testid="new-app">
      <GridItem colSpan={3}>
        <Card>
          <CardBody>
            <VStack spacing={8} align="flex-start">
              <Heading size="lg">{t("Create a new app")}</Heading>
              <Text>
                {t(
                  "Welcome to our testnet environment. Follow the steps below to create your app and join the VeBetterDAO ecosystem.",
                )}
              </Text>
              <Grid templateColumns={["repeat(1, 1fr)", "repeat(3, 1fr)"]} gap={4}>
                {Steps.map(step => (
                  <StepCard {...step} key={step.stepNumber} />
                ))}
              </Grid>
              <HStack alignSelf={"flex-end"} spacing={4}>
                <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinueClick}>
                  {t("Continue")}
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem colSpan={1}></GridItem>
    </Grid>
  )
}
