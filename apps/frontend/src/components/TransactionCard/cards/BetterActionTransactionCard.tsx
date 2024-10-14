import { Card, CardBody, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { B3trTransaction, useXApps } from "@/api"
import dayjs from "dayjs"
import { LeafIcon } from "../../Icons/LeafIcon"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./BetterActionCard"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

type Props = {
  transaction: B3trTransaction
}

const compactFormatter = getCompactFormatter(2)

export const BetterActionTransactionCard = ({ transaction }: Props) => {
  const { t } = useTranslation()

  const { data: apps } = useXApps()

  const actionModal = useDisclosure()

  const getAppName = (appId: string) => {
    return apps?.find(app => app.id === appId)?.name ?? ""
  }

  return (
    <Card variant={"filledSmall"} w="full" cursor="pointer" onClick={actionModal.onOpen}>
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
                  {getAppName(transaction?.appId ?? "")}
                </Text>
              </HStack>
              <Text fontSize={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                {dayjs.unix(transaction?.blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Text fontWeight={600}>
              {"+"}
              {compactFormatter.format(Number(transaction?.amountB3TR ?? 0))}
            </Text>
            <Text fontWeight={400} fontSize={"sm"}>
              {"B3TR"}
            </Text>
          </HStack>
        </HStack>
      </CardBody>
      <ActionModal
        actionModal={actionModal}
        appId={transaction?.appId}
        blockNumber={transaction?.blockNumber}
        blockTimestamp={transaction?.blockTimestamp}
        b3trAmount={transaction?.amountB3TR}
        txId={transaction?.txId}
      />
    </Card>
  )
}
