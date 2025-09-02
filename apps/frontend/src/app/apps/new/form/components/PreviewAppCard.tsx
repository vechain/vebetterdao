import { notFoundImage } from "@/constants"
import { Box, Card, HStack, Image, VStack, Text, Icon } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { UilArrowUpRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

type Props = {
  name?: string
  appId?: string
  logo?: string
  banner?: string
}

export const PreviewAppCard = ({ logo, banner, name, appId }: Props) => {
  const router = useRouter()
  const { t } = useTranslation()

  const navigateToAppDetail = () => {
    if (appId && appId !== "") router.push(`/apps/${appId}`)
    else router.push(`/apps`)
  }

  return (
    <Card.Root variant={"base"} w={["70%", "60%"]} alignSelf={"center"} onClick={navigateToAppDetail}>
      <Box w="full" position={"relative"} h={[70, 150]}>
        <Image alt={`Banner for ${name}`} w="full" src={banner} h={"full"} objectFit={"cover"} borderTopRadius={"md"} />
        <Image
          src={logo ?? notFoundImage}
          alt={"logo"}
          boxSize={[8, 14]}
          borderRadius="9px"
          alignContent={"start"}
          pos={"absolute"}
          bottom={-7}
          left={5}
        />
      </Box>
      <Card.Body mt={5} px={[4, 6]}>
        <VStack w={"full"}>
          <HStack w={"full"} justifyContent={"space-between"} px={[1, 4]} pt={[1, 4]}>
            <Text fontWeight="bold" textStyle={["xxs", "xl"]}>
              {name ?? "Error loading name"}
            </Text>

            <Icon
              as={UilArrowUpRight}
              bg={"rgba(224, 233, 254, 1)"}
              borderRadius={"full"}
              color="logo"
              boxSize={[6, 8]}
              p={1}
            />
          </HStack>
          <HStack
            w={"full"}
            px={[2, 6]}
            py={[1, 4]}
            bg={"rgba(248, 248, 248, 1)"}
            borderRadius={16}
            mt={6}
            justifyContent={"space-between"}>
            <VStack alignItems={"flex-start"}>
              <Text textStyle={["xxs", "sm"]}>{t("Endorsement score")}</Text>
              <HStack alignItems={"flex-end"}>
                <Text color="brand.primary" textStyle={["xs", "xl"]} fontWeight="bold">
                  {"0"}
                </Text>
                <Text textStyle="xs">{"/ 100"}</Text>
              </HStack>
            </VStack>
            <VStack alignItems={"flex-start"}>
              <Text textStyle={["xxs", "sm"]}>{t("Member since")}</Text>
              <HStack alignItems={"flex-end"}>
                <Text color={"#1E1E1E"} textStyle={["xs", "xl"]} fontWeight="semibold">
                  {t("today")}
                  {" ✨"}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
