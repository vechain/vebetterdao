import { Button, Card, CardBody, Heading, Image, Stack, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const CreatorApplicationApproved = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const goToAppCreation = () => {
    router.push("/apps/new")
  }

  return (
    <Card
      variant={"baseWithBorder"}
      w="full"
      maxW="100%"
      style={{
        backgroundColor: "#CEDCFD",
        borderRadius: "20px",
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
              <Heading fontWeight={700} fontSize={{ base: "15px", md: "15px" }}>
                {t("Your Creator's NFT application was approved")}
              </Heading>
              <Text fontSize={{ base: "14px", md: "14px" }} color="#6A6A6A" fontWeight={400}>
                {t("You can now submit your app to the VeBetterDAO ecosystem")}
              </Text>
            </Stack>
          </Stack>

          {/* Right Section: Score */}
          <Stack direction="row" align="center" justify="center" w={{ base: "100%", md: "30%" }} alignSelf="center">
            <Button
              alignSelf="center"
              fontSize={{ base: "14px" }}
              variant="primaryAction"
              borderRadius="full"
              maxW="150px"
              px={{ base: 2, md: 5 }}
              onClick={goToAppCreation}
              w={{ base: "full", md: "auto" }}>
              {t("Submit app")}
            </Button>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  )
}
