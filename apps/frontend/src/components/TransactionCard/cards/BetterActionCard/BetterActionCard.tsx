import { Card, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { SustainabilityActionsResponse, useXApps } from "@/api"
import dayjs from "dayjs"
import { LeafIcon } from "../../../Icons/LeafIcon"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./components/ActionModal"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const compactFormatter = getCompactFormatter(2)

type Props = {
  appId?: string
  blockNumber?: number
  blockTimestamp?: number
  amountB3tr?: number
  proof?: SustainabilityActionsResponse["data"][number]["proof"]
}
export const BetterActionCard = ({ appId, blockNumber, blockTimestamp, amountB3tr, proof }: Props) => {
  const { data: apps } = useXApps()
  const { t } = useTranslation()

  const getAppName = (appId: string) => {
    return apps?.allApps.find(app => app.id === appId)?.name ?? ""
  }

  const actionModal = useDisclosure()

  return (
    <Card.Root variant={"filledSmall"} w="full" onClick={actionModal.onOpen} cursor="pointer">
      <Card.Body>
        <HStack gap={3} w="full" justify="space-between">
          <HStack gap={4}>
            <Flex
              w="fit-content"
              h="fit-content"
              p={2}
              bg="#CDFF9F"
              align="center"
              justify="center"
              borderRadius={"full"}>
              <LeafIcon size={"1rem"} />
            </Flex>
            <VStack gap={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text textStyle={"sm"} mr="1">
                  {t("Better action on")}
                </Text>
                <Text textStyle={"sm"} fontWeight={600}>
                  {getAppName(appId ?? "")}
                </Text>
              </HStack>
              <Text textStyle={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                {dayjs.unix(blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2}>
            <Text fontWeight={600}>
              {"+"}
              {compactFormatter.format(Number(amountB3tr))}
            </Text>
            <Text textStyle="sm">{"B3TR"}</Text>
          </HStack>
        </HStack>
      </Card.Body>
      <ActionModal
        actionModal={actionModal}
        proof={proof}
        appId={appId}
        blockNumber={blockNumber}
        blockTimestamp={blockTimestamp}
        b3trAmount={amountB3tr}
      />
    </Card.Root>
  )
}
