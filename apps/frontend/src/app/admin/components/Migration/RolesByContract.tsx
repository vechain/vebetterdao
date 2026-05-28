import { Badge, Box, Button, Collapsible, HStack, Icon, Spinner, Text, VStack, Wrap } from "@chakra-ui/react"
import { UilAngleDown, UilAngleUp } from "@iconscout/react-unicons"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { HeldRole } from "./hooks/useDiscoverHeldRoles"

type Props = {
  heldRoles: HeldRole[]
  isLoading: boolean
  emptyText?: string
  /** start with all contracts expanded */
  defaultExpanded?: boolean
}

export const RolesByContract = ({ heldRoles, isLoading, emptyText, defaultExpanded = false }: Props) => {
  const { t } = useTranslation()

  const grouped = useMemo(() => {
    const acc: Record<string, { address: string; roles: string[] }> = {}
    for (const r of heldRoles) {
      if (!acc[r.contractName]) acc[r.contractName] = { address: r.contractAddress, roles: [] }
      acc[r.contractName]!.roles.push(r.role)
    }
    return acc
  }, [heldRoles])

  const contractNames = useMemo(() => Object.keys(grouped), [grouped])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded ? contractNames : []))

  const allExpanded = contractNames.length > 0 && contractNames.every(n => expanded.has(n))

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleAll = () => {
    setExpanded(allExpanded ? new Set() : new Set(contractNames))
  }

  if (isLoading) {
    return (
      <HStack gap={2}>
        <Spinner size="sm" />
        <Text textStyle="sm">{t("Scanning all VeBetterDAO contracts...")}</Text>
      </HStack>
    )
  }

  if (heldRoles.length === 0) {
    return (
      <Text textStyle="sm" color="text.muted">
        {emptyText ?? t("No AccessControl roles found for this address.")}
      </Text>
    )
  }

  return (
    <VStack gap={2} alignItems="stretch" w="full">
      <HStack justify="flex-end">
        <Button size="xs" variant="ghost" onClick={toggleAll}>
          {allExpanded ? t("Collapse all") : t("Expand all")}
        </Button>
      </HStack>

      <VStack gap={2} alignItems="stretch" w="full">
        {Object.entries(grouped).map(([contractName, { address, roles }]) => {
          const isOpen = expanded.has(contractName)
          const hasAdmin = roles.includes("DEFAULT_ADMIN_ROLE")
          return (
            <Box key={contractName} borderWidth={1} borderRadius="md">
              <Collapsible.Root open={isOpen} onOpenChange={() => toggle(contractName)}>
                <HStack
                  onClick={() => toggle(contractName)}
                  justify="space-between"
                  gap={3}
                  p={3}
                  cursor="pointer"
                  _hover={{ bg: "bg.muted" }}>
                  <HStack gap={2} flex={1} minW={0}>
                    <Icon as={isOpen ? UilAngleUp : UilAngleDown} boxSize={5} flexShrink={0} />
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
                    {humanAddress(address)}
                  </Text>
                </HStack>
                <Collapsible.Content>
                  <Box px={3} pb={3} pt={1}>
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
                  </Box>
                </Collapsible.Content>
              </Collapsible.Root>
            </Box>
          )
        })}
      </VStack>
    </VStack>
  )
}
