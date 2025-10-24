import { Button, Dialog, Portal, CloseButton, Text } from "@chakra-ui/react"
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
              <Text>{t("This action cannot be undone. This will permanently cancel your grant proposal.")}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">{t("Cancel")}</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="red"
                onClick={() => {
                  if ("id" in proposal) cancelProposalMutation.sendTransaction()
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
