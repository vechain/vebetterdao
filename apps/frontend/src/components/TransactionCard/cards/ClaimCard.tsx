import { Transaction } from "@/api"
import { Card, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilGift } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./BetterActionCard"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"

type Props = {
  transaction: Transaction
}

const compactFormatter = getCompactFormatter(2)

export const ClaimCard = ({ transaction }: Props) => {
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
              <UilGift size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack gap={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text textStyle={"sm"} mr="1">
                  {isConnectedUser ? t("You claimed") : t("Claimed")}
                </Text>
                <Text textStyle={"sm"} fontWeight="semibold">
                  {t("voting rewards")}
                </Text>
              </HStack>
              <Text textStyle={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                {dayjs.unix(transaction?.blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <VStack gap={0} align="stretch">
            <HStack gap={2}>
              <Text fontWeight="semibold">
                {"+"}
                {compactFormatter.format(Number(ethers.formatEther(transaction?.value ?? 0)))}
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
