import { Stack, VStack } from "@chakra-ui/react"
import { XNodePageHeader } from "./components/XNodePageHeader"
import { AttachGMNFTCard } from "./components/AttachGMNFTCard"
import { EndorsingAppCard } from "./components/EndorsingAppCard"
import { EndorsementHistoryList } from "./components/EndorsementHistoryList/EndorsementHistoryList"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useXNode } from "@/api"
import { ConnectWithCreators } from "./components/ConnectWithCreators"

export const XNodeContent = () => {
  const { isXNodeHolder, isXNodeLoading } = useXNode()
  const router = useRouter()

  // Redirect to the dashboard if the user is not an X-Node holder
  useEffect(() => {
    if (!isXNodeHolder && !isXNodeLoading) {
      router.back()
    }
  }, [isXNodeHolder, isXNodeLoading, router])

  if (!isXNodeHolder) return null

  return (
    <VStack align="stretch" flex="1" gap="4">
      <XNodePageHeader />
      <Stack direction={["column", "column", "column", "row"]} spacing="4" align={"stretch"}>
        <VStack flex={3}>
          <AttachGMNFTCard />
          <EndorsingAppCard />
        </VStack>
        <VStack flex={1.5} align={"stretch"}>
          <ConnectWithCreators />
          <EndorsementHistoryList />
        </VStack>
      </Stack>
    </VStack>
  )
}
