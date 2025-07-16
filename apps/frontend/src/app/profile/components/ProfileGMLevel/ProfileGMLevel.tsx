import { useGetUserGMs, useGetUserNodes, UserNode, UserGM } from "@/api"
import { Card, VStack, CardBody, CardHeader, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProfileGMListItem } from "./ProfileGMListItem"

type ListItem = [UserGM | undefined, UserNode | undefined]

export const ProfileGMLevel = () => {
  const { data: userGMs = [] } = useGetUserGMs()
  const { data: userNodes } = useGetUserNodes()
  const { t } = useTranslation()

  const attachedGMsWithNodes: ListItem[] = userGMs
    .filter(gm => gm.nodeIdAttached)
    .map(gm => {
      const node = userNodes?.allNodes?.find(node => node.nodeId === gm.nodeIdAttached)
      return [gm, node]
    })
  const attachedNodesIds = userGMs.filter(gm => gm.nodeIdAttached).map(gm => gm.nodeIdAttached)

  const nodesNotAttached: ListItem[] =
    userNodes?.allNodes?.filter(node => !attachedNodesIds.includes(node.nodeId)).map(node => [undefined, node]) ?? []

  const gmsNotAttached: ListItem[] = userGMs.filter(gm => !gm.nodeIdAttached).map(gm => [gm, undefined])

  const list: ListItem[] = [...attachedGMsWithNodes, ...gmsNotAttached, ...nodesNotAttached]

  return (
    <Card variant="baseWithBorder">
      <CardHeader p="1.25rem" pb="0">
        <Heading fontSize="1.25rem">{t("Your galaxy member")}</Heading>
      </CardHeader>

      <CardBody>
        <VStack gap="4" align="stretch">
          {list.map((listItem, index) => (
            <ProfileGMListItem key={index} gm={listItem[0]} node={listItem[1]} />
          ))}
        </VStack>
      </CardBody>
    </Card>
  )
}
