import { ProposalState } from "@/api"
import { useCancelProposal } from "@/hooks/useCancelProposal"
import { Button, Card, HStack, Heading, Dialog, Text, VStack, useDisclosure, Portal } from "@chakra-ui/react"
import { UilBan } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../hooks"
import { useAccountPermissions } from "@/api/contracts/account"

export const CancelProposalSection = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { proposal } = useProposalDetail()
  const confirmationModal = useDisclosure()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  const handleCloseConfirmationModal = useCallback(() => {
    confirmationModal.onClose()
  }, [confirmationModal])

  const cancelProposalMutation = useCancelProposal({
    proposalId: proposal.id,
  })

  const handleCancelProposal = useCallback(() => {
    confirmationModal.onClose()
    cancelProposalMutation.sendTransaction()
  }, [cancelProposalMutation, confirmationModal])

  const accountCanCancelProposal = useMemo(
    () => compareAddresses(proposal.proposer, account?.address || "") || permissions?.isAdminOfB3TRGovernor,
    [proposal.proposer, account, permissions],
  )

  if (accountCanCancelProposal && proposal.state !== ProposalState.Pending) {
    return null
  }

  if (proposal.state !== ProposalState.Pending || !accountCanCancelProposal) {
    return null
  }

  return (
    <Card.Root variant="baseWithBorder">
      <Card.Body>
        <VStack alignItems="stretch" gap={6}>
          <Heading size="2xl">{t("Cancel proposal")}</Heading>
          <Text fontSize={"14px"}>
            {t(
              "If you cancel the proposal it will not be voted on in the next round. After the round starts, you will no longer be able to cancel it.",
            )}
          </Text>
          <Button variant={"dangerFilledTonal"} onClick={confirmationModal.onOpen}>
            <UilBan size="18px" />
            {t("Cancel this proposal")}
          </Button>
        </VStack>
      </Card.Body>
      <Dialog.Root
        open={confirmationModal.open}
        onOpenChange={details => !details.open && handleCloseConfirmationModal()}>
        <Portal>
          <Dialog.Positioner>
            <Dialog.Backdrop />
            <Dialog.Content>
              <Dialog.Body py="16px">
                <VStack alignItems="stretch" gap={6}>
                  <Heading size="2xl">{t("Cancel proposal")}</Heading>
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
                    <Button variant={"primaryGhost"} onClick={handleCloseConfirmationModal}>
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
    </Card.Root>
  )
}
