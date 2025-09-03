import { Card, Heading, HStack, Image, Text, VStack, Link } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { GoPlus } from "react-icons/go"
import { useBreakpoints } from "@/hooks"

export const JoinB3TRAppsBanner = () => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  return (
    <Card.Root w={"full"} bg="banner.green" color="black" overflow={"hidden"} borderRadius={"12px"} p={6}>
      <HStack justifyContent={{ base: "center", lg: "space-between" }} w="full">
        <VStack alignItems={"flex-start"} w={{ base: "full", md: "50%" }} gap={4}>
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
          <Heading size="2xl" color="text.strong">
            {t("Do you have a dApp to join the VeBetter DAO ecosystem?")}
          </Heading>
          <Text textStyle="sm">
            {t(
              "Do you have a sustainable application and want to become part of our ecosystem? Learn how to get started through our Grant Program. Join our Discord channel and introduce yourself and your app!",
            )}
          </Text>
          <Link
            href="https://vebetterdao.org/grants"
            target="_blank"
            rel="noopener noreferrer"
            rounded="full"
            bg="brand.secondary"
            color="brand.secondary-stronger"
            px={8}
            py={4}>
            <GoPlus />
            <Text textStyle="md" color="inherit">
              {t("Apply now")}
            </Text>
          </Link>
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
