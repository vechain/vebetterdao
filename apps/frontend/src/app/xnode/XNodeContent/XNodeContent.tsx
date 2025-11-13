import { Stack, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"

import { AttachGMNFTCard } from "./components/AttachGMNFTCard"
import { EndorsementHistoryList } from "./components/EndorsementHistoryList/EndorsementHistoryList"
import { EndorsingAppCard } from "./components/EndorsingAppCard"
import { XNodePageHeader } from "./components/XNodePageHeader"

type Props = {
  xNodeId: string
}
export const XNodeContent = ({ xNodeId }: Props) => {
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const isXNodeHolder = userNodesInfo?.nodesManagedByUser?.length && userNodesInfo?.nodesManagedByUser?.length > 0
  const router = useRouter()
  const node = userNodesInfo?.nodesManagedByUser?.find(node => node.id.toString() === xNodeId)
  // Redirect to the dashboard if the user is not an X-Node holder
  useEffect(() => {
    if (!isXNodeHolder && !isUserNodesLoading) {
      router.push("/")
    }
  }, [isXNodeHolder, isUserNodesLoading, router])
  if (!node) return null
  return (
    <VStack align="stretch" flex="1" gap="4">
      <XNodePageHeader node={node} />
      <Stack direction={["column", "column", "column", "row"]} gap="4" align={"stretch"}>
        <VStack flex={3}>
          <AttachGMNFTCard node={node} />
          <EndorsingAppCard node={node} />
        </VStack>
        <VStack flex={1.5} align={"stretch"}>
          <EndorsementHistoryList node={node} />
        </VStack>
      </Stack>
    </VStack>
  )
}
