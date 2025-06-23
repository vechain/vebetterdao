import { Box, Button, HStack, Image, Link, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { buttonClickActions, buttonClicked, ButtonClickProperties, DISCORD_URL } from "@/constants"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

export const ConnectWithCreators = () => {
  const { t } = useTranslation()

  const onJoinClick = useCallback(() => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_DISCORD))
  }, [])

  return (
    <Box bgColor={"#B1F16C"} p={6} w={"full"} borderRadius={16} position={"relative"} overflow={"clip"}>
      <Image
        src="/assets/backgrounds/community-green-blob.webp"
        alt="VeBetterDAO community"
        position={"absolute"}
        transform={"rotate(-90deg)"}
        top={-48}
        right={-32}
        boxSize={"400px"}
      />
      <VStack alignItems={"flex-start"} zIndex={0} position={"relative"}>
        <HStack>
          <Image src="/assets/icons/handshake.svg" alt="Join Community" w={32} h={32} />
          <Text>{t("Connect with app creators to know more about their apps and endorse them.")}</Text>
        </HStack>
        <Link href={DISCORD_URL} isExternal w={"full"} onClick={onJoinClick}>
          <Button w={"full"} variant={"primaryAction"}>
            {t("Connect with Creators")}
          </Button>
        </Link>
      </VStack>
    </Box>
  )
}
