import { Card, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilGift } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { formatEther, getAddress } from "viem"

import { Transaction } from "../../../api/indexer/transactions/useTransactions"
import { useRetrieveProfilIdentity } from "../../../app/profile/components/utils/useRetrieveProfilIdentity"

import { ActionModal } from "./BetterActionCard/components/ActionModal"

type Props = {
  transaction: Transaction
}
const compactFormatter = getCompactFormatter(2)
export const ClaimCard = ({ transaction }: Props) => {
  const { t } = useTranslation()
  const actionModal = useDisclosure()
  const { profile, isConnectedUser } = useRetrieveProfilIdentity()
  const isRelayerClaim =
    profile && transaction?.gasPayer ? getAddress(profile) !== getAddress(transaction.gasPayer) : false

  return (
    <Card.Root size="sm" variant="subtle" px={3} py={2} w="full" cursor="pointer" onClick={actionModal.onOpen}>
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
              <UilGift size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack gap={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text textStyle={"sm"} mr="1">
                  {isRelayerClaim
                    ? t("Auto-claimed voting rewards")
                    : isConnectedUser
                      ? t("You claimed")
                      : t("Claimed")}
                </Text>
                {!isRelayerClaim && (
                  <Text textStyle={"sm"} fontWeight="semibold">
                    {t("voting rewards")}
                  </Text>
                )}
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
                {transaction?.value ? compactFormatter.format(Number(formatEther(BigInt(transaction.value)))) : "0"}
              </Text>
              <Text textStyle="sm">{"B3TR"}</Text>
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
