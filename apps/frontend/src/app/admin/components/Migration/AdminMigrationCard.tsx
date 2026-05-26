import { Box, Button, Card, Field, Heading, HStack, Icon, Stack, Text, VStack } from "@chakra-ui/react"
import { UilExclamationTriangle, UilInfoCircle } from "@iconscout/react-unicons"
import { compareAddresses, isValid as isAddressValid } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { WalletAddressInput } from "../../../components/Input/WalletAddressInput"

import { DiscoveredRolesTable } from "./DiscoveredRolesTable"
import { useDiscoverHeldRoles } from "./hooks/useDiscoverHeldRoles"
import { useMigrateRoles } from "./hooks/useMigrateRoles"
import { MigrationConfirmationModal } from "./MigrationConfirmationModal"

export const AdminMigrationCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const adminAddress = account?.address ?? ""

  const [multisigAddress, setMultisigAddress] = useState("")
  const [confirmMode, setConfirmMode] = useState<"grant" | "renounce" | null>(null)

  const { isLoading, heldRoles } = useDiscoverHeldRoles(adminAddress)

  const isMultisigValid = isAddressValid(multisigAddress) && !compareAddresses(multisigAddress, adminAddress)

  const { grantAll, renounceAll } = useMigrateRoles({
    from: adminAddress,
    to: multisigAddress,
    heldRoles,
    onGrantSuccess: () => setConfirmMode(null),
    onRenounceSuccess: () => setConfirmMode(null),
  })

  const canGrant = isMultisigValid && heldRoles.length > 0 && !grantAll.isTransactionPending
  const canRenounce = heldRoles.length > 0 && !renounceAll.isTransactionPending

  const handleConfirm = useMemo(
    () => () => {
      if (confirmMode === "grant") {
        grantAll.sendTransaction()
      } else if (confirmMode === "renounce") {
        renounceAll.sendTransaction()
      }
    },
    [confirmMode, grantAll, renounceAll],
  )

  return (
    <Card.Root w="full">
      <Card.Header>
        <Heading size="3xl">{t("Migrate admin to multisig")}</Heading>
        <Text textStyle="sm">
          {t(
            "Discover all AccessControl roles held by the connected wallet across every VeBetterDAO contract, then grant them to a multisig in one transaction. After verifying the multisig has the roles, renounce them from this wallet.",
          )}
        </Text>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <Box>
            <Text textStyle="sm" color="text.muted">
              {t("Current admin")}
            </Text>
            <Text textStyle="md" fontWeight="semibold">
              {adminAddress ? humanAddress(adminAddress) : t("Not connected")}
            </Text>
          </Box>

          <Field.Root invalid={!!multisigAddress && !isMultisigValid}>
            <Field.Label>{t("Multisig destination address")}</Field.Label>
            <WalletAddressInput
              onAddressResolved={addr => setMultisigAddress(addr ?? "")}
              placeholder={t("0x... or vet.domain")}
            />
            {!!multisigAddress && compareAddresses(multisigAddress, adminAddress) && (
              <Field.ErrorText>{t("Destination must differ from the current admin")}</Field.ErrorText>
            )}
          </Field.Root>

          <Box>
            <Text textStyle="sm" fontWeight="semibold" mb={2}>
              {t("Roles held by current admin")}
            </Text>
            <DiscoveredRolesTable heldRoles={heldRoles} isLoading={isLoading} />
          </Box>

          <Stack gap={4} pt={2}>
            <Button
              colorPalette="green"
              loading={grantAll.isTransactionPending}
              disabled={!canGrant}
              onClick={() => setConfirmMode("grant")}>
              {t("Grant all roles to multisig")}
            </Button>

            <HStack
              p={3}
              borderWidth={1}
              borderRadius="md"
              borderStyle="dashed"
              align="start"
              colorPalette="orange"
              borderColor="colorPalette.500">
              <Icon as={UilInfoCircle} boxSize={5} />
              <Text textStyle="sm">
                {t(
                  "After the grant transaction confirms, verify the multisig holds the listed roles on a block explorer before renouncing.",
                )}
              </Text>
            </HStack>

            <Button
              colorPalette="red"
              loading={renounceAll.isTransactionPending}
              disabled={!canRenounce}
              onClick={() => setConfirmMode("renounce")}>
              <Icon as={UilExclamationTriangle} mr={1} />
              {t("Renounce all roles from current admin")}
            </Button>
          </Stack>
        </VStack>
      </Card.Body>

      <MigrationConfirmationModal
        open={confirmMode !== null}
        mode={confirmMode ?? "grant"}
        from={adminAddress}
        to={multisigAddress}
        heldRoles={heldRoles}
        onClose={() => setConfirmMode(null)}
        onConfirm={handleConfirm}
      />
    </Card.Root>
  )
}
