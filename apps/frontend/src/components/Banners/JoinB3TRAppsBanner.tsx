import { Card, Button, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaPlus } from "react-icons/fa"
import { useBreakpoints } from "@/hooks"

export const JoinB3TRAppsBanner = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  // TODO : change that once the endorsement will be complete
  const openGrantPage = () => {
    window.open("https://vechain.org/grants/", "_blank", "noopener noreferrer")
  }

  return (
    <Card
      w={"full"}
      bg="#B1F16C"
      color="black"
      overflow={"hidden"}
      borderRadius={"12px"}
      bgImage="url('/images/community-green-blob.png')"
      bgPosition="center"
      bgSize="full">
      <HStack justifyContent={{ base: "center", lg: "space-between" }} w="full">
        <VStack
          alignItems={"flex-start"}
          py={{ base: "50px", md: "70px" }}
          px={{ base: "20px", md: "70px" }}
          w={{ base: "full", md: "50%" }}>
          {isMobile && (
            <Image
              src="/images/mascot/mascot-welcoming-left-head.png"
              alt="mascot-welcoming-head"
              width="100%"
              boxSize="100px"
              objectFit="cover"
              objectPosition="top"
            />
          )}
          <Heading fontSize="2xl" fontWeight="bold" color="#252525">
            {t("Do you have a dApp to join the VeBetter DAO ecosystem?")}
          </Heading>
          <Text color="#252525">
            {t(
              "Do you have a sustainable application and want to become part of our ecosystem? Join our discord channel and introduce yourself and your app!",
            )}
          </Text>
          <Button variant="applyButton" onClick={openGrantPage} leftIcon={<FaPlus />}>
            {t("Apply now")}
          </Button>
        </VStack>
        {!isMobile && (
          <Image
            alignSelf={"flex-end"}
            src="/images/mascot/mascot-welcoming.png"
            alt="mascot-welcoming"
            boxSize="200px"
            overflow={"hidden"}
            objectFit="contain"
            transform="rotate(-15deg) scale(2.3) translateY(15px) translateX(10px)"
          />
        )}
      </HStack>
    </Card>
  )
}
