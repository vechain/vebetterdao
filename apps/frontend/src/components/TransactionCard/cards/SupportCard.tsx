import { Card, CardBody, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilHeart } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { B3trTransaction } from "@/api"
import { ActionModal } from "./BetterActionCard"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useIsUserConnectedProfile } from "@/app/profile/components/utils/useIsUserConnectedProfile"
import { useParams } from "next/navigation"
type Props = {
  transaction: B3trTransaction
}

const compactFormatter = getCompactFormatter(2)

export const SupportCard = ({ transaction }: Props) => {
  const { t } = useTranslation()
  const { profile: address } = useParams<{ profile: string }>()

  const actionModal = useDisclosure()
  const isConnectedUser = useIsUserConnectedProfile(address)

  return (
    <Card variant={"filledSmall"} w="full" cursor="pointer" onClick={actionModal.onOpen}>
      <CardBody>
        <HStack spacing={3} w="full" justify="space-between">
          <HStack spacing={4}>
            <Flex w={8} h={8} bg="#DDEFFF" align="center" justify="center" borderRadius={"full"}>
              <UilHeart size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack spacing={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text fontSize={"sm"} mr="1">
                  {t("{{value}} supported a", {
                    value: isConnectedUser ? "You" : `${humanAddress(address ?? "", 4, 3)}`,
                  })}
                </Text>
                <Text fontSize={"sm"} fontWeight={600}>
                  {t("proposal")}
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
                {"-"}
                {compactFormatter.format(Number(transaction?.amountVOT3 ?? 0))}
              </Text>
              <Text fontWeight={400} fontSize={"sm"}>
                {"VOT3"}
              </Text>
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
