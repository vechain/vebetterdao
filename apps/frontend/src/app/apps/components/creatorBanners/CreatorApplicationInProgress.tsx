import { Card, CardBody, Heading, Image, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplicationInProgress = () => {
  const { t } = useTranslation()

  return (
    <Card
      variant={"baseWithBorder"}
      w="full"
      maxW="100%"
      style={{
        backgroundColor: "#CEDCFD",
        borderRadius: "20px",
        border: "2px solid #E0E9FE",
      }}>
      <CardBody px={{ base: 5, md: 5 }} py={{ base: 5, md: 5 }}>
        <Stack direction={{ base: "column", md: "row" }} w="full" h="full">
          {/* Left Section: Image, Title, and Description */}
          <Stack direction="row" spacing={{ base: 2, md: 2, lg: 4 }} align="center">
            <Image
              src={"images/creator-nft.png"}
              alt="logo"
              maxH="100px"
              maxW="100px"
              minW="90px"
              minH="90px"
              borderRadius="9px"
            />

            <Stack w={{ base: "full", md: "90%", lg: "80%" }} align="flex-start" justify="center">
              <Heading fontWeight={700} fontSize="18px">
                {t("We're reviewing your Creator's NFT application form")}
              </Heading>
              <Text fontSize="15px" color="#6A6A6A" fontWeight={400}>
                {t(
                  "If it’s approved you’ll receive a Creator’s NFT and you’ll be able to submit your app to VeBetterDAO!",
                )}
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}
