"use client"
import { useBreakpoints } from "@/hooks"
import { Grid, GridItem, Spinner, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"

type Props = {
  children: React.ReactNode
  params: {
    roundId: string
  }
}

const CastAllocationVoteStepperCard = dynamic(
  () => import("./components/CastAllocationVoteStepperCard").then(mod => mod.CastAllocationVoteStepperCard),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

const YourVoteBalanceCard = dynamic(
  () => import("./components/YourVoteBalanceCard").then(mod => mod.YourVoteBalanceCard),
  {
    ssr: false,
    loading: () => (
      <VStack w="full" spacing={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function CastAllocationVoteLayout({ children, params }: Readonly<Props>) {
  const { isMobile } = useBreakpoints()
  if (isMobile)
    return (
      <VStack spacing={8} align="flex-start" w="full" mt={4}>
        <CastAllocationVoteStepperCard />
        <YourVoteBalanceCard roundId={params.roundId} />
        {children}
      </VStack>
    )

  return (
    <Grid
      templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(3, 1fr)"]}
      gap={8}
      w="full"
      data-testid="cast-allocation-vote-layout">
      <GridItem colSpan={[1, 1, 2]}>{children}</GridItem>
      <GridItem colSpan={1}>
        <VStack spacing={8} align="flex-start" w="full" pos={"sticky"} top={24} left={0}>
          <CastAllocationVoteStepperCard />
          <YourVoteBalanceCard roundId={params.roundId} />
        </VStack>
      </GridItem>
    </Grid>
  )
}
