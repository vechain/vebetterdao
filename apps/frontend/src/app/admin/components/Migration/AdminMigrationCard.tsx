import { Box, Button, Card, Field, Heading, HStack, InputGroup, Text, VStack } from "@chakra-ui/react"
import { compareAddresses, isValid as isAddressValid } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { WalletAddressInput } from "../../../components/Input/WalletAddressInput"

import { useDiscoverHeldRoles } from "./hooks/useDiscoverHeldRoles"
import { useMigrateRoles } from "./hooks/useMigrateRoles"
import { MigrationConfirmationModal } from "./MigrationConfirmationModal"
import { RolesByContract } from "./RolesByContract"

export const AdminMigrationCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const fromAddress = account?.address ?? ""

  const [toAddress, setToAddress] = useState("")
  const [confirmMode, setConfirmMode] = useState<"grant" | "renounce" | null>(null)

  const fromDiscovery = useDiscoverHeldRoles(fromAddress)
  const isToAddressValid = isAddressValid(toAddress) && !compareAddresses(toAddress, fromAddress)
  const toDiscovery = useDiscoverHeldRoles(isToAddressValid ? toAddress : undefined)

  const { grantAll, renounceAll } = useMigrateRoles({
    from: fromAddress,
    to: toAddress,
    heldRoles: fromDiscovery.heldRoles,
    onGrantSuccess: () => setConfirmMode(null),
    onRenounceSuccess: () => setConfirmMode(null),
  })

  const canGrant = isToAddressValid && fromDiscovery.heldRoles.length > 0 && !grantAll.isTransactionPending
  const canRenounce = fromDiscovery.heldRoles.length > 0 && !renounceAll.isTransactionPending

  const handleConfirm = () => {
    if (confirmMode === "grant") grantAll.sendTransaction()
    else if (confirmMode === "renounce") renounceAll.sendTransaction()
  }

  return (
    <Card.Root w="full">
      <Card.Header>
        <Heading size="3xl">{t("Migrate wallet roles")}</Heading>
        <Text textStyle="sm">
          {t(
            "Grant every AccessControl role this wallet holds to another wallet in one transaction. Verify on a block explorer, then renounce them.",
          )}
        </Text>
      </Card.Header>

      <Card.Body>
        <VStack gap={6} alignItems="start" w="full">
          {/* Connected wallet */}
          <Box w="full">
            <Text textStyle="xs" color="text.muted" mb={1}>
              {t("Connected wallet")}
            </Text>
            <Text textStyle="md" fontFamily="mono" fontWeight="semibold">
              {fromAddress ? humanAddress(fromAddress, 6, 8) : t("Not connected")}
            </Text>
          </Box>

          {/* Destination wallet */}
          <Field.Root required invalid={!!toAddress && !isToAddressValid} w="full">
            <Field.Label>
              <strong>{t("Destination wallet address")}</strong>
              <Field.RequiredIndicator />
            </Field.Label>
            <InputGroup>
              <WalletAddressInput
                onAddressResolved={addr => setToAddress(addr ?? "")}
                placeholder={t("0x... or vet.domain")}
              />
            </InputGroup>
            {!!toAddress && compareAddresses(toAddress, fromAddress) && (
              <Field.ErrorText>{t("Destination must differ from the connected wallet")}</Field.ErrorText>
            )}
          </Field.Root>

          {/* ============ ACTIONS ============ */}

          {/* Step 1: grant */}
          <Box w="full" borderTopWidth={1} pt={4}>
            <Text textStyle="sm" mb={2}>
              <strong>{t("Step 1 — Grant all roles to destination wallet")}</strong>
            </Text>
            <Text textStyle="xs" color="text.muted" mb={3}>
              {t("Sends one transaction with one clause per role.")}
            </Text>
            <Button
              colorPalette="blue"
              loading={grantAll.isTransactionPending}
              disabled={!canGrant}
              onClick={() => setConfirmMode("grant")}>
              {t("Grant all roles to destination wallet")}
            </Button>
          </Box>

          {/* Step 2: renounce */}
          <Box w="full" borderTopWidth={1} pt={4}>
            <Text textStyle="sm" mb={2}>
              <strong>{t("Step 2 — Renounce all roles from this wallet")}</strong>
            </Text>
            <Text textStyle="xs" color="text.muted" mb={3}>
              {t(
                "Only do this after verifying the destination wallet holds the roles on a block explorer. Irreversible.",
              )}
            </Text>
            <Button
              colorPalette="red"
              loading={renounceAll.isTransactionPending}
              disabled={!canRenounce}
              onClick={() => setConfirmMode("renounce")}>
              {t("Renounce all roles from this wallet")}
            </Button>
          </Box>

          {/* ============ ROLES (reference) ============ */}

          {/* Roles held by connected wallet */}
          <Box w="full" borderTopWidth={1} pt={4}>
            <HStack justify="space-between" align="start" mb={2}>
              <Box>
                <Text textStyle="sm">
                  <strong>{t("Roles held by connected wallet")}</strong>
                </Text>
                <Text textStyle="xs" color="text.muted" fontFamily="mono">
                  {fromAddress || t("Not connected")}
                </Text>
              </Box>
              {!fromDiscovery.isLoading && fromDiscovery.heldRoles.length > 0 && (
                <Text textStyle="xs" color="text.muted">
                  {t("{{count}} roles across {{contracts}} contracts", {
                    count: fromDiscovery.heldRoles.length,
                    contracts: new Set(fromDiscovery.heldRoles.map(r => r.contractName)).size,
                  })}
                </Text>
              )}
            </HStack>
            <RolesByContract heldRoles={fromDiscovery.heldRoles} isLoading={fromDiscovery.isLoading} />
          </Box>

          {/* Roles held by destination wallet (verification) */}
          <Box w="full" borderTopWidth={1} pt={4}>
            <HStack justify="space-between" align="start" mb={2}>
              <Box>
                <Text textStyle="sm">
                  <strong>{t("Roles held by destination wallet")}</strong>
                </Text>
                <Text textStyle="xs" color="text.muted" fontFamily="mono">
                  {isToAddressValid ? toAddress : t("No destination wallet entered.")}
                </Text>
              </Box>
              {isToAddressValid && !toDiscovery.isLoading && toDiscovery.heldRoles.length > 0 && (
                <Text textStyle="xs" color="text.muted">
                  {t("{{count}} roles across {{contracts}} contracts", {
                    count: toDiscovery.heldRoles.length,
                    contracts: new Set(toDiscovery.heldRoles.map(r => r.contractName)).size,
                  })}
                </Text>
              )}
            </HStack>
            <Text textStyle="xs" color="text.muted" mb={2}>
              {t("Enter a destination wallet address above to verify it without connecting that wallet.")}
            </Text>
            {isToAddressValid && (
              <RolesByContract
                heldRoles={toDiscovery.heldRoles}
                isLoading={toDiscovery.isLoading}
                emptyText={t("Destination wallet does not hold any AccessControl roles yet.")}
              />
            )}
          </Box>
        </VStack>
      </Card.Body>

      <MigrationConfirmationModal
        open={confirmMode !== null}
        mode={confirmMode ?? "grant"}
        from={fromAddress}
        to={toAddress}
        heldRoles={fromDiscovery.heldRoles}
        onClose={() => setConfirmMode(null)}
        onConfirm={handleConfirm}
      />
    </Card.Root>
  )
}
