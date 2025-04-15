import { Box, Card, CardBody, Heading, HStack, Image, Stack, Text, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const CreatorApplicationAlreadySubmitted = () => {
  const { t } = useTranslation()
  const isMobile = useBreakpointValue({ base: true, md: false, lg: false })

  return (
    <Card
      variant={"baseWithBorder"}
      w="full"
      h="full"
      maxW="100%"
      style={{
        backgroundColor: "#CEDCFD",
        borderRadius: "20px",
      }}>
      <CardBody p={0}>
        <HStack w="full" h="full">
          {/* Left Section: Image full height when mobile */}
          <Box w={isMobile ? "150px" : "300px"} h={"full"} overflow="hidden" position="relative" borderRadius="9px">
            <Image
              src="/images/mascot/mascot-holding-tokens.png"
              alt="mascot-holding-tokens"
              position="absolute"
              bottom={{ base: 2, md: 15, lg: 0, top: 0 }}
              left="0"
              transform={{ base: "scale(1.8)", md: "scale(1.5)", lg: "scale(1.3)" }}
              objectFit="contain"
              borderRadius="9px"
            />
          </Box>

          <Stack direction={{ base: "column" }} w="full" h="full" align={"center"} justify={"center"} py={4}>
            {/* Right Section: Image, Title, and Description */}
            <Stack align={"center"} justify={"center"}>
              <Heading fontWeight={700} fontSize={"15px"}>
                {t("You have already submitted your app.")}
              </Heading>
              <Text fontSize={"14px"} color="#6A6A6A" fontWeight={400}>
                {t("Thank you for joining VeBetterDao!")}
              </Text>
            </Stack>
          </Stack>
        </HStack>
      </CardBody>
    </Card>
  )
}
