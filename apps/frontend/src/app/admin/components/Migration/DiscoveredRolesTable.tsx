import { Badge, Box, HStack, Spinner, Stack, Table, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { HeldRole } from "./hooks/useDiscoverHeldRoles"

type Props = {
  heldRoles: HeldRole[]
  isLoading: boolean
}

export const DiscoveredRolesTable = ({ heldRoles, isLoading }: Props) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <HStack p={6} justify="center">
        <Spinner size="sm" />
        <Text textStyle="sm">{t("Scanning all VeBetterDAO contracts...")}</Text>
      </HStack>
    )
  }

  if (heldRoles.length === 0) {
    return (
      <Box p={6} borderWidth={1} borderRadius="md" borderStyle="dashed">
        <Text textStyle="sm" textAlign="center">
          {t("No AccessControl roles found for this address.")}
        </Text>
      </Box>
    )
  }

  const grouped = heldRoles.reduce<Record<string, HeldRole[]>>((acc, role) => {
    if (!acc[role.contractName]) acc[role.contractName] = []
    acc[role.contractName]!.push(role)
    return acc
  }, {})

  return (
    <VStack align="stretch" gap={3} w="full">
      <HStack justify="space-between">
        <Text textStyle="sm" fontWeight="semibold">
          {t("{{count}} roles across {{contracts}} contracts", {
            count: heldRoles.length,
            contracts: Object.keys(grouped).length,
          })}
        </Text>
      </HStack>
      <Box maxH={{ base: "320px", md: "420px" }} overflowY="auto" borderWidth={1} borderRadius="md">
        <Table.Root size="sm">
          <Table.Header position="sticky" top={0} bg="bg.default" zIndex={1}>
            <Table.Row>
              <Table.ColumnHeader>{t("Contract")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("Role")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {Object.entries(grouped).map(([contractName, roles]) =>
              roles.map((r, i) => (
                <Table.Row key={`${contractName}-${r.role}`}>
                  <Table.Cell>{i === 0 ? <Stack gap={0}>{contractName}</Stack> : ""}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={r.role === "DEFAULT_ADMIN_ROLE" ? "red" : "gray"} textTransform="none">
                      {r.role}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              )),
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </VStack>
  )
}
