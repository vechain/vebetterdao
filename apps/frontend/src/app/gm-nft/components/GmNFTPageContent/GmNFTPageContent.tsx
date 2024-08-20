import { Flex, Stack, VStack } from "@chakra-ui/react"
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { AttachXNodeCard } from "./components/AttachXNodeCard"
import { GMNFTListCard } from "./components/GMNFTListCard"

export const GmNFTPageContent = () => {
  return (
    <VStack align="stretch" flex="1" gap="4">
      <GmNFTPageHeader />
      <Stack direction={["column", "column", "column", "row"]} spacing="4" align={"stretch"}>
        <Flex flex={3}>
          <GMNFTListCard />
        </Flex>
        <VStack flex={1.5} align={"stretch"}>
          <AttachXNodeCard />
        </VStack>
      </Stack>
    </VStack>
  )
}
