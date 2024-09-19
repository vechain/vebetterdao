import { Flex, Stack, VStack } from "@chakra-ui/react"
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { AttachXNodeCard } from "./components/AttachXNodeCard"
import { GMNFTList } from "./components/GMNFTList/GMNFTList"
import { GalaxyLevelsCard } from "./components/GalaxyLevelsCard"

export const GmNFTPageContent = () => {
  return (
    <VStack align="stretch" flex="1" gap="4">
      <GmNFTPageHeader />
      <Stack direction={["column", "column", "column", "row"]} spacing="4" align={"stretch"}>
        <Flex flex={3}>
          <GMNFTList />
        </Flex>
        <VStack flex={1.5} align={"stretch"}>
          <AttachXNodeCard />
          <GalaxyLevelsCard />
        </VStack>
      </Stack>
    </VStack>
  )
}
