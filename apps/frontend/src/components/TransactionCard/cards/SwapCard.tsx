import { Card, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilExchangeAlt } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"

import { Transaction } from "../../../api/indexer/transactions/useTransactions"
import { useRetrieveProfilIdentity } from "../../../app/profile/components/utils/useRetrieveProfilIdentity"

import { ActionModal } from "./BetterActionCard/components/ActionModal"

type Props = {
  transaction: Transaction
  vot3ToB3tr: boolean
}
const compactFormatter = getCompactFormatter(2)
export const SwapCard = ({ transaction, vot3ToB3tr }: Props) => {
  const { t } = useTranslation()
  const actionModal = useDisclosure()
  const { isConnectedUser } = useRetrieveProfilIdentity()
  return (
    <Card.Root size="sm" variant={"primary"} w="full" cursor="pointer" onClick={actionModal.onOpen}>
      <Card.Body>
        <HStack gap={3} w="full" justify="space-between">
          <HStack gap={4}>
            <Flex
              w="fit-content"
              h="fit-content"
              p={2}
              bg="#DDEFFF"
              align="center"
              justify="center"
              borderRadius={"full"}>
              <UilExchangeAlt size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack gap={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text textStyle={"sm"} mr="1">
                  {isConnectedUser ? t("You converted") : t("Converted")}
                </Text>
                <Text textStyle={"sm"} fontWeight="semibold">
                  {vot3ToB3tr ? "VOT3" : "B3TR"} {t("to")} {vot3ToB3tr ? "B3TR" : "VOT3"}
                </Text>
              </HStack>
              <Text textStyle={"xs"} color={"#6A6A6A"}>
                {dayjs.unix(transaction?.blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <VStack gap={0} align="stretch">
            <HStack gap={2}>
              <Text fontWeight="semibold">
                {"+"}
                {compactFormatter.format(Number(ethers.formatEther(transaction?.outputValue ?? 0)))}
              </Text>
              <Text textStyle="sm">{vot3ToB3tr ? "B3TR" : "VOT3"}</Text>
            </HStack>
            <HStack gap={2} textStyle={"xs"} color={"#6A6A6A"}>
              <Text fontWeight="semibold">
                {compactFormatter.format(Number(ethers.formatEther(transaction?.inputValue ?? 0)))}
              </Text>
              <Text>{vot3ToB3tr ? "VOT3" : "B3TR"}</Text>
            </HStack>
          </VStack>
        </HStack>
      </Card.Body>
      <ActionModal
        actionModal={actionModal}
        appId={transaction?.appId}
        blockNumber={transaction?.blockNumber}
        blockTimestamp={transaction?.blockTimestamp}
        txId={transaction?.txId}
      />
    </Card.Root>
  )
}
