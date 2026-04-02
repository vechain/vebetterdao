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
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuPlus, LuX } from "react-icons/lu"

import { useChallengeActions } from "@/api/challenges/useChallengeActions"

type InviteeEntry = { id: number; value: string }

type AddChallengeInvitesModalProps = {
  challengeId: number
  creatorAddress?: string
  existingInvitees?: string[]
  triggerProps?: ButtonProps
}

export const AddChallengeInvitesModal = ({
  challengeId,
  creatorAddress,
  existingInvitees,
  triggerProps,
}: AddChallengeInvitesModalProps) => {
  const [open, setOpen] = useState(false)
  const nextId = useRef(1)
  const [invitees, setInvitees] = useState<InviteeEntry[]>([{ id: 0, value: "" }])
  const actions = useChallengeActions()
  const { t } = useTranslation()
  const sanitizedInvitees = invitees.map(e => e.value.trim()).filter(Boolean)

  const creatorLower = creatorAddress?.toLowerCase()
  const existingSet = useMemo(() => new Set((existingInvitees ?? []).map(a => a.toLowerCase())), [existingInvitees])

  const getEntryError = (entry: InviteeEntry): string | null => {
    const val = entry.value.trim().toLowerCase()
    if (!val) return null
    if (creatorLower && val === creatorLower) return t("Creator cannot be invited")
    if (existingSet.has(val)) return t("Already invited")
    if (invitees.some(other => other.id !== entry.id && other.value.trim().toLowerCase() === val))
      return t("Duplicate address")
    return null
  }

  const hasErrors = invitees.some(e => getEntryError(e) !== null)
  const canSubmit = sanitizedInvitees.length > 0 && !hasErrors

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
                  {invitees.map(entry => {
                    const error = getEntryError(entry)
                    return (
                      <VStack key={entry.id} align="stretch" gap="1">
                        <HStack gap="2">
                          <Input
                            value={entry.value}
                            onChange={e => updateInvitee(entry.id, e.target.value)}
                            borderColor={error ? "border.error" : undefined}
                          />
                          <IconButton
                            size="sm"
                            variant="ghost"
                            onClick={() => removeInvitee(entry.id)}
                            aria-label={t("Remove")}>
                            <LuX />
                          </IconButton>
                        </HStack>
                        {error && (
                          <Text textStyle="xs" color="fg.error">
                            {error}
                          </Text>
                        )}
                      </VStack>
                    )
                  })}
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
