import { useCancelProposal } from "@/hooks/useCancelProposal"
import {
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { UilBan } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../hooks"
import { ProposalState } from "@/hooks/proposals/grants/types"
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
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Cancel proposal")}
          </Heading>
          <Text fontSize={"14px"}>
            {t(
              "If you cancel the proposal it will not be voted on in the next round. After the round starts, you will no longer be able to cancel it.",
            )}
          </Text>
          <Button variant={"dangerFilledTonal"} leftIcon={<UilBan size="18px" />} onClick={confirmationModal.onOpen}>
            {t("Cancel this proposal")}
          </Button>
        </VStack>
      </CardBody>
      <Modal isOpen={confirmationModal.isOpen} onClose={handleCloseConfirmationModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody py="16px">
            <VStack align="stretch" gap={6}>
              <Heading fontSize={"24px"} fontWeight={700}>
                {t("Cancel proposal")}
              </Heading>
              <VStack align="stretch" gap={0}>
                <Text fontSize={"14px"}>
                  {t(
                    "Are you completely sure to cancel this proposal? Community support will be returned, and you cannot recover this proposal.",
                  )}
                </Text>
                <Text fontWeight={600} fontSize={"14px"}>
                  {t("This action cannot be undone.")}
                </Text>
              </VStack>
              <HStack justify={"flex-end"}>
                <Button variant={"primaryGhost"} onClick={handleCloseConfirmationModal}>
                  {t("Go back")}
                </Button>
                <Button variant={"dangerFilled"} leftIcon={<UilBan size="18px" />} onClick={handleCancelProposal}>
                  {t("Cancel this proposal")}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  )
}
