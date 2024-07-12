import { useBreakpoints } from "@/hooks"
import { Grid, GridItem, Spinner, VStack } from "@chakra-ui/react"
import { Metadata, ResolvingMetadata } from "next"
import dynamic from "next/dynamic"

type Props = {
  children: React.ReactNode
  params: {
    roundId: string
  }
}

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const id = params.roundId

  // optionally access and extend (rather than replace) parent metadata
  //   const previousImages = (await parent).openGraph?.images || []

  console.log("Generating metadata for round", id)

  return {
    title: `Round ${id} - VeBetterDAO`,
    openGraph: {
      description: `Cast your vote for round ${id} on VeBetterDAO and earn rewards!`,
    },
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
      <VStack spacing={8} align="flex-start" mt={4} bg="#FFF" w="100vw" p={6}>
        <YourVoteBalanceCard roundId={params.roundId} />
        <VStack spacing={8} align="flex-start" w="full">
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
        <VStack spacing={8} align="flex-start" w="full" pos={"sticky"} top={24} left={0}>
          <CastAllocationVoteStepperCard />
          <YourVoteBalanceCard roundId={params.roundId} />
        </VStack>
      </GridItem>
    </Grid>
  )
}
