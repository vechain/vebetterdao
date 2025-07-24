import { JoinCommunity } from "@/components"
import { StepCardProps, StepCard } from "@/components/StepCard"
import { Button, Card, Grid, GridItem, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

const Steps: StepCardProps[] = [
  {
    stepImageSrc: "/assets/icons/sign.svg",
    stepNumber: 1,
    stepTitle: "App submition",
    stepDescription:
      "Submit your app into the ecosystem with all the necessary information, including logo, creator bio,  and social media links.",
  },
  {
    stepImageSrc: "/assets/icons/handshake.svg",
    stepNumber: 2,
    stepTitle: "Endorsement",
    stepDescription:
      "X Node Holders will use their NFTs to endorse your app. Once it reaches 100 points, it becomes eligible for allocations.",
  },
  {
    stepImageSrc: "/assets/icons/vote.svg",
    stepNumber: 3,
    stepTitle: "Allocation voting",
    stepDescription:
      "The allocation rounds determine the resources and support your app receives from the ecosystem community.",
  },
]
export const NewAppPageContent = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const LINK_TO_DOCS = () => {
    window.open(
      "https://docs.vebetterdao.org/vebetterdao/x2earn-apps#voting-eligibility-and-endorsement-status",
      "_blank",
      "noopener",
    )
  }

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
        <Card.Root>
          <Card.Body>
            <VStack gap={8} align="flex-start">
              <Heading size="lg">{t("Create a new app")}</Heading>
              <Text>
                {t(
                  "Welcome to our platform where you can unleash your creativity and build dApps! Before your app can go live, it will undergo a thorough review process by our moderators. Here's how it works:",
                )}
              </Text>
              <Stack direction={["column", "column", "row"]} w="full" gap={4}>
                {Steps.map(step => (
                  <StepCard {...step} key={step.stepNumber} />
                ))}
              </Stack>
              <HStack alignSelf={"flex-end"} gap={4}>
                <Button onClick={LINK_TO_DOCS} rounded="full" variant={"outline"} colorScheme="primary" size="lg">
                  {t("More info")}
                </Button>
                <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinueClick}>
                  {t("Continue")}
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </GridItem>
      <GridItem colSpan={1}>
        <JoinCommunity />
      </GridItem>
    </Grid>
  )
}
