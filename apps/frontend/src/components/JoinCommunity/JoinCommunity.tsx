import { Box, Button, Image, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { CommunityModal } from "./CommunityModal"
import { useCallback } from "react"

export const JoinCommunity = () => {
  const { t } = useTranslation()

  const { isOpen, onClose, onOpen } = useDisclosure()

  const onJoinClick = useCallback(() => {
    onOpen()
  }, [onOpen])

  return (
    <>
      <Box bgColor={"#B1F16C"} p={6} w={"full"} borderRadius={16} position={"relative"} overflow={"clip"}>
        <Image
          src="/images/community-green-blob.png"
          alt="VeBetterDAO community"
          position={"absolute"}
          transform={"rotate(-90deg)"}
          top={-48}
          right={-32}
          boxSize={"400px"}
        />
        <VStack alignItems={"flex-start"}>
          <Image src="/images/handshake.svg" alt="Join Community" w={32} h={32} />
          <Text fontSize={15} fontWeight={600}>
            {t("Seeking Guidance or Advice?")}
          </Text>
          <Text fontSize={28} fontWeight={700}>
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
