import { Button, CloseButton, Dialog, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  stakeLabel: string
  onAccept: () => void
}

export const ChallengeAcceptModal = ({ isOpen, onClose, stakeLabel, onAccept }: Props) => {
  const { t } = useTranslation()

  const handleAccept = () => {
    onClose()
    onAccept()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} placement="center" size="xs">
      <CustomModalContent>
        <ModalAnimation>
          <Dialog.CloseTrigger asChild top={4} right={4}>
            <CloseButton />
          </Dialog.CloseTrigger>
          <VStack align="center" p={8} gap={6}>
            <Image src="/assets/mascot/mascot-holding-tokens.webp" alt="B3MO" boxSize="200px" objectFit="contain" />

            <VStack gap={1}>
              <Heading size="xl" fontWeight="bold" textAlign="center">
                {t("Accept invitation")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("Confirm to join this quest. Your bet will be locked in the prize pool until the quest ends.")}
              </Text>
            </VStack>

            <Heading size="3xl" fontWeight="bold" textAlign="center" color="text.primary">
              {stakeLabel}
            </Heading>

            <Button variant="primary" w="full" size="lg" onClick={handleAccept}>
              {t("Accept and bet")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
