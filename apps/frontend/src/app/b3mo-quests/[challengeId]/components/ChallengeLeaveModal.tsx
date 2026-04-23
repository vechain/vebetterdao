import { Button, CloseButton, Dialog, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  onLeave: () => void
}

export const ChallengeLeaveModal = ({ isOpen, onClose, onLeave }: Props) => {
  const { t } = useTranslation()

  const handleLeave = () => {
    onClose()
    onLeave()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} placement="center" size="xs">
      <CustomModalContent>
        <ModalAnimation>
          <Dialog.CloseTrigger asChild top={4} right={4}>
            <CloseButton />
          </Dialog.CloseTrigger>
          <VStack align="center" p={8} gap={6}>
            <Image src="/assets/mascot/mascot-warning-head.webp" alt="B3MO" boxSize="200px" objectFit="contain" />

            <VStack gap={1}>
              <Heading size="xl" fontWeight="bold" textAlign="center">
                {t("Leave B3MO quest")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("Leave this B3MO quest before it starts. Your bet will be returned and your spot freed up.")}
              </Text>
            </VStack>

            <Button variant="outline" colorPalette="red" w="full" size="lg" onClick={handleLeave}>
              {t("Leave B3MO quest")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
