import { Button, CloseButton, Dialog, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export const ChallengeCompleteModal = ({ isOpen, onClose, onComplete }: Props) => {
  const { t } = useTranslation()

  const handleComplete = () => {
    onClose()
    onComplete()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} placement="center" size="xs">
      <CustomModalContent>
        <ModalAnimation>
          <Dialog.CloseTrigger asChild top={4} right={4}>
            <CloseButton />
          </Dialog.CloseTrigger>
          <VStack align="center" p={8} gap={6}>
            <Image src="/assets/mascot/B3MO_Tokens_3.png" alt="B3MO" boxSize="200px" objectFit="contain" />

            <VStack gap={1}>
              <Heading size="xl" fontWeight="bold" textAlign="center">
                {t("Complete quest")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("Complete this quest to lock in the results and let winners claim their prize.")}
              </Text>
            </VStack>

            <Button variant="primary" w="full" size="lg" onClick={handleComplete}>
              {t("Complete")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
