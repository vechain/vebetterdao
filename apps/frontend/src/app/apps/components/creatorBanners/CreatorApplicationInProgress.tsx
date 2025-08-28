import { Box, Card, Heading, Image, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplicationInProgress = () => {
  const { t } = useTranslation()

  return (
    <Card.Root
      variant={"baseWithBorder"}
      w="full"
      maxW="100%"
      h={"full"}
      style={{
        backgroundColor: "#CEDCFD",
        borderRadius: "20px",
        border: "2px solid #E0E9FE",
      }}>
      <Card.Body h={"full"} p={0}>
        <Stack direction={{ base: "column", md: "row" }} w="full" h="full">
          {/* Left Section: Image, Title, and Description */}
          <Stack direction="row" h={"full"} align="center">
            <Box w={"120px"} h={"full"} overflow="hidden" position="relative" borderRadius="9px">
              <Image
                src="/assets/mascot/mascot-welcoming.webp"
                alt="mascot-welcoming"
                position="absolute"
                top="30%"
                left="-10%"
                transform={"rotate(30deg) scale(1.8)"}
                objectFit="contain"
                borderRadius="9px"
              />
            </Box>

            <Stack
              w={{ base: "full", md: "90%", lg: "80%" }}
              px={{ base: 5, md: 5 }}
              py={{ base: 5, md: 5 }}
              align="flex-start"
              justify="center">
              <Heading size="lg">{t("We're reviewing your Creator's NFT application form")}</Heading>
              <Text fontSize="15px" color="#6A6A6A" fontWeight={400}>
                {t(
                  "If it’s approved you’ll receive a Creator’s NFT and you’ll be able to submit your app to VeBetterDAO!",
                )}
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
