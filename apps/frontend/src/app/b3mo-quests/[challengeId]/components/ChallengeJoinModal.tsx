import { Button, CloseButton, Dialog, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  stakeLabel?: string
  onJoin: () => void
}

export const ChallengeJoinModal = ({ isOpen, onClose, stakeLabel, onJoin }: Props) => {
  const { t } = useTranslation()
  const isStake = !!stakeLabel

  const handleJoin = () => {
    onClose()
    onJoin()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} placement="center" size="xs">
      <CustomModalContent>
        <ModalAnimation>
          <Dialog.CloseTrigger asChild top={4} right={4}>
            <CloseButton />
          </Dialog.CloseTrigger>
          <VStack align="center" p={8} gap={6}>
            <Image
              src="/assets/mascot/mascot-welcoming-left-head-2.png"
              alt="B3MO"
              boxSize="200px"
              objectFit="contain"
            />

            <VStack gap={1}>
              <Heading size="xl" fontWeight="bold" textAlign="center">
                {t("Join B3MO quest")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {isStake
                  ? t(
                      "Confirm to join this B3MO quest. Your bet will be locked in the prize pool until the B3MO quest ends.",
                    )
                  : t("Confirm to join this B3MO quest. No bet required — just bring your A-game.")}
              </Text>
            </VStack>

            {isStake && (
              <Heading size="3xl" fontWeight="bold" textAlign="center" color="text.primary">
                {stakeLabel}
              </Heading>
            )}

            <Button variant="primary" w="full" size="lg" onClick={handleJoin}>
              {isStake ? t("Join with {{stake}}", { stake: stakeLabel }) : t("Join")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
