import { Card, CardBody, Heading, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { B3TRIcon } from "../Icons"
import { SustainabilityActionsResponse, useXApps } from "@/api"
import dayjs from "dayjs"
import { ActionModal } from "./ActionModal"

type Props = {
  action: SustainabilityActionsResponse["data"][number]
}
export const BetterActionCard = ({ action }: Props) => {
  const { data: apps } = useXApps()

  const getAppName = (appId: string) => {
    return apps?.find(app => app.id === appId)?.name ?? ""
  }

  const actionModal = useDisclosure()

  return (
    <Card variant={"filled"} w="full" onClick={actionModal.onOpen} cursor="pointer">
      <CardBody>
        <HStack spacing={4} w="full" justify="space-between">
          <HStack spacing={4}>
            <B3TRIcon />
            <VStack spacing={0} align="stretch">
              <Heading size="xs">{`Better action in ${getAppName(action?.appId ?? "")}`}</Heading>
              <Text>{dayjs.unix(action?.blockTimestamp ?? 0).fromNow()}</Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Text>
              {action.amount} {"B3TR"}
            </Text>
          </HStack>
        </HStack>
      </CardBody>
      <ActionModal actionModal={actionModal} action={action} />
    </Card>
  )
}
