"use client"

import { Box, Stack, VStack } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { AllocationRoundUserVotes } from "../components/AllocationRoundUserVotes/AllocationRoundUserVotes"

const AllocationRoundDetails = dynamic(
  () => import("../components/AllocationRoundDetails").then(mod => mod.AllocationRoundDetails),
  { ssr: false },
)
const AllocationRoundNavbar = dynamic(
  () => import("../components/AllocationRoundNavbar").then(mod => mod.AllocationRoundNavbar),
  { ssr: false },
)
const AllocationXAppsVotesCard = dynamic(
  () => import("@/components/AllocationXAppsVotesCard").then(mod => mod.AllocationXAppsVotesCard),
  { ssr: false },
)
const AllocationRoundSessionInfoCard = dynamic(
  () => import("../components/AllocationRoundSessionInfoCard").then(mod => mod.AllocationRoundSessionInfoCard),
  { ssr: false },
)

const AllocationRoundUserVotes = dynamic(
  () =>
    import("../components/AllocationRoundUserVotes/AllocationRoundUserVotes").then(mod => mod.AllocationRoundUserVotes),
  { ssr: false },
)

export default function Round({ params }: { params: { roundId: string } }) {
  return (
    <VStack w="full" spacing={8}>
      <AllocationRoundNavbar roundId={params.roundId} />
      <AllocationRoundDetails roundId={params.roundId} />
      <Stack direction={["column-reverse", "column-reverse", "row"]} w="full" justify="space-between" spacing={8}>
        <Box flex={0.75}>
          <AllocationXAppsVotesCard roundId={params.roundId} />
        </Box>
        <VStack flex={0.25} spacing={8}>
          <AllocationRoundSessionInfoCard roundId={params.roundId} />
        </VStack>
      </Stack>
      <AllocationRoundUserVotes roundId={params.roundId} />
    </VStack>
  )
}
