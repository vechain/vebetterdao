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
import { isValidAddress } from "@vechain/vechain-kit/utils"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuPlus, LuX } from "react-icons/lu"

import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { useGetAddressFromVetDomains } from "@/hooks/useGetVetDomains"

type InviteeEntry = { id: number; value: string }
type ParsedInviteeEntry = InviteeEntry & {
  normalizedValue: string
  isAddress: boolean
  isDomain: boolean
  resolvedAddress?: string
}

const isVetDomain = (value: string) => {
  const normalizedValue = value.toLowerCase()
  return !normalizedValue.startsWith("0x") && normalizedValue.endsWith(".vet")
}

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

  const creatorLower = creatorAddress?.toLowerCase()
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
    let domainIndex = 0

    return invitees.map(entry => {
      const normalizedValue = entry.value.trim()
      const isAddress = isValidAddress(normalizedValue)
      const isDomain = isVetDomain(normalizedValue)
      const resolvedDomain = isDomain ? resolvedDomainAddresses[domainIndex++] : undefined

      return {
        ...entry,
        normalizedValue,
        isAddress,
        isDomain,
        resolvedAddress: isAddress
          ? normalizedValue.toLowerCase()
          : typeof resolvedDomain === "string"
            ? resolvedDomain.toLowerCase()
            : undefined,
      }
    })
  }, [invitees, resolvedDomainAddresses])
  const resolvedInviteeCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const entry of parsedInvitees) {
      if (!entry.resolvedAddress) continue
      counts.set(entry.resolvedAddress, (counts.get(entry.resolvedAddress) ?? 0) + 1)
    }

    return counts
  }, [parsedInvitees])
  const sanitizedInvitees = parsedInvitees
    .map(entry => entry.resolvedAddress)
    .filter((address): address is string => !!address)
  const isResolvingDomains = domainInvitees.length > 0 && (isPending || isFetching)

  const getEntryError = (entry: ParsedInviteeEntry): string | null => {
    if (!entry.normalizedValue) return null
    if (entry.normalizedValue.toLowerCase().startsWith("0x") && !entry.isAddress)
      return t("Please enter a valid wallet address")
    if (!entry.isAddress && !entry.isDomain) return t("Please enter a valid wallet address or domain")
    if (entry.isDomain && !entry.resolvedAddress) return isResolvingDomains ? null : t("Please enter a valid domain")
    if (!entry.resolvedAddress) return t("Invalid address")
    if (creatorLower && entry.resolvedAddress === creatorLower) return t("Creator cannot be invited")
    if (existingSet.has(entry.resolvedAddress)) return t("Already invited")
    if ((resolvedInviteeCounts.get(entry.resolvedAddress) ?? 0) > 1) return t("Duplicate address")
    return null
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
