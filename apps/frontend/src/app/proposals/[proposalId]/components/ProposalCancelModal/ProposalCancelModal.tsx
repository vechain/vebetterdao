import { useCancelProposal } from "@/hooks/useCancelProposal"
import { Button, Dialog, Heading, HStack, Portal, Text, VStack } from "@chakra-ui/react"
import { UilBan } from "@iconscout/react-unicons"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const ProposalCancelModal = ({
  proposalId,
  isOpen,
  onClose,
}: {
  proposalId: string
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation()

  const cancelProposalMutation = useCancelProposal({
    proposalId,
  })

  const handleCancelProposal = useCallback(() => {
    onClose()
    cancelProposalMutation.sendTransaction()
  }, [cancelProposalMutation, onClose])

  return (
    <Dialog.Root open={isOpen}>
      <Portal>
        <Dialog.Positioner>
          <Dialog.Backdrop />
          <Dialog.Content>
            <Dialog.Body py="16px">
              <VStack alignItems="stretch" gap={6}>
                <Heading fontSize={"24px"} fontWeight={700}>
                  {t("Cancel proposal")}
                </Heading>
                <VStack alignItems="stretch" gap={0}>
                  <Text fontSize={"14px"}>
                    {t(
                      "Are you completely sure to cancel this proposal? Community support will be returned, and you cannot recover this proposal.",
                    )}
                  </Text>
                  <Text fontWeight={600} fontSize={"14px"}>
                    {t("This action cannot be undone.")}
                  </Text>
                </VStack>
                <HStack justifyContent={"flex-end"}>
                  <Button variant={"primaryGhost"} onClick={onClose}>
                    {t("Go back")}
                  </Button>
                  <Button variant={"dangerFilled"} onClick={handleCancelProposal}>
                    <UilBan size="18px" />
                    {t("Cancel this proposal")}
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
