import { Button, CloseButton, Dialog, Heading, Icon, Image, Text, VStack } from "@chakra-ui/react"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { LuTrophy } from "react-icons/lu"

import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"

type Props = {
  isOpen: boolean
  onClose: () => void
  prizeLabel: string
  onClaim: () => void
}

const fireConfetti = () => {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  confetti({ ...defaults, particleCount: 80, origin: { x: 0.3, y: 0.6 } })
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.7, y: 0.6 } })

  setTimeout(() => {
    confetti({ ...defaults, particleCount: 50, origin: { x: 0.5, y: 0.4 } })
  }, 250)
}

export const ChallengeClaimModal = ({ isOpen, onClose, prizeLabel, onClaim }: Props) => {
  const { t } = useTranslation()

  useEffect(() => {
    if (isOpen) fireConfetti()
  }, [isOpen])

  const handleClaim = () => {
    onClose()
    onClaim()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()} placement="center" size="xs">
      <CustomModalContent>
        <ModalAnimation>
          <Dialog.CloseTrigger asChild top={4} right={4}>
            <CloseButton />
          </Dialog.CloseTrigger>
          <VStack align="center" p={8} gap={6}>
            <Image src="/assets/mascot/present-zoom.png" alt="B3MO" boxSize="200px" objectFit="contain" />

            <VStack gap={1}>
              <Heading size="xl" fontWeight="bold" textAlign="center">
                {t("Congratulations!")}
              </Heading>
              <Text textStyle="md" color="text.subtle" textAlign="center">
                {t("You won this B3MO quest! Claim your prize now.")}
              </Text>
            </VStack>

            <Heading size="3xl" fontWeight="bold" textAlign="center" color="text.primary">
              {prizeLabel}
            </Heading>

            <Button
              variant="primary"
              w="full"
              size="lg"
              gap="2"
              bg="yellow.400"
              color="yellow.900"
              borderWidth="1px"
              borderColor="yellow.500"
              _hover={{ bg: "yellow.500" }}
              _active={{ bg: "yellow.400" }}
              onClick={handleClaim}>
              <Icon as={LuTrophy} boxSize="4" />
              {t("Claim prize")}
            </Button>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
