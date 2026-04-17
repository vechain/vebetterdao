import {
  Box,
  Button,
  ButtonProps,
  CloseButton,
  Dialog,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { UserPlus } from "iconoir-react"
import { useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuCheck, LuPlus, LuX } from "react-icons/lu"

import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { AddressIcon } from "@/components/AddressIcon"
import { CustomModalContent } from "@/components/CustomModalContent"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
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

  const submitLabel =
    sanitizedInvitees.length > 0
      ? t("Send invites ({{count}})", { count: sanitizedInvitees.length })
      : t("Send invites")

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen} placement="center" size="md" scrollBehavior="inside">
      <Dialog.Trigger asChild>
        {children ?? (
          <Button size="sm" variant="secondary" {...triggerProps}>
            {t("Add invitee")}
          </Button>
        )}
      </Dialog.Trigger>
      <CustomModalContent>
        <ModalAnimation>
          <Dialog.CloseTrigger asChild top={4} right={4}>
            <CloseButton />
          </Dialog.CloseTrigger>

          <VStack align="stretch" p={{ base: 6, md: 8 }} gap={6}>
            <VStack gap={3} align="center">
              <Box
                bg="actions.primary.subtle"
                color="actions.primary.default"
                rounded="full"
                p={3}
                display="inline-flex">
                <Icon as={UserPlus} boxSize={6} />
              </Box>
              <VStack gap={1} align="center">
                <Heading size="xl" fontWeight="bold" textAlign="center">
                  {t("Invite friends")}
                </Heading>
                <Text textStyle="sm" color="text.subtle" textAlign="center">
                  {t("Add wallet addresses or .vet domains to invite to this quest.")}
                </Text>
              </VStack>
            </VStack>

            <VStack align="stretch" gap={3}>
              {parsedInvitees.map(entry => {
                const error = getEntryError(entry)
                const isRowResolving = entry.isDomain && !entry.resolvedAddress && isResolvingDomains
                const isResolved = !!entry.resolvedAddress && !error
                const showResolvedPreview = entry.isDomain && isResolved

                return (
                  <VStack key={entry.id} align="stretch" gap={1.5}>
                    <HStack gap={2} align="center">
                      <InputGroup
                        flex="1"
                        endElement={
                          isRowResolving ? (
                            <Spinner size="sm" color="text.subtle" />
                          ) : isResolved ? (
                            <Icon as={LuCheck} color="fg.success" />
                          ) : null
                        }>
                        <Input
                          value={entry.value}
                          placeholder={t("0x... or name.vet")}
                          onChange={e => updateInvitee(entry.id, e.target.value)}
                          borderColor={error ? "border.error" : undefined}
                        />
                      </InputGroup>
                      {parsedInvitees.length > 1 && (
                        <IconButton
                          size="sm"
                          variant="ghost"
                          onClick={() => removeInvitee(entry.id)}
                          aria-label={t("Remove")}>
                          <LuX />
                        </IconButton>
                      )}
                    </HStack>

                    {showResolvedPreview && entry.resolvedAddress && (
                      <HStack gap={2} pl={3}>
                        <AddressIcon address={entry.resolvedAddress} boxSize={4} rounded="full" />
                        <Text textStyle="xs" color="text.subtle">
                          {humanAddress(entry.resolvedAddress, 6, 4)}
                        </Text>
                      </HStack>
                    )}

                    {error && (
                      <Text textStyle="xs" color="fg.error" pl={3}>
                        {error}
                      </Text>
                    )}
                  </VStack>
                )
              })}

              <Button size="sm" variant="tertiary" onClick={addInvitee} alignSelf="flex-start">
                <LuPlus />
                {t("Add another")}
              </Button>
            </VStack>

            <VStack align="stretch" gap={2}>
              <Button variant="primary" w="full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
                {submitLabel}
              </Button>
              <Dialog.ActionTrigger asChild>
                <Button variant="ghost" w="full" size="md">
                  {t("Cancel")}
                </Button>
              </Dialog.ActionTrigger>
            </VStack>
          </VStack>
        </ModalAnimation>
      </CustomModalContent>
    </Dialog.Root>
  )
}
