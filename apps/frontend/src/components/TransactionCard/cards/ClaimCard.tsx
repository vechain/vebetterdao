import { Card, CardBody, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { UilGift } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

type Props = {
  data: {
    amount: string
    blockTimestamp: number
  }
}

export const ClaimCard = ({ data }: Props) => {
  const { t } = useTranslation()
  return (
    <Card variant={"filledSmall"} w="full" cursor="pointer">
      <CardBody>
        <HStack spacing={3} w="full" justify="space-between">
          <HStack spacing={4}>
            <Flex w={8} h={8} bg="#DDEFFF" align="center" justify="center" borderRadius={"full"}>
              <UilGift size={"1rem"} color="#004CFC" />
            </Flex>
            <VStack spacing={0} align="stretch">
              <HStack gap={0} flexWrap={"wrap"}>
                <Text fontSize={"sm"} mr="1">
                  {t("You claimed")}
                </Text>
                <Text fontSize={"sm"} fontWeight={600}>
                  {t("voting rewards")}
                </Text>
              </HStack>
              <Text fontSize={"xs"} fontWeight={"400"} color={"#6A6A6A"}>
                {dayjs.unix(data?.blockTimestamp ?? 0).fromNow()}
              </Text>
            </VStack>
          </HStack>
          <VStack spacing={0} align="stretch">
            <HStack spacing={2}>
              <Text fontWeight={600}>
                {"+"}
                {data.amount}
              </Text>
              <Text fontWeight={400} fontSize={"sm"}>
                {"B3TR"}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  )
}
