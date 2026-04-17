import { Button, CloseButton, Dialog, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  onDecline: () => void
}

export const ChallengeDeclineModal = ({ isOpen, onClose, onDecline }: Props) => {
  const { t } = useTranslation()

  const handleDecline = () => {
    onClose()
    onDecline()
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
                {t("Decline invitation")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("Once declined, to join the quest again, the creator will need to invite you again.")}
              </Text>
            </VStack>

            <Button variant="outline" colorPalette="red" w="full" size="lg" onClick={handleDecline}>
              {t("Decline")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
