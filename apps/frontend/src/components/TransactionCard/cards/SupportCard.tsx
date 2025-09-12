import { Card, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilHeart } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { B3trTransaction } from "@/api"
import { ActionModal } from "./BetterActionCard"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
type Props = {
  transaction: B3trTransaction
}

const compactFormatter = getCompactFormatter(2)

export const SupportCard = ({ transaction }: Props) => {
  const { t } = useTranslation()

  const actionModal = useDisclosure()
  const { isConnectedUser } = useRetrieveProfilIdentity()

  return (
    <Card.Root variant={"primary"} w="full" cursor="pointer" onClick={actionModal.onOpen}>
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
              <UilHeart size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack gap={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text textStyle={"sm"} mr="1">
                  {isConnectedUser ? t("You supported a") : t("Supported a")}
                </Text>
                <Text textStyle={"sm"} fontWeight="semibold">
                  {t("proposal")}
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
                {"-"}
                {compactFormatter.format(Number(transaction?.amountVOT3 ?? 0))}
              </Text>
              <Text textStyle="sm">{"VOT3"}</Text>
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
