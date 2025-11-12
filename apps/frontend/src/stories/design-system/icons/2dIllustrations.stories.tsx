import { Box, For, Heading, Input, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import Image from "next/image"
import { useMemo, useState } from "react"

import AirdropIcon from "../../../../public/assets/icons/2d-illustrations/airdrop.svg"
import AlertIcon from "../../../../public/assets/icons/2d-illustrations/alert.svg"
import ArrowDoodleIcon from "../../../../public/assets/icons/2d-illustrations/arrow-doodle.svg"
import ArrowRightIcon from "../../../../public/assets/icons/2d-illustrations/arrow-right.svg"
import B3trInBoxIcon from "../../../../public/assets/icons/2d-illustrations/b3tr-in-box.svg"
import B3trIcon from "../../../../public/assets/icons/2d-illustrations/b3tr.svg"
import BlockchainIcon from "../../../../public/assets/icons/2d-illustrations/blockchain.svg"
import CloudIcon from "../../../../public/assets/icons/2d-illustrations/cloud.svg"
import DocumentIcon from "../../../../public/assets/icons/2d-illustrations/document.svg"
import EarthIcon from "../../../../public/assets/icons/2d-illustrations/earth.svg"
import GiftIcon from "../../../../public/assets/icons/2d-illustrations/gift.svg"
import HandPlantIcon from "../../../../public/assets/icons/2d-illustrations/hand-plant.svg"
import HandshakeIcon from "../../../../public/assets/icons/2d-illustrations/handshake.svg"
import MagnifyingGlassIcon from "../../../../public/assets/icons/2d-illustrations/magnifying-glass.svg"
import MedalIcon from "../../../../public/assets/icons/2d-illustrations/medal.svg"
import NftEarthIcon from "../../../../public/assets/icons/2d-illustrations/nft-earth.svg"
import NodeIcon from "../../../../public/assets/icons/2d-illustrations/node.svg"
import OkHandIcon from "../../../../public/assets/icons/2d-illustrations/ok-hand.svg"
import PaperAirplaneIcon from "../../../../public/assets/icons/2d-illustrations/paper-airplane.svg"
import PeopleIcon from "../../../../public/assets/icons/2d-illustrations/people.svg"
import PlantIcon from "../../../../public/assets/icons/2d-illustrations/plant.svg"
import ShareIcon from "../../../../public/assets/icons/2d-illustrations/share.svg"
import SignIcon from "../../../../public/assets/icons/2d-illustrations/sign.svg"
import SparksIcon from "../../../../public/assets/icons/2d-illustrations/sparks.svg"
import TokensIcon from "../../../../public/assets/icons/2d-illustrations/tokens.svg"
import Vot3InBoxIcon from "../../../../public/assets/icons/2d-illustrations/vot3-in-box.svg"
import Vot3Icon from "../../../../public/assets/icons/2d-illustrations/vot3.svg"
import VoteIcon from "../../../../public/assets/icons/2d-illustrations/vote.svg"
import WalletIcon from "../../../../public/assets/icons/2d-illustrations/wallet.svg"

const meta = {
  title: "design-system/icons",
  globals: { viewport: "responsive" },
  parameters: {
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta

export default meta

const icons = [
  { name: "airdrop", component: AirdropIcon },
  { name: "alert", component: AlertIcon },
  { name: "arrow-doodle", component: ArrowDoodleIcon },
  { name: "arrow-right", component: ArrowRightIcon },
  { name: "b3tr-in-box", component: B3trInBoxIcon },
  { name: "b3tr", component: B3trIcon },
  { name: "blockchain", component: BlockchainIcon },
  { name: "cloud", component: CloudIcon },
  { name: "document", component: DocumentIcon },
  { name: "earth", component: EarthIcon },
  { name: "gift", component: GiftIcon },
  { name: "hand-plant", component: HandPlantIcon },
  { name: "handshake", component: HandshakeIcon },
  { name: "magnifying-glass", component: MagnifyingGlassIcon },
  { name: "medal", component: MedalIcon },
  { name: "nft-earth", component: NftEarthIcon },
  { name: "node", component: NodeIcon },
  { name: "ok-hand", component: OkHandIcon },
  { name: "paper-airplane", component: PaperAirplaneIcon },
  { name: "people", component: PeopleIcon },
  { name: "plant", component: PlantIcon },
  { name: "share", component: ShareIcon },
  { name: "sign", component: SignIcon },
  { name: "sparks", component: SparksIcon },
  { name: "tokens", component: TokensIcon },
  { name: "vot3-in-box", component: Vot3InBoxIcon },
  { name: "vot3", component: Vot3Icon },
  { name: "vote", component: VoteIcon },
  { name: "wallet", component: WalletIcon },
]

export const Illustrations2D = () => {
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
          <Heading size="lg">2D Illustrations</Heading>
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
          {({ name, component: src }) => (
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
