import { Button, Card, Heading, Image, Stack, Text, Box, HStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const CreatorApplicationApproved = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const goToAppCreation = () => {
    router.push("/apps/new")
  }

  return (
    <Card.Root
      variant={"baseWithBorder"}
      w="full"
      h="full"
      maxW="100%"
      style={{
        backgroundColor: "#CEDCFD",
        borderRadius: "20px",
      }}>
      <Card.Body p={0}>
        <HStack w="full" h="full">
          {/* Left Section: Image full height when mobile */}
          <Box w={"150px"} h={"full"} overflow="hidden" position="relative" borderRadius="9px">
            <Image
              src="/assets/mascot/mascot-holding-tokens.webp"
              alt="mascot-holding-tokens"
              position="absolute"
              bottom={{ base: 5, md: 5, lg: 0 }}
              left="0"
              transform={{ base: "scale(1.8)", md: "scale(1.5)", lg: "scale(1.3)" }}
              objectFit="contain"
              borderRadius="9px"
            />
          </Box>

          <Stack direction={{ base: "column" }} w="full" h="full" align={"center"} justify={"center"} py={4}>
            {/* Right Section: Image, Title, and Description */}
            <Stack align={"center"} justify={"center"}>
              <Heading size={"sm"}>{t("Your Creator's NFT application was approved")}</Heading>
              <Text textStyle={"sm"} color="text.subtle">
                {t("You can now submit your app to the VeBetterDAO ecosystem")}
              </Text>
            </Stack>
            <Button textStyle="sm" variant="primary" borderRadius="full" onClick={goToAppCreation}>
              {t("Submit app")}
            </Button>
          </Stack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
