import { B3trTransaction } from "@/api"
import { Card, CardBody, Flex, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilGlobe } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { ActionModal } from "./BetterActionCard"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
type Props = {
  transaction: B3trTransaction
}

const compactFormatter = getCompactFormatter(2)

export const UpgradeGMCard = ({ transaction }: Props) => {
  const { t } = useTranslation()

  const actionModal = useDisclosure()
  const { isConnectedUser } = useRetrieveProfilIdentity()

  return (
    <Card variant={"filledSmall"} w="full" cursor="pointer" onClick={actionModal.onOpen}>
      <CardBody>
        <HStack spacing={3} w="full" justify="space-between">
          <HStack spacing={4}>
            <Flex
              w="fit-content"
              h="fit-content"
              p={2}
              bg="#DDEFFF"
              align="center"
              justify="center"
              borderRadius={"full"}>
              <UilGlobe size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack spacing={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text fontSize={"sm"} mr="1">
<<<<<<< HEAD
                  {isConnectedUser ? t("You upgraded a") : t("Upgraded a")}
=======
                  {t("{{value}} upgraded a", {
                    value: isConnectedUser ? "You" : !!domain ? domain : humanAddress(profile ?? "", 6, 3),
                  })}
>>>>>>> b4cfea76 (fix: changing condition (??) to (!!))
                </Text>
                <Text fontSize={"sm"} fontWeight={600}>
                  {t("GM NFT")}
                </Text>
              </HStack>
              <Text fontSize={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                {dayjs.unix(transaction?.blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <VStack spacing={0} align="stretch">
            <HStack spacing={2}>
              <Text fontWeight={600}>{compactFormatter.format(Number(transaction?.amountB3TR ?? 0))}</Text>
              <Text fontWeight={400} fontSize={"sm"}>
                {"B3TR"}
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
