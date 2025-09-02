import { Card, Button, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa"
import { useBreakpoints } from "@/hooks"

export const JoinB3TRAppsBanner = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  const openGrantPage = () => {
    window.open("https://vebetterdao.org/grants", "_blank", "noopener noreferrer")
  }

  return (
    <Card.Root
      w={"full"}
      bg="#B1F16C"
      color="black"
      overflow={"hidden"}
      borderRadius={"12px"}
      bgImage="url('/assets/backgrounds/community-green-blob.webp')"
      backgroundPosition="center"
      bgSize="full">
      <HStack justifyContent={{ base: "center", lg: "space-between" }} w="full">
        <VStack
          alignItems={"flex-start"}
          py={{ base: "50px", md: "70px" }}
          px={{ base: "20px", md: "70px" }}
          w={{ base: "full", md: "50%" }}>
          {isMobile && (
            <Image
              src="/assets/mascot/mascot-welcoming-left-head.webp"
              alt="mascot-welcoming-head"
              width="100%"
              boxSize="100px"
              objectFit="cover"
              objectPosition="top"
            />
          )}
          <Heading size="2xl">{t("Do you have a dApp to join the VeBetter DAO ecosystem?")}</Heading>
          <Text>
            {t(
              "Do you have a sustainable application and want to become part of our ecosystem? Learn how to get started through our Grant Program. Join our Discord channel and introduce yourself and your app!",
            )}
          </Text>
          <Button variant="applyButton" bg="brand.secondary" onClick={openGrantPage}>
            <FaPlus />
            {t("Apply now")}
          </Button>
        </VStack>
        {!isMobile && (
          <Image
            alignSelf={"flex-end"}
            src="/assets/mascot/mascot-welcoming.webp"
            alt="mascot-welcoming"
            boxSize="200px"
            overflow={"hidden"}
            objectFit="contain"
            transform="rotate(-15deg) scale(2.3) translateY(15px) translateX(10px)"
          />
        )}
      </HStack>
    </Card.Root>
  )
}
