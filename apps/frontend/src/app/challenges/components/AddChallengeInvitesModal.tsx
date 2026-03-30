"use client"

import {
  Button,
  ButtonProps,
  CloseButton,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Portal,
  VStack,
} from "@chakra-ui/react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuPlus, LuX } from "react-icons/lu"

import { useChallengeActions } from "@/api/challenges/useChallengeActions"

type InviteeEntry = { id: number; value: string }

type AddChallengeInvitesModalProps = {
  challengeId: number
  triggerProps?: ButtonProps
}

export const AddChallengeInvitesModal = ({ challengeId, triggerProps }: AddChallengeInvitesModalProps) => {
  const [open, setOpen] = useState(false)
  const nextId = useRef(1)
  const [invitees, setInvitees] = useState<InviteeEntry[]>([{ id: 0, value: "" }])
  const actions = useChallengeActions()
  const { t } = useTranslation()
  const sanitizedInvitees = invitees.map(e => e.value.trim()).filter(Boolean)
  const canSubmit = sanitizedInvitees.length > 0

  const updateInvitee = (id: number, value: string) => {
    setInvitees(prev => prev.map(e => (e.id === id ? { ...e, value } : e)))
  }

  const addInvitee = () => {
    setInvitees(prev => [...prev, { id: nextId.current++, value: "" }])
  }

  const removeInvitee = (id: number) => {
    setInvitees(prev => prev.filter(e => e.id !== id))
  }

  const handleOpen = (e: { open: boolean }) => {
    if (e.open) {
      setInvitees([{ id: nextId.current++, value: "" }])
    }
    setOpen(e.open)
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    actions.addInvites(challengeId, sanitizedInvitees)
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="secondary" {...triggerProps}>
          {t("Add invitee")}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "95vw", md: "lg" }}>
            <Dialog.Header pb="5">
              <Dialog.Title>{t("Invitees")}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Field.Root>
                <Field.Label>{t("Invitees")}</Field.Label>
                <VStack align="stretch" gap="2" w="full">
                  {invitees.map(entry => (
                    <HStack key={entry.id} gap="2">
                      <Input value={entry.value} onChange={e => updateInvitee(entry.id, e.target.value)} />
                      <IconButton
                        size="sm"
                        variant="ghost"
                        onClick={() => removeInvitee(entry.id)}
                        aria-label={t("Remove")}>
                        <LuX />
                      </IconButton>
                    </HStack>
                  ))}
                  <Button size="sm" variant="tertiary" onClick={addInvitee}>
                    <LuPlus />
                    {t("Add invitee")}
                  </Button>
                </VStack>
              </Field.Root>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="secondary">{t("Cancel")}</Button>
              </Dialog.ActionTrigger>
              <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
                {t("Save")}
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
