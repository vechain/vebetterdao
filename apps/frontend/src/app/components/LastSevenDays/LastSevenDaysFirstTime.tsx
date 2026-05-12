import { Box, Button, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { FaArrowRight } from "react-icons/fa6"

export const LastSevenDaysFirstTime = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <VStack gap={4} align="center" textAlign="center" py={2}>
      <Box position="relative" w="110px" h="110px">
        <Box
          position="absolute"
          inset="-8px"
          borderRadius="full"
          bg="radial-gradient(circle at center, var(--vbd-colors-brand-secondary-subtle) 0%, transparent 65%)"
          opacity={0.7}
        />
        <Image
          position="relative"
          src="/assets/mascot/b3mo-referee.png"
          alt="B3MO"
          boxSize="110px"
          objectFit="contain"
        />
      </Box>

      <VStack gap={2} maxW="290px">
        <Heading size="md" fontWeight="bold">
          {t("Welcome — let's earn your first B3TR")}
        </Heading>
        <Text textStyle="sm" color="text.subtle">
          {t(
            "Every Better Action you take through an app earns you B3TR tokens. Pick one below and start in under a minute.",
          )}
        </Text>
      </VStack>

      <Button rounded="full" variant="primary" onClick={() => router.push("/apps")}>
        {t("Start your first action")}
        <FaArrowRight />
      </Button>
    </VStack>
  )
}
