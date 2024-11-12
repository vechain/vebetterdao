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
      <HStack justifyContent={"space-between"}>
        <VStack alignItems={"flex-start"} my={"50px"} mx={"70px"} w={"50%"}>
          {isMobile && (
            // TODO: double check if only robot's head is display
            <Image
              src="/images/mascote/mascote-welcoming-left-head.png"
              alt="mascote-welcoming-head"
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
            src="/images/mascote/mascote-welcoming.png"
            alt="mascote-welcoming"
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
