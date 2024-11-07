import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, Show, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplicationApproved = () => {
  const { t } = useTranslation()

  const [isVerySmallMobile] = useMediaQuery("(max-height: 667px)")

  const title = t("CREATOR'S NFT RECEIVED")
  const description = t("Your Creator application was approved. Submit your app!")
  const doAction = t("Submit app")

  return (
    <Card bg="#C8DDFF" borderRadius="xl" w="full">
      <CardBody position="relative" overflow="hidden" borderRadius="xl" padding={{ base: 4, md: 6 }}>
        <Image
          src="/images/cloud-background.png"
          alt="cloud-background"
          position="absolute"
          right={["-50%", "-50%", "-10%"]}
          top={["-50%", "-50%", "-150%"]}
        />
        <Show above="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            <Image src="/images/creator-nft.png" alt="Creator application update" w={24} h={24} />
            <HStack flex={1}>
              <VStack gap={2} align="stretch" flex={1}>
                <Text size="xs" color="#3A5798" fontWeight="600">
                  {title}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#0C2D75">
                  {description}
                </Heading>
              </VStack>
              <Button
                // onClick={doActionModal.onOpen}
                variant="primaryAction"
                borderRadius="full">
                <Text fontWeight="500">{doAction}</Text>
              </Button>
            </HStack>
          </HStack>
        </Show>
        <Show below="md">
          <HStack align="center" zIndex={1} position="relative" w="full" alignItems={"center"}>
            <VStack gap={2} align="stretch" justify={"space-between"}>
              <Text fontSize={12} color="#3A5798" fontWeight="600">
                {title}
              </Text>
              <Heading fontSize="18" fontWeight="700" color="#0C2D75">
                {description}
              </Heading>
              <Button
                // onClick={doActionModal.onOpen}
                variant="primaryAction"
                borderRadius="full">
                <Text fontWeight="500">{doAction}</Text>
              </Button>
            </VStack>
            <Image
              src="/images/creator-nft.png"
              alt="Creator application update"
              w={isVerySmallMobile ? 16 : 24}
              h={isVerySmallMobile ? 16 : 24}
            />
          </HStack>
        </Show>
      </CardBody>
    </Card>
  )
}
