import { Button, Card, CardBody, CardFooter, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { StepCard, StepCardProps } from "@/components/StepCard"
import { useCallback } from "react"

const Steps: (StepCardProps & {
  route: string
})[] = [
  {
    route: "/proposals/new/form/scratch",
    stepImageSrc: "/images/sign.svg",
    stepNumber: 1,
    stepTitle: "Create a proposal from scratch",
    stepDescription:
      "Craft your proposal from scratch with our guidance. Choose from multiple templates and options to customize the proposal to your liking.",
    variant: "baseWithBorder",
    _hover: {
      cursor: "pointer",
      boxShadow: "md",
      transition: "all 0.2s",
    },
  },
  {
    route: "/proposals/new/form/ai",
    stepImageSrc: "/images/sparks.svg",
    stepNumber: 2,
    stepTitle: "Use AI assistance",
    stepDescription:
      "Create your proposal from a prompt with the help of Artificial Intelligence, and refine it later according to your preferences.",
    variant: "secondaryBoxShadow",
    _hover: {
      cursor: "pointer",
      boxShadow: "inset 0px 0px 100px 5px rgba(147, 222, 88, 1)",
      transition: "all 0.2s",
    },
  },
]
export const NewProposalTypePageContent = () => {
  const router = useRouter()
  const onClick = useCallback(
    (route: string) => () => {
      router.push(route)
    },
    [router],
  )

  return (
    <Card>
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">How do you want to create the proposal?</Heading>
          <Stack direction={["column", "column", "row"]} w="full" spacing={4}>
            {Steps.map(step => (
              <StepCard {...step} key={step.stepNumber} flex={1} onClick={onClick(step.route)} />
            ))}
          </Stack>
        </VStack>
      </CardBody>
    </Card>
  )
}
