import { Button, Card, CardBody, Grid, GridItem, HStack, Heading, Stack, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { CheckableCard, CheckableCardProps } from "@/components"
import { useProposalFormStore } from "@/store/useProposalFormStore"

const Steps: (Omit<CheckableCardProps, "checked" | "onChange"> & {
  route: string
})[] = [
  {
    route: "/proposals/new/form/functions",
    imageSrc: "/images/blockchain.svg",
    title: "Function-driven proposal",
    description:
      "Propose changes to the DAO that involve executing specific functions upon successful voting. These proposals aim to implement concrete actions or modifications within the ecosystem.",
  },
  {
    route: "/proposals/new/form/discussion",
    imageSrc: "/images/people.svg",
    title: "Discussion starter",
    description:
      "Submit proposals containing textual ideas and suggestions to kickstart discussions within the DAO community. These proposals focus on generating ideas and fostering dialogue.",
  },
]
export const NewProposalTypePageContent = () => {
  const { clearData } = useProposalFormStore()
  const [selectedRoute, setSelectedRoute] = useState<string>(Steps[0]?.route as string)
  const router = useRouter()
  const onChange = useCallback(
    (route: string) => () => {
      setSelectedRoute(route)
    },
    [router],
  )

  const onContinue = useCallback(() => {
    if (selectedRoute) {
      clearData()
      router.push(selectedRoute)
    }
  }, [router, selectedRoute, clearData])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(4, 1fr)"]}
      gap={6}
      w="full"
      data-testid="new-app">
      <GridItem colSpan={3}>
        <Card>
          <CardBody py={8}>
            <VStack spacing={8} align="flex-start">
              <Heading size="lg">Select proposal type</Heading>
              <Stack direction={["column", "column", "row"]} w="full" spacing={4}>
                {Steps.map((step, index) => (
                  <CheckableCard
                    {...step}
                    cardProps={{
                      flex: 1,
                    }}
                    key={index}
                    onChange={onChange(step.route)}
                    checked={selectedRoute === step.route}
                  />
                ))}
              </Stack>
              <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
                <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                  Go back
                </Button>
                <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinue}>
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
