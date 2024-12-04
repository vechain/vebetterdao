import { B3trTransaction } from "@/api"
import { Card, CardBody, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilExchangeAlt } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./BetterActionCard"
import { useMemo } from "react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useIsUserConnectedProfile } from "@/app/profile/components/utils/useIsUserConnectedProfile"
import { useParams } from "next/navigation"
type Props = {
  transaction: B3trTransaction
}

const compactFormatter = getCompactFormatter(2)

export const SwapCard = ({ transaction }: Props) => {
  const { t } = useTranslation()
  const vot3ToB3tr = useMemo(() => {
    if (!transaction?.amountB3TR || !transaction?.amountVOT3) return false

    return transaction.amountB3TR > transaction.amountVOT3
  }, [transaction.amountB3TR, transaction.amountVOT3])

  const actionModal = useDisclosure()
  const { profile: address } = useParams<{ profile: string }>()
  const isConnectedUser = useIsUserConnectedProfile(address)

  return (
    <Card variant={"filledSmall"} w="full" cursor="pointer" onClick={actionModal.onOpen}>
      <CardBody>
        <HStack spacing={3} w="full" justify="space-between">
          <HStack spacing={4}>
            <Flex w={8} h={8} bg="#DDEFFF" align="center" justify="center" borderRadius={"full"}>
              <UilExchangeAlt size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack spacing={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text fontSize={"sm"} mr="1">
                  {t("{{value}} converted", {
                    value: isConnectedUser ? "You" : `${humanAddress(address ?? "", 4, 3)}`,
                  })}
                </Text>
                <Text fontSize={"sm"} fontWeight={600}>
                  {vot3ToB3tr ? "VOT3" : "B3TR"} {t("to")} {vot3ToB3tr ? "B3TR" : "VOT3"}
                </Text>
              </HStack>
              <Text fontSize={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                {dayjs.unix(transaction?.blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <VStack spacing={0} align="stretch">
            <HStack spacing={2}>
              <Text fontWeight={600}>
                {"+"}
                {vot3ToB3tr
                  ? compactFormatter.format(Number(transaction?.amountB3TR ?? 0))
                  : compactFormatter.format(Number(transaction?.amountVOT3 ?? 0))}
              </Text>
              <Text fontWeight={400} fontSize={"sm"}>
                {vot3ToB3tr ? "B3TR" : "VOT3"}
              </Text>
            </HStack>
            <HStack spacing={2} fontSize={"xs"} color={"#6A6A6A"}>
              <Text fontWeight={600}>
                {vot3ToB3tr
                  ? compactFormatter.format(Number(transaction?.amountVOT3 ?? 0))
                  : compactFormatter.format(Number(transaction?.amountB3TR ?? 0))}
              </Text>
              <Text fontWeight={400}>{vot3ToB3tr ? "VOT3" : "B3TR"}</Text>
            </HStack>
          </VStack>
        </HStack>
      </CardBody>
      <ActionModal
        actionModal={actionModal}
        appId={transaction?.appId}
        blockNumber={transaction?.blockNumber}
        blockTimestamp={transaction?.blockTimestamp}
        txId={transaction?.txId}
      />
    </Card>
  )
}
