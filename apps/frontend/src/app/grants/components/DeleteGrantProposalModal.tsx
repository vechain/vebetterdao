import { Button, Dialog, Portal, CloseButton, Text, Textarea, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { GrantFormData, GrantProposalEnriched } from "../../../hooks/proposals/grants/types"
import { useCancelProposal } from "../../../hooks/useCancelProposal"
import { useDraftGrantProposalStore } from "../../../store/useGrantProposalFormStore"

export const DeleteGrantProposalModal = ({
  proposal,
  children,
}: {
  children: React.ReactNode
  proposal: GrantFormData | GrantProposalEnriched
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const cancelProposalMutation = useCancelProposal({ proposalId: "id" in proposal ? proposal.id : "" })
  const { removeDraftGrantProposal } = useDraftGrantProposalStore()
  return (
    <Dialog.Root role="alertdialog" open={open} onOpenChange={e => setOpen(e.open)}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t("Are you sure?")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text>{t("This action cannot be undone. This will permanently cancel your grant proposal.")}</Text>
                <VStack align="stretch" gap={2}>
                  <Text>{t("Reason")}</Text>
                  <Text textStyle="sm" color="gray.500">
                    {t("Optional")}
                  </Text>
                  <Textarea
                    placeholder={t("Please provide a reason for cancelling this proposal")}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    resize="none"
                    rows={3}
                    fontSize={"16px"}
                  />
                </VStack>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">{t("Cancel")}</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="red"
                onClick={() => {
                  if ("id" in proposal) cancelProposalMutation.sendTransaction({ reason })
                  else removeDraftGrantProposal(proposal.projectName)
                  setOpen(false)
                }}>
                {t("Delete")}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
