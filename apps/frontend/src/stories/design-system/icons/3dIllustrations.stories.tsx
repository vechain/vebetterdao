import { Box, For, Heading, Input, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import Image from "next/image"
import { useMemo, useState } from "react"

import B3moWarningIcon from "../../../../public/assets/3d-illustrations/b3mo-warning.webp"
import B3trIcon from "../../../../public/assets/3d-illustrations/b3tr.webp"
import BallotBoxIcon from "../../../../public/assets/3d-illustrations/ballot-box.webp"
import BellIcon from "../../../../public/assets/3d-illustrations/bell.webp"
import CalendarIcon from "../../../../public/assets/3d-illustrations/calendar.webp"
import DartsIcon from "../../../../public/assets/3d-illustrations/darts.webp"
import HandPhoneIcon from "../../../../public/assets/3d-illustrations/hand-phone.webp"
import NodeIcon from "../../../../public/assets/3d-illustrations/node.webp"
import PencilWritingIcon from "../../../../public/assets/3d-illustrations/pencil-writing.webp"
import RayIcon from "../../../../public/assets/3d-illustrations/ray.webp"
import ReceiveB3trIcon from "../../../../public/assets/3d-illustrations/receive-b3tr.webp"
import RocketIcon from "../../../../public/assets/3d-illustrations/rocket.webp"
import SparklesIcon from "../../../../public/assets/3d-illustrations/sparkles.webp"
import SuccessIcon from "../../../../public/assets/3d-illustrations/success.webp"
import Vot3Icon from "../../../../public/assets/3d-illustrations/vot3.webp"
import VotingPowerIcon from "../../../../public/assets/3d-illustrations/voting-power.webp"
import VotingIcon from "../../../../public/assets/3d-illustrations/voting.webp"

const meta = {
  title: "design-system/icons",
  globals: { viewport: "responsive" },
  parameters: {
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta

export default meta

const icons = [
  { name: "b3mo-warning", src: B3moWarningIcon },
  { name: "b3tr", src: B3trIcon },
  { name: "ballot-box", src: BallotBoxIcon },
  { name: "bell", src: BellIcon },
  { name: "calendar", src: CalendarIcon },
  { name: "darts", src: DartsIcon },
  { name: "hand-phone", src: HandPhoneIcon },
  { name: "node", src: NodeIcon },
  { name: "pencil-writing", src: PencilWritingIcon },
  { name: "ray", src: RayIcon },
  { name: "receive-b3tr", src: ReceiveB3trIcon },
  { name: "rocket", src: RocketIcon },
  { name: "sparkles", src: SparklesIcon },
  { name: "success", src: SuccessIcon },
  { name: "vot3", src: Vot3Icon },
  { name: "voting-power", src: VotingPowerIcon },
  { name: "voting", src: VotingIcon },
]

export const Illustrations3D = () => {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    if (!trimmed) return icons
    const matches = icons.filter(({ name }) => name.toLowerCase().includes(trimmed))
    return matches.length > 0 ? matches : icons
  }, [search])

  return (
    <VStack gap={6} alignItems="stretch">
      <Box as="header" w="full" pb={6} borderBottomWidth="1px" borderBottomColor="border">
        <VStack alignItems="flex-start" gap={4}>
          <Heading size="lg">3D Illustrations</Heading>
          <Input
            placeholder="Search illustrations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            maxW="400px"
          />
        </VStack>
      </Box>
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={6}>
        <For each={filtered}>
          {({ name, src }) => (
            <VStack gap={2}>
              <Box position="relative" w="120px" h="120px">
                <Image alt={name} fill src={src} />
              </Box>
              <Text fontSize="sm">{name}</Text>
            </VStack>
          )}
        </For>
      </SimpleGrid>
    </VStack>
  )
}
