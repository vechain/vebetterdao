import { Button, Card, CardBody, Grid, GridItem, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { CreateNewAppStepCard, Props as StepProps } from "."
import { useRouter } from "next/navigation"

const Steps: StepProps[] = [
  {
    stepImageSrc: "/images/sign.svg",
    stepNumber: 1,
    stepTitle: "Mods approval",
    stepDescription:
      "Submit your dApp for review. Our moderators will assess its functionality and compliance with our guidelines.",
  },
  {
    stepImageSrc: "/images/handshake.svg",
    stepNumber: 2,
    stepTitle: "Endorsement",
    stepDescription:
      "X Node Holders will use their NFTs to endorse your dApp. Once it reaches 100 points, it becomes eligible for allocations.",
  },
  {
    stepImageSrc: "/images/vote.svg",
    stepNumber: 3,
    stepTitle: "Allocation voting",
    stepDescription:
      "The allocation rounds determine the resources and support your dApp receives from the ecosystem community.",
  },
]
export const NewAppPageContent = () => {
  const router = useRouter()
  const onContinueClick = () => {
    router.push("/apps/new/form")
  }
  return (
    <Grid templateColumns={["repeat(1, 1fr)", "repeat(4, 1fr)"]} gap={6} w="full" data-testid="new-app">
      <GridItem colSpan={3}>
        <Card>
          <CardBody>
            <VStack spacing={8} align="flex-start">
              <Heading size="lg">Create a new app</Heading>
              <Text>
                Welcome to our platform where you can unleash your creativity and build dApps! Before your dApp can go
                live, it will undergo a thorough review process by our moderators. Here's how it works:
              </Text>
              <Stack direction={["column", "row"]} w="full" spacing={4}>
                {Steps.map(step => (
                  <CreateNewAppStepCard {...step} key={step.stepNumber} />
                ))}
              </Stack>
              <HStack alignSelf={"flex-end"} spacing={4}>
                <Button rounded="full" variant={"outline"} colorScheme="primary" size="lg">
                  More info
                </Button>
                <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinueClick}>
                  Continue
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
