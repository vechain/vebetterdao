import { Card, CardBody, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { SustainabilityActionsResponse, useXApps } from "@/api"
import dayjs from "dayjs"
import { LeafIcon } from "../../../Icons/LeafIcon"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./components/ActionModal"

type Props = {
  action: SustainabilityActionsResponse["data"][number]
}
export const BetterActionCard = ({ action }: Props) => {
  const { data: apps } = useXApps()
  const { t } = useTranslation()

  const getAppName = (appId: string) => {
    return apps?.find(app => app.id === appId)?.name ?? ""
  }

  const actionModal = useDisclosure()

  return (
    <Card variant={"filledSmall"} w="full" onClick={actionModal.onOpen} cursor="pointer">
      <CardBody>
        <HStack spacing={3} w="full" justify="space-between">
          <HStack spacing={4}>
            <Flex w={8} h={8} bg="#CDFF9F" align="center" justify="center" borderRadius={"full"}>
              <LeafIcon size={"1rem"} />
            </Flex>
            <VStack spacing={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text fontSize={"sm"} mr="1">
                  {t("Better action on")}
                </Text>
                <Text fontSize={"sm"} fontWeight={600}>
                  {getAppName(action?.appId ?? "")}
                </Text>
              </HStack>
              <Text fontSize={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                {dayjs.unix(action?.blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Text fontWeight={600}>
              {"+"}
              {action.amount}
            </Text>
            <Text fontWeight={400} fontSize={"sm"}>
              {"B3TR"}
            </Text>
          </HStack>
        </HStack>
      </CardBody>
      <ActionModal actionModal={actionModal} action={action} />
    </Card>
  )
}
