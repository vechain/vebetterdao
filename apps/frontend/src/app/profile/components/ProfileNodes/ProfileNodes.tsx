import { useGetUserNodes } from "@/api"
import { Card, VStack, Heading, Text, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { NodeCard } from "./NodeCard"

export const ProfileNodes = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes(address)

  return (
    <VStack gap="4" align="stretch">
      <Card.Root variant="baseWithBorder">
        <Card.Header p="1.25rem" pb="0">
          <Heading fontSize="1.25rem">{t("Nodes")}</Heading>
        </Card.Header>

        <Card.Body>
          <Skeleton loading={isUserNodesLoading}>
            {userNodes?.allNodes?.length === 0 ? (
              <Text>{t("No nodes found.")}</Text>
            ) : (
              <VStack gap="4" align="stretch">
                {userNodes?.allNodes?.map(node => (
                  <NodeCard key={node.nodeId} node={node} isClickable={account?.address === address} />
                ))}
              </VStack>
            )}
          </Skeleton>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
