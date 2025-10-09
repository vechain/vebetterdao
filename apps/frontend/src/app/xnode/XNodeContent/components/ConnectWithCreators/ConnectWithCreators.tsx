import { Box, Button, HStack, Image, Link, Text, VStack, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { buttonClickActions, buttonClicked, ButtonClickProperties, DISCORD_URL } from "@/constants"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import HandshakeIcon from "@/components/Icons/svg/handshake.svg"

export const ConnectWithCreators = () => {
  const { t } = useTranslation()

  const onJoinClick = useCallback(() => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_DISCORD))
  }, [])

  return (
    <Box bgColor={"#B1F16C"} p={6} w={"full"} borderRadius={16} position={"relative"} overflow={"clip"}>
      <Image
        src="/assets/backgrounds/community-green-blob.webp"
        alt="VeBetter community"
        position={"absolute"}
        transform={"rotate(-90deg)"}
        top={-48}
        right={-32}
        boxSize={"400px"}
      />
      <VStack alignItems={"flex-start"} zIndex={0} position={"relative"}>
        <HStack>
          <Icon as={HandshakeIcon} boxSize={32} color="brand.primary" />
          <Text color={"contrast-fg-on-strong"}>
            {t("Connect with app creators to know more about their apps and endorse them.")}
          </Text>
        </HStack>
        <Link href={DISCORD_URL} target="_blank" rel="noopener noreferrer" w={"full"} onClick={onJoinClick}>
          <Button w={"full"} variant={"primary"}>
            {t("Connect with Creators")}
          </Button>
        </Link>
      </VStack>
    </Box>
  )
}
