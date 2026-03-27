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
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuPlus, LuX } from "react-icons/lu"

import { useChallengeActions } from "@/api/challenges/useChallengeActions"

const getInitialInvitees = () => [""]

type AddChallengeInvitesModalProps = {
  challengeId: number
  triggerProps?: ButtonProps
}

export const AddChallengeInvitesModal = ({ challengeId, triggerProps }: AddChallengeInvitesModalProps) => {
  const [open, setOpen] = useState(false)
  const [invitees, setInvitees] = useState<string[]>(getInitialInvitees)
  const actions = useChallengeActions()
  const { t } = useTranslation()
  const sanitizedInvitees = invitees.map(value => value.trim()).filter(Boolean)
  const canSubmit = sanitizedInvitees.length > 0

  const updateInvitee = (index: number, value: string) => {
    setInvitees(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const addInvitee = () => setInvitees(prev => [...prev, ""])

  const removeInvitee = (index: number) => {
    setInvitees(prev => prev.filter((_, i) => i !== index))
  }

  const handleOpen = (e: { open: boolean }) => {
    if (e.open) {
      setInvitees(getInitialInvitees())
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
                  {invitees.map((address, index) => (
                    <HStack key={index} gap="2">
                      <Input value={address} onChange={e => updateInvitee(index, e.target.value)} />
                      <IconButton
                        size="sm"
                        variant="ghost"
                        onClick={() => removeInvitee(index)}
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
