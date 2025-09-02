import { Box, Button, Image, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { CommunityModal } from "./CommunityModal"
import { useCallback } from "react"
import { AnalyticsUtils } from "@/utils"
import { buttonClickActions, ButtonClickProperties, buttonClicked } from "@/constants"

export const JoinCommunity = () => {
  const { t } = useTranslation()

  const { open: isOpen, onClose, onOpen } = useDisclosure()

  const onJoinClick = useCallback(() => {
    onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_COMMUNITY))
  }, [onOpen])

  return (
    <>
      <Box bgColor={"#B1F16C"} p={6} w={"full"} borderRadius={16} position={"relative"} overflow={"clip"}>
        <Image
          src="/assets/backgrounds/community-green-blob.webp"
          alt="VeBetterDAO community"
          position={"absolute"}
          rotate="-90deg"
          top={-48}
          right={-32}
          boxSize={"400px"}
        />
        <VStack alignItems={"flex-start"}>
          <Image src="/assets/icons/handshake.svg" alt="Join Community" w={32} h={32} />
          <Text textStyle="md" fontWeight="semibold" color={"#1E1E1E"}>
            {t("Seeking Guidance or Advice?")}
          </Text>
          <Text textStyle="3xl" fontWeight="bold" color={"#1E1E1E"}>
            {t("Join Our Community!")}
          </Text>
          <Button variant="primaryAction" onClick={onJoinClick} mt={4}>
            {t("Join")}
          </Button>
        </VStack>
      </Box>

      <CommunityModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
