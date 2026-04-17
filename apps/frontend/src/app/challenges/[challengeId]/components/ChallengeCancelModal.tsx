import { Button, CloseButton, Dialog, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  onCancel: () => void
}

export const ChallengeCancelModal = ({ isOpen, onClose, onCancel }: Props) => {
  const { t } = useTranslation()

  const handleCancel = () => {
    onClose()
    onCancel()
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
                {t("Cancel quest")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("Cancel the quest before it starts. All participants will be able to claim back their bets.")}
              </Text>
            </VStack>

            <Button variant="outline" colorPalette="red" w="full" size="lg" onClick={handleCancel}>
              {t("Cancel quest")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
