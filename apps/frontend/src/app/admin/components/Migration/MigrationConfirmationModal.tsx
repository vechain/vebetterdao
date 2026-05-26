import {
  Badge,
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Heading,
  HStack,
  Icon,
  Portal,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { UilExclamationTriangle } from "@iconscout/react-unicons"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { HeldRole } from "./hooks/useDiscoverHeldRoles"

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

  // Reset checkbox whenever modal opens or mode changes
  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open, mode])

  const grouped = useMemo(() => {
    const acc: Record<string, HeldRole[]> = {}
    heldRoles.forEach(r => {
      if (!acc[r.contractName]) acc[r.contractName] = []
      acc[r.contractName]!.push(r)
    })
    return acc
  }, [heldRoles])

  const totalClauses = heldRoles.length
  const totalContracts = Object.keys(grouped).length
  const isGrant = mode === "grant"

  const title = isGrant ? t("Confirm grant to multisig") : t("Confirm renounce — irreversible")

  const acknowledgeLabel = isGrant
    ? t("I have verified the destination multisig address is correct.")
    : t("I have verified the multisig already holds all of these roles and understand renouncing is irreversible.")

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={e => {
        if (!e.open) onClose()
      }}
      size={{ base: "full", md: "lg" }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <HStack gap={2}>
                {!isGrant && <Icon as={UilExclamationTriangle} color="red.500" boxSize={6} />}
                <Dialog.Title>{title}</Dialog.Title>
              </HStack>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={5}>
                <HStack gap={6}>
                  <Box>
                    <Text textStyle="xs" color="text.muted">
                      {t("Clauses")}
                    </Text>
                    <Heading size="xl">{totalClauses}</Heading>
                  </Box>
                  <Box>
                    <Text textStyle="xs" color="text.muted">
                      {t("Contracts")}
                    </Text>
                    <Heading size="xl">{totalContracts}</Heading>
                  </Box>
                </HStack>

                <Stack gap={1}>
                  <Text textStyle="xs" color="text.muted">
                    {t("From (current admin)")}
                  </Text>
                  <Text textStyle="sm" fontFamily="mono" wordBreak="break-all">
                    {from}
                  </Text>
                </Stack>

                {isGrant && (
                  <Stack gap={1}>
                    <Text textStyle="xs" color="text.muted">
                      {t("To (multisig)")}
                    </Text>
                    <Text textStyle="sm" fontFamily="mono" wordBreak="break-all">
                      {to}
                    </Text>
                  </Stack>
                )}

                <Box>
                  <Text textStyle="sm" fontWeight="semibold" mb={2}>
                    {isGrant ? t("Roles to grant") : t("Roles to renounce")}
                  </Text>
                  <Box maxH="320px" overflowY="auto" borderWidth={1} borderRadius="md" p={3}>
                    <VStack align="stretch" gap={3}>
                      {Object.entries(grouped).map(([contractName, roles]) => (
                        <Box key={contractName}>
                          <Text textStyle="sm" fontWeight="semibold" mb={1}>
                            {contractName}
                          </Text>
                          <VStack align="stretch" gap={1} pl={3}>
                            {roles.map(r => (
                              <HStack key={r.role} gap={2}>
                                <Text textStyle="xs" color="text.muted">
                                  {isGrant ? "·  grant" : "·  renounce"}
                                </Text>
                                <Badge
                                  colorPalette={r.role === "DEFAULT_ADMIN_ROLE" ? "red" : "gray"}
                                  textTransform="none">
                                  {r.role}
                                </Badge>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </Box>

                <Checkbox.Root
                  checked={acknowledged}
                  onCheckedChange={e => setAcknowledged(!!e.checked)}
                  colorPalette={isGrant ? "blue" : "red"}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control mt="1" />
                  <Checkbox.Label>
                    <Text textStyle="sm">{acknowledgeLabel}</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">{t("Cancel")}</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette={isGrant ? "green" : "red"} disabled={!acknowledged} onClick={onConfirm}>
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
