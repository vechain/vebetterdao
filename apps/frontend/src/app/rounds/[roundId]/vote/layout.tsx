"use client"
import { useBreakpoints } from "@/hooks"
import { VStack, Spinner, Grid, GridItem } from "@chakra-ui/react"
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
      <VStack w="full" gap={12} h="80vh" justify="center">
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
      <VStack w="full" gap={12} h="80vh" justify="center">
        <Spinner size={"lg"} />
      </VStack>
    ),
  },
)

export default function CastAllocationVoteLayout({ children, params }: Readonly<Props>) {
  const { isMobile } = useBreakpoints()
  if (isMobile)
    return (
      <VStack gap={8} align="flex-start" mt={4} bg={"info-bg"} w="100vw" p={6}>
        <YourVoteBalanceCard roundId={params.roundId} />
        <VStack gap={8} align="flex-start" w="full">
          <CastAllocationVoteStepperCard />

          {children}
        </VStack>
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
        <VStack gap={8} align="flex-start" w="full" pos={"sticky"} top={24} left={0}>
          <CastAllocationVoteStepperCard />
          <YourVoteBalanceCard roundId={params.roundId} />
        </VStack>
      </GridItem>
    </Grid>
  )
}
