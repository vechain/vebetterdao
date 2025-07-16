import { Stack, VStack } from "@chakra-ui/react"
import { XNodePageHeader } from "./components/XNodePageHeader"
import { AttachGMNFTCard } from "./components/AttachGMNFTCard"
import { EndorsingAppCard } from "./components/EndorsingAppCard"
import { EndorsementHistoryList } from "./components/EndorsementHistoryList/EndorsementHistoryList"
import { useGetUserNodes } from "@/api"
import { DelegateXNodeCard } from "./components/XNodeDelegation"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

type Props = {
  xNodeId: string
}

export const XNodeContent = ({ xNodeId }: Props) => {
  const { data: nodes, isLoading: isUserNodesLoading } = useGetUserNodes()
  const isXNodeHolder = nodes?.allNodes?.length && nodes?.allNodes?.length > 0
  const router = useRouter()

  const xNode = nodes?.allNodes?.find(node => node.nodeId === xNodeId)

  // Redirect to the dashboard if the user is not an X-Node holder
  useEffect(() => {
    if (!isXNodeHolder && !isUserNodesLoading) {
      router.push("/")
    }
  }, [isXNodeHolder, isUserNodesLoading, router])

  // if (!isXNodeHolder && !isXNodeDelegator) return null

  if (!xNode) return null

  return (
    <VStack align="stretch" flex="1" gap="4">
      <XNodePageHeader xNode={xNode} />
      <Stack direction={["column", "column", "column", "row"]} spacing="4" align={"stretch"}>
        <VStack flex={3}>
          <DelegateXNodeCard xNode={xNode} />
          <AttachGMNFTCard xNode={xNode} />
          <EndorsingAppCard xNode={xNode} />
        </VStack>
        <VStack flex={1.5} align={"stretch"}>
          <EndorsementHistoryList xNode={xNode} />
        </VStack>
      </Stack>
    </VStack>
  )
}
