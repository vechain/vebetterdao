import { Flex, Stack, VStack } from "@chakra-ui/react"
import { XNodePageHeader } from "./components/XNodePageHeader"
import { AttachGMNFTCard } from "./components/AttachGMNFTCard"
import { EndorsingAppCard } from "./components/EndorsingAppCard"
import { EndorsementHistoryCard } from "./components/EndorsementHistoryCard"

export const XNodeContent = () => {
  return (
    <VStack align="stretch" flex="1" gap="4">
      <XNodePageHeader />
      <Stack direction={["column", "column", "column", "row"]} spacing="4" align={"stretch"}>
        <Flex flex={3}>
          <EndorsingAppCard />
        </Flex>
        <VStack flex={1.5} align={"stretch"}>
          <AttachGMNFTCard />
          <EndorsementHistoryCard />
        </VStack>
      </Stack>
    </VStack>
  )
}
