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
import { useGetAddressFromVetDomains } from "@/hooks/useGetVetDomains"

import {
  countResolvedInvitees,
  getInviteeValidationError,
  getInviteeValidationMessage,
  getSanitizedInvitees,
  isVetDomain,
  ParsedInviteeValue,
  parseInviteeValues,
} from "./inviteeValidation"

type InviteeEntry = { id: number; value: string }
type ParsedInviteeEntry = InviteeEntry & ParsedInviteeValue

type AddChallengeInvitesModalProps = {
  challengeId: number
  creatorAddress?: string
  existingInvitees?: string[]
  triggerProps?: ButtonProps
  children?: React.ReactNode
}

export const AddChallengeInvitesModal = ({
  challengeId,
  creatorAddress,
  existingInvitees,
  triggerProps,
  children,
}: AddChallengeInvitesModalProps) => {
  const [open, setOpen] = useState(false)
  const nextId = useRef(1)
  const [invitees, setInvitees] = useState<InviteeEntry[]>([{ id: 0, value: "" }])
  const actions = useChallengeActions()
  const { t } = useTranslation()

  const existingSet = useMemo(() => new Set((existingInvitees ?? []).map(a => a.toLowerCase())), [existingInvitees])
  const domainInvitees = useMemo(
    () =>
      invitees.map(entry => ({ id: entry.id, value: entry.value.trim() })).filter(entry => isVetDomain(entry.value)),
    [invitees],
  )
  const {
    data: resolvedDomainAddresses = [],
    isPending,
    isFetching,
  } = useGetAddressFromVetDomains(domainInvitees.length > 0 ? domainInvitees.map(entry => entry.value) : undefined)
  const parsedInvitees = useMemo<ParsedInviteeEntry[]>(() => {
    const parsedInviteeValues = parseInviteeValues(
      invitees.map(entry => entry.value),
      resolvedDomainAddresses,
    )

    return invitees.map((entry, index) => {
      const parsedInvitee = parsedInviteeValues[index]

      return {
        ...entry,
        normalizedValue: parsedInvitee?.normalizedValue ?? entry.value.trim(),
        isAddress: parsedInvitee?.isAddress ?? false,
        isDomain: parsedInvitee?.isDomain ?? false,
        resolvedAddress: parsedInvitee?.resolvedAddress,
      }
    })
  }, [invitees, resolvedDomainAddresses])
  const resolvedInviteeCounts = useMemo(() => countResolvedInvitees(parsedInvitees), [parsedInvitees])
  const sanitizedInvitees = useMemo(() => getSanitizedInvitees(parsedInvitees), [parsedInvitees])
  const isResolvingDomains = domainInvitees.length > 0 && (isPending || isFetching)

  const getEntryError = (entry: ParsedInviteeEntry): string | null => {
    const error = getInviteeValidationError({
      invitee: entry,
      creatorAddress,
      existingInvitees: existingSet,
      resolvedInviteeCounts,
      isResolvingDomains,
    })

    return error ? getInviteeValidationMessage(t, error) : null
  }

  const hasErrors = parsedInvitees.some(e => getEntryError(e) !== null)
  const canSubmit = sanitizedInvitees.length > 0 && !hasErrors && !isResolvingDomains

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
    <Dialog.Root open={open} onOpenChange={handleOpen} scrollBehavior="inside">
      <Dialog.Trigger asChild>
        {children ?? (
          <Button size="sm" variant="secondary" {...triggerProps}>
            {t("Add invitee")}
          </Button>
        )}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW={{ base: "95vw", md: "lg" }} maxH={{ base: "90vh", md: "80vh" }}>
            <Dialog.Header pb="5">
              <Dialog.Title>{t("Invitees")}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body overflowY="auto">
              <Field.Root>
                <Field.Label>{t("Invitees")}</Field.Label>
                <VStack align="stretch" gap="2" w="full">
                  {parsedInvitees.map(entry => {
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
