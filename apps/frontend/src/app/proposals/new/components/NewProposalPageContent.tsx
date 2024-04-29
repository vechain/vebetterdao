import { Button, Card, CardBody, Grid, GridItem, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { StepCard, StepCardProps } from "@/components/StepCard"

const Steps: StepCardProps[] = [
  {
    stepImageSrc: "/images/sign.svg",
    stepNumber: 1,
    stepTitle: "Creation",
    stepDescription: "Craft your proposal by outlining the information and functions to be executed.",
  },
  {
    stepImageSrc: "/images/handshake.svg",
    stepNumber: 2,
    stepTitle: "Funding",
    stepDescription:
      "For a proposal to became active, you'll need to lock X BT3R tokens. If you lack sufficient tokens or prefer not to use them all, your proposal can be supported by the community.",
  },

  {
    stepImageSrc: "/images/vote.svg",
    stepNumber: 3,
    stepTitle: "Voting",
    stepDescription:
      "If your proposal gets funded before the voting session starts, the community will vote to decide if they support or reject your idea.",
  },
  {
    stepImageSrc: "/images/arrow-right.svg",
    stepNumber: 4,
    stepTitle: "Execution",
    stepDescription: "If your proposal receives enough votes, it will be executed.",
  },
]
export const NewProposalPageContent = () => {
  const router = useRouter()
  const onContinueClick = () => {
    router.push("/proposals/new/type")
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
              <Heading size="lg">Create a new proposal</Heading>
              <Text>
                Proposals represent your ideas as a valued member of the DAO community, aimed at enhancing or modifying
                aspects of the ecosystem. Each proposal undergoes a voting process, and upon approval, is brought to
                life.
              </Text>
              <Stack direction={["column"]} w="full" spacing={4}>
                {Steps.map(step => (
                  <StepCard
                    {...step}
                    key={step.stepNumber}
                    flex={1}
                    stackProps={{
                      direction: ["column", "column", "row"],
                      alignItems: ["flex-start", "flex-start", "center"],
                    }}
                  />
                ))}
              </Stack>
              <Stack direction={["column", "column", "row"]} w="full" justify={"space-between"} spacing={8}>
                <HStack justify={"flex-end"} spacing={4} flex={1}>
                  <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg">
                    More info
                  </Button>
                  <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinueClick}>
                    Continue
                  </Button>
                </HStack>
              </Stack>
            </VStack>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem colSpan={1}></GridItem>
    </Grid>
  )
}
