import { useGetUserNodes } from "@/api"
import { Card, VStack, CardBody, CardHeader, Heading, Text, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { NodeCard } from "./NodeCard"

export const ProfileNodes = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes(address)

  return (
    <VStack gap="4" align="stretch">
      <Card variant="baseWithBorder">
        <CardHeader p="1.25rem" pb="0">
          <Heading fontSize="1.25rem">{t("Nodes")}</Heading>
        </CardHeader>

        <CardBody>
          <Skeleton isLoaded={!isUserNodesLoading}>
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
        </CardBody>
      </Card>
    </VStack>
  )
}
