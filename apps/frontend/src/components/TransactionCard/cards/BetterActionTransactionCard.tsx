import { Card, CardBody, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { B3trTransaction } from "@/api"
import dayjs from "dayjs"
import { LeafIcon } from "../../Icons/LeafIcon"
import { useTranslation } from "react-i18next"

type Props = {
  transaction: B3trTransaction
}
export const BetterActionTransactionCard = ({ transaction }: Props) => {
  const { t } = useTranslation()

  return (
    <Card variant={"filledSmall"} w="full" cursor="pointer">
      <CardBody>
        <HStack spacing={3} w="full" justify="space-between">
          <HStack spacing={4}>
            <Flex w={8} h={8} bg="#CDFF9F" align="center" justify="center" borderRadius={"full"}>
              <LeafIcon size={"1rem"} />
            </Flex>
            <VStack spacing={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text fontSize={"sm"} mr="1">
                  {t("Better action")}
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
              {transaction.amountB3TR}
            </Text>
            <Text fontWeight={400} fontSize={"sm"}>
              {"B3TR"}
            </Text>
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  )
}
