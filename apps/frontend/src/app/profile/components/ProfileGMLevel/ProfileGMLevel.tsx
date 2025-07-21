import { useGetUserGMs, useGetUserNodes, UserNode, UserGM } from "@/api"
import { Card, VStack, CardBody, CardHeader, Heading, Text, Spinner, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProfileGMListItem } from "./ProfileGMListItem"
import { useWallet } from "@vechain/vechain-kit"

type ListItem = [UserGM | undefined, UserNode | undefined]

export const ProfileGMLevel = ({ address }: { address: string }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userGMs = [], isLoading: isUserGMsLoading } = useGetUserGMs(address)
  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes(address)

  const attachedGMsWithNodes: ListItem[] = userGMs
    .filter(gm => gm.nodeIdAttached && gm.nodeIdAttached !== "0")
    .map(gm => {
      const node = userNodes?.allNodes?.find(node => node.nodeId === gm.nodeIdAttached)
      return [gm, node]
    })
  const attachedNodesIds = userGMs.filter(gm => gm.nodeIdAttached).map(gm => gm.nodeIdAttached)

  const nodesNotAttached: ListItem[] =
    userNodes?.allNodes?.filter(node => !attachedNodesIds.includes(node.nodeId)).map(node => [undefined, node]) ?? []

  const gmsNotAttached: ListItem[] = userGMs
    .filter(gm => !gm.nodeIdAttached || gm.nodeIdAttached === "0")
    .map(gm => [gm, undefined])

  const list: ListItem[] = [...attachedGMsWithNodes, ...gmsNotAttached, ...nodesNotAttached]

  return (
    <Card variant="baseWithBorder">
      <CardHeader p="1.25rem" pb="0">
        <Heading fontSize="1.25rem">{t("Your galaxy member")}</Heading>
      </CardHeader>

      <CardBody>
        <Skeleton isLoaded={!isUserGMsLoading && !isUserNodesLoading}>
          {isUserGMsLoading || isUserNodesLoading ? (
            <Spinner />
          ) : list.length === 0 ? (
            <Text>{t("No galaxy members found.")}</Text>
          ) : (
            <VStack gap="4" align="stretch">
              {list.map((listItem, index) => (
                <ProfileGMListItem
                  key={index}
                  gm={listItem[0]}
                  node={listItem[1]}
                  isClickable={account?.address === address}
                />
              ))}
            </VStack>
          )}
        </Skeleton>
      </CardBody>
    </Card>
  )
}
