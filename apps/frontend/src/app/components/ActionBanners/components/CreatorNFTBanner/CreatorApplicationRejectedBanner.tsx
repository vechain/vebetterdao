import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, Show, useMediaQuery } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const CreatorApplicationRejectedBanner = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const navigateToCreatorForm = () => {
    return router.push("/apps/creator/new")
  }

  const [isVerySmallMobile] = useMediaQuery("(max-height: 667px)")

  const title = t("CREATOR APPLICATION REJECTED")
  const description = t("Your Creator's NFT application was rejected")
  const doAction = t("Apply again")

  return (
    <Card bg="#FFD979" borderRadius="xl" w="full" h="full">
      <CardBody
        position="relative"
        overflow="hidden"
        alignContent={"center"}
        justifyContent={"center"}
        borderRadius="xl"
        padding={{ base: 4, md: 6 }}>
        <Image
          src="/images/cloud-background-orange.png"
          alt="cloud-background-orange"
          position="absolute"
          right={["-50%", "-50%", "-10%"]}
          top={["-50%", "-50%", "-150%"]}
        />
        <Show above="md">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            <Image
              src="/images/info-bell.png"
              alt="Creator application update"
              w={24}
              h={24}
              transform="rotate(-10deg)"
            />
            <HStack flex={1}>
              <VStack gap={2} align="stretch" flex={1}>
                <Text size="xs" color="#8D6602" fontWeight="600">
                  {title}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color="#5F4400">
                  {description}
                </Heading>
              </VStack>
              <Button
                onClick={navigateToCreatorForm}
                borderRadius="full"
                bg="transparent"
                border="1px solid #5F4400"
                _hover={{
                  bg: "#5F440020",
                }}>
                <Text color="#5F4400" fontWeight="500">
                  {doAction}
                </Text>
              </Button>
            </HStack>
          </HStack>
        </Show>
        <Show below="md">
          <HStack align="center" zIndex={1} position="relative" w="full" alignItems={"center"}>
            <VStack gap={2} align="stretch" justify={"space-between"}>
              <Text fontSize={12} color="#8D6602" fontWeight="600">
                {title}
              </Text>
              <Heading fontSize="18" fontWeight="700" color="#5F4400">
                {description}
              </Heading>
              <Button
                onClick={navigateToCreatorForm}
                borderRadius="full"
                bg="transparent"
                border="1px solid #5F4400"
                _hover={{
                  bg: "#5F440020",
                }}>
                <Text color="#5F4400" fontWeight="500">
                  {doAction}
                </Text>
              </Button>
            </VStack>
            <Image
              src="/images/info-bell.png"
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
