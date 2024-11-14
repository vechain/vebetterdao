import { Card, CardBody, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplicationInProgress = () => {
  const { t } = useTranslation()

  return (
    <Card
      variant="baseWithBorder"
      w="full"
      h="full"
      style={{
        backgroundColor: "#E0E9FE",
        borderColor: "#CEDCFD",
        borderRadius: "20px",
      }}>
      <CardBody p={0}>
        <HStack w="full">
          <Image src="/images/info-bell.png" alt="VeBetterDAO Action" />
          <VStack w="full" alignItems="flex-start" flex={1} spacing={4} py="16px" pr="24px">
            <Heading fontSize="lg" fontWeight="700" color="#252525">
              {t("We're reviewing your Creator's NFT application form")}
            </Heading>
            <Text fontSize={14} fontWeight="400" color="#6A6A6A">
              {t(
                "If it's approved you'll receive a Creator's NFT and you'll be able to submit your app to VeBetterDAO!",
              )}
            </Text>
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  )
}
