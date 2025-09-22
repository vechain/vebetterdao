import { Box, Button, Icon, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { CommunityModal } from "./CommunityModal"
import { useCallback } from "react"
import { AnalyticsUtils } from "@/utils"
import { buttonClickActions, ButtonClickProperties, buttonClicked } from "@/constants"

import HandshakeIcon from "@/components/Icons/svg/handshake.svg"

export const JoinCommunity = () => {
  const { t } = useTranslation()

  const { open: isOpen, onClose, onOpen } = useDisclosure()

  const onJoinClick = useCallback(() => {
    onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_COMMUNITY))
  }, [onOpen])

  return (
    <>
      <Box bgColor="banner.green" p={6} w={"full"} borderRadius={16} position={"relative"} overflow={"clip"}>
        <VStack alignItems={"flex-start"}>
          <Icon boxSize={32} as={HandshakeIcon} color="actions.tertiary.default" />
          <Text textStyle="md" fontWeight="semibold">
            {t("Seeking Guidance or Advice?")}
          </Text>
          <Text textStyle="3xl" fontWeight="bold">
            {t("Join Our Community!")}
          </Text>
          <Button variant="primary" onClick={onJoinClick} mt={4}>
            {t("Join")}
          </Button>
        </VStack>
      </Box>

      <CommunityModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
