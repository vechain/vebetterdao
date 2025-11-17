import { Card, VStack, Heading, Skeleton, Icon } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { EmptyStateCard } from "@/components/EmptyStateCard"
import NodeIcon from "@/components/Icons/svg/node.svg"
import { STARGATE_URL } from "@/constants/links"

import { useGetUserNodes, UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"

import { NodeCard } from "./NodeCard"

export const ProfileNodes = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes(address)

  const isCurrentUser = useMemo(() => compareAddresses(account?.address ?? "", address), [account?.address, address])

  return (
    <VStack gap="4" align="stretch">
      <Card.Root variant="primary">
        <Card.Header>
          <Heading size="xl">{t("Nodes")}</Heading>
        </Card.Header>
        <Card.Body>
          <Skeleton loading={isUserNodesLoading} w="full" h="full" minH="400px" borderRadius="md">
            {userNodes?.allNodes?.length === 0 ? (
              <EmptyStateCard
                icon={
                  <Icon boxSize={36}>
                    <NodeIcon />
                  </Icon>
                }
                title={t("No nodes found.")}
                description={t("Visit Stargate to know more about nodes and how to get one.")}
                rootProps={{ size: "sm", bg: "transparent" }}
                action={{
                  label: t("Visit Stargate"),
                  onClick: () => window.open(STARGATE_URL, "_blank"),
                }}
              />
            ) : (
              <VStack gap="4" align="stretch">
                {userNodes?.allNodes?.map((node: UserNode) => (
                  <NodeCard
                    key={node.id.toString()}
                    node={node}
                    isClickable={isCurrentUser && node.currentUserIsManager}
                  />
                ))}
              </VStack>
            )}
          </Skeleton>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
