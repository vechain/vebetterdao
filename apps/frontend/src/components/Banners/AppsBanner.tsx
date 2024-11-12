import { Card, Text, Heading, Container, Image, VStack, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppsBanner = () => {
  const { t } = useTranslation()
  return (
    <Card
      w={"full"}
      bg="#004CFC"
      // position={"absolute"}
      // top="0"
      // left="0"
      color="white"
      overflow={"hidden"}
      borderRadius={"0px"}
      bgImage="url('/images/cloud-background.png')"
      bgSize="cover"
      alignItems={"center"}>
      <Container alignItems={"space-between"} maxW={"container.xl"} flex={1}>
        <HStack justifyContent={"space-between"}>
          <VStack alignItems={"flex-start"}>
            <Heading fontSize="2xl" fontWeight="bold">
              {t("Explore apps")}
            </Heading>
            <Text>{t("Browse and discover dApps where you can earn tokens for sustainable actions")}</Text>
          </VStack>
          <Image
            alignSelf={"flex-end"}
            src="/images/mascote/mascote-with-phone.svg"
            alt="mascote-with-phone"
            boxSize="200px"
            objectFit="contain"
          />
        </HStack>
      </Container>
    </Card>
  )
}
