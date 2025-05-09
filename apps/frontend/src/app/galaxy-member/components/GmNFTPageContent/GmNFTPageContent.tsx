import { Stack, VStack } from "@chakra-ui/react"
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { AttachXNodeCard } from "./components/AttachXNodeCard"
import { GMNFTList } from "./components/GMNFTList/GMNFTList"
import { GalaxyLevelsCard } from "./components/GalaxyLevelsCard"
import { GalaxyRewardCalculatorCard } from "./components/GalaxyRewardCalculatorCard"
import { GmPoolAmountCard } from "./components/GmPoolAmountCard"
import { useSelectedGmNft } from "@/api"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MultipleXNodesAlert } from "@/app/xnode/XNodeContent/components/XNodeDelegation/MultipleXNodesAlert"

export const GmNFTPageContent = () => {
  const { gmId, isLoading } = useSelectedGmNft()
  const router = useRouter()

  // Redirect to the previous page if the user is not a GM NFT holder
  useEffect(() => {
    if (!Number(gmId) && !isLoading) {
      router.push("/")
    }
  }, [gmId, isLoading, router])

  if (!Number(gmId)) return null

  return (
    <VStack align="stretch" flex="1" gap="4">
      <GmNFTPageHeader />
      <Stack direction={["column", "column", "column", "row"]} spacing="4" align={"stretch"}>
        <VStack flex={3}>
          <MultipleXNodesAlert />
          <AttachXNodeCard />
          <GMNFTList />
        </VStack>
        <VStack flex={1.5} align={"stretch"}>
          <GalaxyRewardCalculatorCard />
          <GmPoolAmountCard />
          <GalaxyLevelsCard />
        </VStack>
      </Stack>
    </VStack>
  )
}
