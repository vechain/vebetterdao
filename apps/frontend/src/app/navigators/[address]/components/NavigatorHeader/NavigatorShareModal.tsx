import { Box, CloseButton, Dialog, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { UilCheckCircle, UilLink } from "@iconscout/react-unicons"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuShare2 } from "react-icons/lu"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ShareButtonsBlue } from "@/components/ShareButtonsBlue"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  displayName: string
}

export const NavigatorShareModal = ({ isOpen, onClose, displayName }: Props) => {
  const { t } = useTranslation()
  const [showCopiedLink, setShowCopiedLink] = useState(false)
  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href)
    setShowCopiedLink(true)
    setTimeout(() => setShowCopiedLink(false), 2000)
  }, [])

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ url: window.location.href })
    } catch {
      // User cancelled — do nothing
    }
  }, [])

  const shareText = `Check out ${displayName} on @VeBetterDAO Navigators!\n\n${typeof window !== "undefined" ? window.location.href : ""}\n\n#VeBetterDAO #VeChain`

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} placement="center" size="xs">
      <CustomModalContent>
        <ModalAnimation>
          <Dialog.CloseTrigger asChild top={4} right={4}>
            <CloseButton />
          </Dialog.CloseTrigger>
          <VStack align="center" p={8} gap={6}>
            <VStack>
              <Heading size="xl" fontWeight="bold" textAlign="center">
                {t("Share this navigator")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("Share on social media and help others discover this navigator")}
              </Text>
            </VStack>

            <HStack gap={4}>
              <ShareButtonsBlue descriptionEncoded={encodeURIComponent(shareText)} />
              {supportsNativeShare && (
                <Box as="button" bg="#E0E9FE" p="13px" borderRadius="full" onClick={handleNativeShare} cursor="pointer">
                  <LuShare2 size={24} color="#004CFC" />
                </Box>
              )}
            </HStack>

            {showCopiedLink ? (
              <HStack color="#6DCB09">
                <UilCheckCircle size="20px" />
                <Text textStyle="lg" fontWeight="semibold">
                  {t("Copied!")}
                </Text>
              </HStack>
            ) : (
              <HStack
                _hover={{ textDecoration: "underline", cursor: "pointer" }}
                color="#004CFC"
                onClick={handleCopyLink}>
                <UilLink size="18px" />
                <Text textStyle="lg" fontWeight={500}>
                  {t("Copy link")}
                </Text>
              </HStack>
            )}
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
