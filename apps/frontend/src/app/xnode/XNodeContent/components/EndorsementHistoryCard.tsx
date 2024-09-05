import { notFoundImage } from "@/constants"
import { Card, CardBody, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

export const EndorsementHistoryCard = () => {
  const { t } = useTranslation()

  const appImage = notFoundImage
  const appName = "Cleanify"
  const eventDate = dayjs().subtract(4, "hours")

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <Heading fontSize="xl" fontWeight="700">
            {t("Endorsement history")}
          </Heading>
          <HStack>
            <Image src={appImage} alt="endorsed-app" w="12" h="12" rounded="xl" />
            <VStack align="stretch" gap={0}>
              <HStack gap={1} fontSize={["sm", "sm", "md"]}>
                <Text>{t("You endorsed")} </Text>
                <Text fontWeight="600">{appName}</Text>
              </HStack>
              <Text fontSize={["2xs", "2xs", "sm"]} color="#6A6A6A">
                {dayjs(eventDate).fromNow()}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
