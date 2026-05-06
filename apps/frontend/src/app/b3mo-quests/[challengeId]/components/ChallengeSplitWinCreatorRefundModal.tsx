import { Button, CloseButton, Dialog, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  onRefund: () => void
  refundLabel: string
  unclaimedSlots: number
}

export const ChallengeSplitWinCreatorRefundModal = ({
  isOpen,
  onClose,
  onRefund,
  refundLabel,
  unclaimedSlots,
}: Props) => {
  const { t } = useTranslation()

  const handleRefund = () => {
    onClose()
    onRefund()
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
                {t("Refund unclaimed slots")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("{{count}} slots went unclaimed. Reclaim {{amount}} from the prize pool.", {
                  count: unclaimedSlots,
                  amount: refundLabel,
                })}
              </Text>
            </VStack>

            <Button variant="primary" w="full" size="lg" onClick={handleRefund}>
              {t("Claim refund")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
