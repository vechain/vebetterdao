import {
  Button,
  Card,
  Collapsible,
  Flex,
  Heading,
  HStack,
  Icon,
  Separator,
  SimpleGrid,
  Skeleton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  LuCalendar,
  LuChevronDown,
  LuChevronRight,
  LuChevronUp,
  LuExternalLink,
  LuShield,
  LuUsers,
} from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useNavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"
import { DelegateModal } from "@/app/navigators/components/DelegateModal"
import { ManageDelegationModal } from "@/app/navigators/components/ManageDelegationModal"
import { AddressIcon } from "@/components/AddressIcon"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import Vot3Svg from "@/components/Icons/svg/vot3-icon.svg"

import { NavigatorCitizensModal } from "./NavigatorCitizensModal"
import { NavigatorGovernanceActivity } from "./NavigatorGovernanceActivity"
import { NavigatorStakeHistoryModal } from "./NavigatorStakeHistoryModal"

const formatter = getCompactFormatter(2)

export const NavigatorDetailContent = () => {
  const { t } = useTranslation()
  const params = useParams<{ address: string }>()
  const { account } = useWallet()
  const address = params?.address ?? ""
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isDelegateOpen, setIsDelegateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isCitizensOpen, setIsCitizensOpen] = useState(false)
  const [isStakeHistoryOpen, setIsStakeHistoryOpen] = useState(false)

  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(address)
  const { data: metadata, isLoading: metadataLoading } = useNavigatorMetadata(nav?.metadataURI)
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(address)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const { data: currentNavigator } = useGetNavigator(account?.address)

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 20, 10) : humanAddress(address, 10, 8)

  const stats = useMemo(
    () => [
      {
        id: "citizens",
        label: t("Citizens"),
        value: String(nav?.citizenCount ?? 0),
        icon: LuUsers,
        bg: "status.positive.subtle",
        color: "status.positive.primary",
      },
      {
        id: "delegated",
        label: t("Total Delegated"),
        value: `${formatter.format(Number(nav?.totalDelegatedFormatted ?? 0))} VOT3`,
        icon: Vot3Svg,
        bg: "status.info.subtle",
        color: "status.info.primary",
      },
      {
        id: "staked",
        label: t("Total Staked"),
        value: `${formatter.format(Number(nav?.stakeFormatted ?? 0))} B3TR`,
        icon: B3trSvg,
        bg: "status.warning.subtle",
        color: "status.warning.primary",
      },
      {
        id: "since",
        label: t("Since"),
        value: nav
          ? new Date(nav.registeredAt * 1000).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-",
        icon: LuCalendar,
        bg: "status.info.subtle",
        color: "status.info.primary",
      },
    ],
    [nav, t],
  )

  if (navLoading) {
    return (
      <VStack w="full" py={20}>
        <Spinner size="lg" />
      </VStack>
    )
  }

  if (!nav) {
    return (
      <VStack w="full" gap={4} align="stretch" px={{ base: 4, md: 0 }}>
        <PageBreadcrumb items={[{ label: t("Navigators"), href: "/navigators" }]} />
        <VStack w="full" py={20} gap={4}>
          <LuShield size={48} />
          <Text textStyle="md" color="fg.muted">
            {t("Navigator not found")}
          </Text>
        </VStack>
      </VStack>
    )
  }

  const isActive = nav.status === "ACTIVE"
  const currentDelegatedNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  const isDelegatedHere = currentNavigator?.toLowerCase() === address.toLowerCase() && currentDelegatedNum > 0

  return (
    <VStack w="full" gap={6} align="stretch" px={{ base: 4, md: 0 }}>
      <PageBreadcrumb
        items={[
          { label: t("Navigators"), href: "/navigators" },
          { label: domainData?.domain ? displayName : t("Overview"), href: `/navigators/${address}` },
        ]}
      />

      {/* Header */}
      <Card.Root variant="outline" borderRadius="xl">
        <Card.Body>
          <VStack gap={4} align="stretch">
            {/* Row 1: Avatar, name, status, delegate button */}
            <HStack gap={4} align="center" flexWrap="wrap">
              <AddressIcon address={address} boxSize={12} borderRadius="full" />
              <Skeleton loading={domainLoading}>
                <Heading size={{ base: "md", md: "lg" }}>{displayName}</Heading>
              </Skeleton>

              <HStack flex={1} justify="end">
                {account?.address && isDelegatedHere && (
                  <Button variant="secondary" size="sm" onClick={() => setIsManageOpen(true)}>
                    {t("Manage Delegation")}
                  </Button>
                )}
                {account?.address && isActive && !isDelegatedHere && (
                  <Button variant="primary" size="sm" onClick={() => setIsDelegateOpen(true)}>
                    {t("Delegate")}
                  </Button>
                )}
              </HStack>
            </HStack>

            {/* Description from metadata */}
            <Skeleton loading={metadataLoading}>
              <Text textStyle="sm" color="fg.muted">
                {metadata?.motivation || t("No description provided")}
              </Text>
            </Skeleton>

            {/* Address + socials */}
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              {metadata?.socials && (
                <HStack gap={3}>
                  {metadata.socials.twitter && (
                    <HStack gap={1} cursor="pointer" _hover={{ textDecoration: "underline" }}>
                      <Text textStyle="xs" color="fg.muted">
                        {"@"}
                        {metadata.socials.twitter}
                      </Text>
                      <LuExternalLink size={10} />
                    </HStack>
                  )}
                  {metadata.socials.website && (
                    <HStack gap={1} cursor="pointer" _hover={{ textDecoration: "underline" }}>
                      <Text textStyle="xs" color="fg.muted">
                        {metadata.socials.website}
                      </Text>
                      <LuExternalLink size={10} />
                    </HStack>
                  )}
                </HStack>
              )}
            </HStack>

            {/* Collapsible About section */}
            <Collapsible.Root open={isAboutOpen} onOpenChange={e => setIsAboutOpen(e.open)}>
              <Collapsible.Content>
                <VStack gap={4} align="stretch" pt={2}>
                  <Separator />

                  <Text textStyle="sm" fontWeight="semibold">
                    {t("Motivation")}
                  </Text>
                  <Skeleton loading={metadataLoading}>
                    <Text textStyle="sm">{metadata?.motivation || t("No motivation provided")}</Text>
                  </Skeleton>

                  <Separator />

                  <Text textStyle="sm" fontWeight="semibold">
                    {t("Qualifications")}
                  </Text>
                  <Skeleton loading={metadataLoading}>
                    <Text textStyle="sm">{metadata?.qualifications || t("No qualifications provided")}</Text>
                  </Skeleton>

                  {metadata?.votingStrategy && (
                    <>
                      <Separator />
                      <Text textStyle="sm" fontWeight="semibold">
                        {t("Voting Strategy")}
                      </Text>
                      <Text textStyle="sm">{metadata.votingStrategy}</Text>
                    </>
                  )}

                  {metadata?.disclosures && (
                    <>
                      <Separator />
                      <Text textStyle="sm" fontWeight="semibold">
                        {t("Disclosures")}
                      </Text>

                      <HStack justify="space-between">
                        <Text textStyle="sm" color="fg.muted">
                          {t("App affiliated")}
                        </Text>
                        <Text textStyle="sm" fontWeight="semibold">
                          {metadata.disclosures.isAppAffiliated
                            ? metadata.disclosures.affiliatedAppNames || t("Yes")
                            : t("No")}
                        </Text>
                      </HStack>

                      <HStack justify="space-between">
                        <Text textStyle="sm" color="fg.muted">
                          {t("Foundation member")}
                        </Text>
                        <Text textStyle="sm" fontWeight="semibold">
                          {metadata.disclosures.isFoundationMember
                            ? metadata.disclosures.foundationRole || t("Yes")
                            : t("No")}
                        </Text>
                      </HStack>

                      <HStack justify="space-between">
                        <Text textStyle="sm" color="fg.muted">
                          {t("Conflicts of interest")}
                        </Text>
                        <Text textStyle="sm" fontWeight="semibold">
                          {metadata.disclosures.hasConflictsOfInterest ? t("Yes") : t("No")}
                        </Text>
                      </HStack>

                      {metadata.disclosures.hasConflictsOfInterest && metadata.disclosures.conflictsDescription && (
                        <Text textStyle="xs" color="fg.muted">
                          {metadata.disclosures.conflictsDescription}
                        </Text>
                      )}
                    </>
                  )}
                </VStack>
              </Collapsible.Content>

              <Collapsible.Trigger asChild>
                <Button variant="plain" size="xs" w="full" mt={2} color="fg.muted">
                  {isAboutOpen ? t("Read less") : t("Read more")}
                  {isAboutOpen ? <LuChevronUp /> : <LuChevronDown />}
                </Button>
              </Collapsible.Trigger>
            </Collapsible.Root>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 2, md: 4 }} w="full">
        {stats.map(({ id, label, value, icon: IconComponent, bg, color }) => {
          const isClickable = id === "citizens" || id === "staked"
          const handleClick =
            id === "citizens"
              ? () => setIsCitizensOpen(true)
              : id === "staked"
                ? () => setIsStakeHistoryOpen(true)
                : undefined

          return (
            <Card.Root
              key={id}
              variant="outline"
              p={{ base: 2, md: 4 }}
              flexDirection={isClickable ? "row" : undefined}
              alignItems={isClickable ? "center" : undefined}
              cursor={isClickable ? "pointer" : undefined}
              _hover={isClickable ? { borderColor: "border.emphasized" } : undefined}
              onClick={handleClick}>
              <Card.Body flex={1}>
                <Flex direction="column" justify="space-between" h={{ base: "full", md: "auto" }} flex={1}>
                  <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle" mb={2}>
                    {label}
                  </Text>
                  <HStack gap={{ base: 2, md: 3 }}>
                    <HStack
                      justify="center"
                      align="center"
                      w={{ base: "7", md: "10" }}
                      h={{ base: "7", md: "10" }}
                      rounded="full"
                      bg={bg}
                      color={color}
                      flexShrink={0}>
                      <Icon as={IconComponent} boxSize={{ base: 4, md: 5 }} />
                    </HStack>
                    <Text textStyle={{ base: "md", md: "xl" }} fontWeight="bold">
                      {value}
                    </Text>
                  </HStack>
                </Flex>
              </Card.Body>
              {isClickable && (
                <Icon boxSize={{ base: "4", md: "5" }} color="text.subtle" flexShrink={0}>
                  <LuChevronRight />
                </Icon>
              )}
            </Card.Root>
          )
        })}
      </SimpleGrid>

      {/* Governance Activity */}
      <Heading size={{ base: "lg", md: "xl" }} fontWeight={"bold"}>
        {t("Activity")}
      </Heading>
      <NavigatorGovernanceActivity address={address} />

      {nav && (
        <>
          <DelegateModal isOpen={isDelegateOpen} onClose={() => setIsDelegateOpen(false)} navigator={nav} />
          <ManageDelegationModal isOpen={isManageOpen} onClose={() => setIsManageOpen(false)} navigator={nav} />
          <NavigatorCitizensModal isOpen={isCitizensOpen} onClose={() => setIsCitizensOpen(false)} address={address} />
          <NavigatorStakeHistoryModal
            isOpen={isStakeHistoryOpen}
            onClose={() => setIsStakeHistoryOpen(false)}
            address={address}
          />
        </>
      )}
    </VStack>
  )
}
