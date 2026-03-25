"use client"

import { Card, VStack, HStack, Text, Icon, Input, Button, Box, Spinner } from "@chakra-ui/react"
import { Check, Heart, InfoCircle, Search, Xmark } from "iconoir-react"
import { useMemo, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { usePreferredRelayer } from "@/api/contracts/relayerRewardsPool/hooks/usePreferredRelayer"
import { useRegisteredRelayers } from "@/api/contracts/relayerRewardsPool/hooks/useRegisteredRelayers"
import { AddressIcon } from "@/components/AddressIcon"
import { useGetVetDomains } from "@/hooks/useGetVetDomains"

interface PreferredRelayerSectionProps {
  selectedRelayer: string | undefined
  onSelectRelayer: (address: string | undefined) => void
}

export const PreferredRelayerSection = ({ selectedRelayer, onSelectRelayer }: PreferredRelayerSectionProps) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: currentPreferred, isLoading: isLoadingPreferred } = usePreferredRelayer()
  const { data: relayers = [], isLoading: isLoadingRelayers } = useRegisteredRelayers()

  // Resolve VET domains for all relayers
  const { data: domainNames } = useGetVetDomains(relayers)

  // Build display-friendly list: address + domain name
  const relayerList = useMemo(() => {
    return relayers.map((address, i) => ({
      address,
      name: domainNames?.[i] ?? undefined,
      displayName: domainNames?.[i] ?? `${address.slice(0, 6)}...${address.slice(-4)}`,
    }))
  }, [relayers, domainNames])

  // Filter relayers by search query (address or domain name)
  const filteredRelayers = useMemo(() => {
    if (!searchQuery.trim()) return relayerList
    const q = searchQuery.toLowerCase()
    return relayerList.filter(r => r.address.toLowerCase().includes(q) || (r.name && r.name.toLowerCase().includes(q)))
  }, [relayerList, searchQuery])

  const activeRelayer = selectedRelayer ?? currentPreferred
  const hasChanged = selectedRelayer !== undefined && selectedRelayer !== (currentPreferred ?? "")

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
    setSearchQuery("")
  }, [])

  const handleSelect = useCallback(
    (address: string) => {
      onSelectRelayer(address)
      setIsExpanded(false)
      setSearchQuery("")
    },
    [onSelectRelayer],
  )

  const handleRemove = useCallback(() => {
    // Setting to zero address means "clear preference"
    onSelectRelayer("0x0000000000000000000000000000000000000000")
    setIsExpanded(false)
  }, [onSelectRelayer])

  if (isLoadingPreferred) return null

  // Find display name for the active relayer
  const activeRelayerDisplay = relayerList.find(r => r.address === activeRelayer)

  return (
    <Card.Root
      variant="outline"
      p={{ base: "3", md: "4" }}
      border="sm"
      borderColor="border.secondary"
      bg="cards.default">
      <VStack gap={{ base: "3", md: "4" }} w="full" alignItems="stretch">
        {/* Header */}
        <HStack justify="space-between" alignItems="center" gap="2">
          <HStack gap={{ base: "2", md: "3" }} flex={1} alignItems="center">
            {activeRelayer && activeRelayer !== "0x0000000000000000000000000000000000000000" ? (
              <Box
                w={{ base: "8", md: "8" }}
                h={{ base: "8", md: "8" }}
                flexShrink={0}
                borderRadius="full"
                overflow="hidden">
                <AddressIcon address={activeRelayer} w="full" h="full" borderRadius="full" />
              </Box>
            ) : (
              <Box
                bg="status.neutral.subtle"
                borderRadius="4px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                w={{ base: "8", md: "8" }}
                h={{ base: "8", md: "8" }}
                flexShrink={0}>
                <Icon as={Heart} boxSize={{ base: "4", md: "5" }} color="text.subtle" />
              </Box>
            )}
            <VStack alignItems="flex-start" gap="0" flex={1} minW={0}>
              <Text textStyle="md" fontWeight="semibold" color="text.default">
                {t("Preferred relayer")}
              </Text>
              {activeRelayer && activeRelayer !== "0x0000000000000000000000000000000000000000" && !isExpanded && (
                <Text textStyle="xs" color="text.subtle" truncate>
                  {activeRelayerDisplay?.displayName ?? `${activeRelayer.slice(0, 6)}...${activeRelayer.slice(-4)}`}
                  {hasChanged && (
                    <Text as="span" color="text.warning" ml="1">
                      {"("}
                      {t("changed")}
                      {")"}
                    </Text>
                  )}
                </Text>
              )}
            </VStack>
          </HStack>
          <Button variant="ghost" size="sm" onClick={handleToggleExpand} color="text.subtle" fontWeight="medium">
            {isExpanded
              ? t("Cancel")
              : activeRelayer && activeRelayer !== "0x0000000000000000000000000000000000000000"
                ? t("Change")
                : t("Choose")}
          </Button>
        </HStack>

        {/* Explanation text - shown when no relayer is selected and not expanded */}
        {!activeRelayer && !isExpanded && (
          <HStack gap="2" alignItems="flex-start">
            <Icon as={InfoCircle} boxSize="4" color="text.subtle" mt="0.5" />
            <Text textStyle="xs" color="text.subtle">
              {t("Optionally choose a preferred relayer to prioritize for handling your votes and reward claims.")}
            </Text>
          </HStack>
        )}

        {/* Expanded: relayer selection */}
        {isExpanded && (
          <VStack gap="3" alignItems="stretch">
            <Text textStyle="xs" color="text.subtle">
              {t(
                "Choose a relayer to prioritize for your votes and claims. During the early access window, only your preferred relayer will handle your transactions.",
              )}
            </Text>

            {/* Search input */}
            <HStack bg="bg.secondary" borderRadius="md" px="3" py="2" border="sm" borderColor="border.secondary">
              <Icon as={Search} boxSize="4" color="text.subtle" />
              <Input
                variant="flushed"
                placeholder={t("Search by name or address...")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                size="sm"
                border="none"
                _focus={{ boxShadow: "none" }}
              />
            </HStack>

            {/* Relayer list */}
            <VStack
              gap="1"
              alignItems="stretch"
              maxH="200px"
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": {
                  background: "var(--chakra-colors-border-secondary)",
                  borderRadius: "4px",
                },
              }}>
              {isLoadingRelayers ? (
                <HStack justify="center" py="4">
                  <Spinner size="sm" />
                </HStack>
              ) : filteredRelayers.length === 0 ? (
                <Text textStyle="xs" color="text.subtle" textAlign="center" py="3">
                  {t("No relayers found")}
                </Text>
              ) : (
                filteredRelayers.map(relayer => {
                  const isSelected = relayer.address === activeRelayer
                  return (
                    <HStack
                      key={relayer.address}
                      px="3"
                      py="2"
                      borderRadius="md"
                      cursor="pointer"
                      bg={isSelected ? "status.success.subtle" : "transparent"}
                      _hover={{ bg: isSelected ? "status.success.subtle" : "bg.secondary" }}
                      onClick={() => handleSelect(relayer.address)}
                      justify="space-between">
                      <HStack gap="2" flex={1} minW={0}>
                        <Box w="7" h="7" flexShrink={0} borderRadius="full" overflow="hidden">
                          <AddressIcon address={relayer.address} w="full" h="full" borderRadius="full" />
                        </Box>
                        <VStack alignItems="flex-start" gap="0" flex={1} minW={0}>
                          <Text textStyle="sm" fontWeight={relayer.name ? "semibold" : "normal"} truncate>
                            {relayer.name ?? `${relayer.address.slice(0, 10)}...${relayer.address.slice(-6)}`}
                          </Text>
                          {relayer.name && (
                            <Text textStyle="xs" color="text.subtle" truncate>
                              {`${relayer.address.slice(0, 10)}...${relayer.address.slice(-6)}`}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                      {isSelected && <Icon as={Check} boxSize="4" color="status.success.default" />}
                    </HStack>
                  )
                })
              )}
            </VStack>

            {/* Remove preference button if one is currently set */}
            {currentPreferred && (
              <Button variant="ghost" size="sm" onClick={handleRemove} color="text.subtle" w="full">
                <Icon as={Xmark} boxSize="4" />
                {t("Remove preference")}
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    </Card.Root>
  )
}
