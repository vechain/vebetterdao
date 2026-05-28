import { Box, Button, Checkbox, CloseButton, Dialog, HStack, Portal, Text, VStack } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { HeldRole } from "./hooks/useDiscoverHeldRoles"
import { RolesByContract } from "./RolesByContract"

type Props = {
  open: boolean
  mode: "grant" | "renounce"
  from: string
  to: string
  heldRoles: HeldRole[]
  onClose: () => void
  onConfirm: () => void
}

export const MigrationConfirmationModal = ({ open, mode, from, to, heldRoles, onClose, onConfirm }: Props) => {
  const { t } = useTranslation()
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open, mode])

  const isGrant = mode === "grant"
  const totalClauses = heldRoles.length
  const totalContracts = new Set(heldRoles.map(r => r.contractName)).size

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

                {/* Roles list */}
                <Box>
                  <Text textStyle="sm" fontWeight="bold" mb={2}>
                    {isGrant ? t("Roles to grant") : t("Roles to renounce")}
                  </Text>
                  <Box maxH="320px" overflowY="auto" pr={1}>
                    <RolesByContract heldRoles={heldRoles} isLoading={false} />
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
              <Button colorPalette={isGrant ? "blue" : "red"} disabled={!acknowledged} onClick={onConfirm}>
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
