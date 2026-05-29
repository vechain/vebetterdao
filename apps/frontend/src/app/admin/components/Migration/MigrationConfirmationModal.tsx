import { Badge, Box, Button, Checkbox, CloseButton, Dialog, HStack, Portal, Text, VStack, Wrap } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { HeldRole } from "./hooks/useDiscoverHeldRoles"

type Props = {
  open: boolean
  mode: "grant" | "renounce"
  from: string
  to: string
  heldRoles: HeldRole[]
  selectedContractAddresses: Set<string>
  onToggleContract: (contractAddress: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onClose: () => void
  onConfirm: () => void
}

export const MigrationConfirmationModal = ({
  open,
  mode,
  from,
  to,
  heldRoles,
  selectedContractAddresses,
  onToggleContract,
  onSelectAll,
  onDeselectAll,
  onClose,
  onConfirm,
}: Props) => {
  const { t } = useTranslation()
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open, mode])

  const isGrant = mode === "grant"

  const groupedHeldRoles = useMemo(() => {
    const groups: Record<string, { contractName: string; contractAddress: string; roles: string[] }> = {}
    for (const r of heldRoles) {
      if (!groups[r.contractAddress]) {
        groups[r.contractAddress] = {
          contractName: r.contractName,
          contractAddress: r.contractAddress,
          roles: [],
        }
      }
      groups[r.contractAddress]!.roles.push(r.role)
    }
    return Object.values(groups)
  }, [heldRoles])

  const selectedRolesCount = heldRoles.filter(r => selectedContractAddresses.has(r.contractAddress)).length
  const totalClauses = selectedRolesCount
  const totalContracts = selectedContractAddresses.size
  const allSelected =
    groupedHeldRoles.length > 0 && groupedHeldRoles.every(g => selectedContractAddresses.has(g.contractAddress))

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={e => {
        if (!e.open) onClose()
      }}
      size={{ base: "full", md: "xl" }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {isGrant ? t("Confirm grant to destination wallet") : t("Confirm renounce — irreversible")}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={5} alignItems="stretch">
                {/* Summary line */}
                <Text textStyle="sm">
                  {isGrant
                    ? t("You are about to send 1 transaction with {{count}} clauses across {{contracts}} contracts.", {
                        count: totalClauses,
                        contracts: totalContracts,
                      })
                    : t(
                        "You are about to renounce {{count}} roles across {{contracts}} contracts. This cannot be undone.",
                        { count: totalClauses, contracts: totalContracts },
                      )}
                </Text>

                {/* From → To */}
                {isGrant ? (
                  <VStack gap={2} alignItems="stretch">
                    <Box borderWidth={1} borderRadius="md" p={3}>
                      <Text textStyle="xs" color="text.muted" mb={1}>
                        {t("From (connected wallet)")}
                      </Text>
                      <Text textStyle="sm" fontFamily="mono" wordBreak="break-all">
                        {from}
                      </Text>
                    </Box>
                    <HStack justify="center">
                      <Text textStyle="lg" color="text.muted">
                        {"↓"}
                      </Text>
                    </HStack>
                    <Box borderWidth={2} borderRadius="md" p={3} borderColor="blue.500">
                      <Text textStyle="xs" color="text.muted" mb={1}>
                        {t("To (destination wallet)")}
                      </Text>
                      <Text textStyle="sm" fontFamily="mono" wordBreak="break-all">
                        {to}
                      </Text>
                    </Box>
                  </VStack>
                ) : (
                  <Box borderWidth={2} borderRadius="md" p={3} borderColor="red.500">
                    <Text textStyle="xs" color="text.muted" mb={1}>
                      {t("From (connected wallet)")}
                    </Text>
                    <Text textStyle="sm" fontFamily="mono" wordBreak="break-all">
                      {from}
                    </Text>
                  </Box>
                )}

                {/* Roles list with per-contract selection */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text textStyle="sm" fontWeight="bold">
                      {isGrant ? t("Roles to grant") : t("Roles to renounce")}
                    </Text>
                    <Button size="xs" variant="ghost" onClick={allSelected ? onDeselectAll : onSelectAll}>
                      {allSelected ? t("Deselect all") : t("Select all")}
                    </Button>
                  </HStack>
                  <Box maxH="320px" overflowY="auto" pr={1}>
                    <VStack gap={2} alignItems="stretch" w="full">
                      {groupedHeldRoles.map(({ contractName, contractAddress, roles }) => {
                        const checked = selectedContractAddresses.has(contractAddress)
                        const hasAdmin = roles.includes("DEFAULT_ADMIN_ROLE")
                        return (
                          <Box
                            key={contractAddress}
                            borderWidth={1}
                            borderRadius="md"
                            p={3}
                            opacity={checked ? 1 : 0.55}>
                            <Checkbox.Root
                              checked={checked}
                              onCheckedChange={() => onToggleContract(contractAddress)}
                              colorPalette={isGrant ? "blue" : "red"}
                              alignItems="start"
                              w="full">
                              <Checkbox.HiddenInput />
                              <Checkbox.Control mt="1" />
                              <Checkbox.Label w="full">
                                <VStack alignItems="stretch" gap={2} w="full">
                                  <HStack justify="space-between" gap={3}>
                                    <HStack gap={2} flex={1} minW={0}>
                                      <Text textStyle="sm" fontWeight="bold" truncate>
                                        {contractName}
                                      </Text>
                                      <Badge size="sm" colorPalette="gray">
                                        {roles.length}
                                      </Badge>
                                      {hasAdmin && (
                                        <Badge size="sm" colorPalette="red" textTransform="none">
                                          {"DEFAULT_ADMIN"}
                                        </Badge>
                                      )}
                                    </HStack>
                                    <Text textStyle="xs" color="text.muted" fontFamily="mono" flexShrink={0}>
                                      {humanAddress(contractAddress)}
                                    </Text>
                                  </HStack>
                                  <Wrap gap={2}>
                                    {roles.map(role => (
                                      <Badge
                                        key={role}
                                        colorPalette={role === "DEFAULT_ADMIN_ROLE" ? "red" : "blue"}
                                        textTransform="none">
                                        {role}
                                      </Badge>
                                    ))}
                                  </Wrap>
                                </VStack>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          </Box>
                        )
                      })}
                    </VStack>
                  </Box>
                </Box>

                {/* Acknowledgement */}
                <Checkbox.Root
                  checked={acknowledged}
                  onCheckedChange={e => setAcknowledged(!!e.checked)}
                  colorPalette={isGrant ? "blue" : "red"}
                  alignItems="start">
                  <Checkbox.HiddenInput />
                  <Checkbox.Control mt="1" />
                  <Checkbox.Label>
                    <Text textStyle="sm">
                      {isGrant
                        ? t("I have verified the destination wallet address is correct.")
                        : t(
                            "I have verified the destination wallet already holds all of these roles and understand renouncing is irreversible.",
                          )}
                    </Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">{t("Cancel")}</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette={isGrant ? "blue" : "red"}
                disabled={!acknowledged || totalClauses === 0}
                onClick={onConfirm}>
                {isGrant ? t("Confirm and sign") : t("Renounce all roles")}
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
