import {
  Badge,
  Button,
  Card,
  Heading,
  HStack,
  Separator,
  Skeleton,
  Spinner,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { LuArrowLeft, LuExternalLink, LuShield, LuUsers } from "react-icons/lu"

import { useNavigatorMetadata } from "@/api/indexer/navigators/useNavigatorMetadata"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { AddressButton } from "@/components/AddressButton"
import { AddressIcon } from "@/components/AddressIcon"

import { NavigatorGovernanceTab } from "./NavigatorGovernanceTab"

const formatter = getCompactFormatter(2)

export const NavigatorDetailContent = () => {
  const params = useParams<{ address: string }>()
  const router = useRouter()
  const { account } = useWallet()
  const address = params?.address ?? ""
  const [tab, setTab] = useState("about")

  const { data: nav, isLoading: navLoading } = useNavigatorByAddress(address)
  const { data: metadata, isLoading: metadataLoading } = useNavigatorMetadata(nav?.metadataURI)
  const { data: domainData, isLoading: domainLoading } = useVechainDomain(address)

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 20, 10) : humanAddress(address, 10, 8)

  if (navLoading) {
    return (
      <VStack w="full" py={20}>
        <Spinner size="lg" />
      </VStack>
    )
  }

  if (!nav) {
    return (
      <VStack w="full" py={20} gap={4}>
        <LuShield size={48} />
        <Text textStyle="md" color="fg.muted">
          {"Navigator not found"}
        </Text>
        <Button variant="ghost" onClick={() => router.push("/navigators")}>
          <LuArrowLeft />
          {"Back to Navigators"}
        </Button>
      </VStack>
    )
  }

  const isActive = nav.status === "ACTIVE"

  return (
    <VStack w="full" gap={6} align="stretch" px={{ base: 4, md: 0 }}>
      <Button variant="ghost" size="sm" w="fit-content" onClick={() => router.push("/navigators")}>
        <LuArrowLeft />
        {"Back to Navigators"}
      </Button>

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
              <Badge colorPalette={isActive ? "green" : nav.status === "EXITING" ? "yellow" : "red"} size="sm">
                {nav.status}
              </Badge>
              <HStack flex={1} justify="end">
                {isActive && account?.address && (
                  <Button colorPalette="green" size="sm">
                    {"Delegate"}
                  </Button>
                )}
              </HStack>
            </HStack>

            {/* Row 2: Stats */}
            <HStack gap={{ base: 3, md: 6 }} flexWrap="wrap">
              <HStack gap={1}>
                <LuUsers size={14} />
                <Text textStyle="sm" fontWeight="semibold">
                  {nav.citizenCount}
                </Text>
                <Text textStyle="sm" color="fg.muted">
                  {"citizens"}
                </Text>
              </HStack>
              <Text textStyle="sm" color="fg.muted">
                {"·"}
              </Text>
              <HStack gap={1}>
                <Text textStyle="sm" fontWeight="semibold">
                  {formatter.format(Number(nav.stakeFormatted))}
                </Text>
                <Text textStyle="sm" color="fg.muted">
                  {"B3TR staked"}
                </Text>
              </HStack>
              <Text textStyle="sm" color="fg.muted">
                {"·"}
              </Text>
              <HStack gap={1}>
                <Text textStyle="sm" fontWeight="semibold">
                  {formatter.format(Number(nav.totalDelegatedFormatted))}
                </Text>
                <Text textStyle="sm" color="fg.muted">
                  {"VOT3 delegated"}
                </Text>
              </HStack>
              <Text textStyle="sm" color="fg.muted">
                {"·"}
              </Text>
              <Text textStyle="sm" color="fg.muted">
                {"Since "}
                {new Date(nav.registeredAt * 1000).toLocaleDateString()}
              </Text>
            </HStack>

            {/* Row 3: Description from metadata */}
            <Skeleton loading={metadataLoading}>
              <Text textStyle="sm" color="fg.muted">
                {metadata?.motivation || "No description provided"}
              </Text>
            </Skeleton>

            {/* Row 4: Address + socials */}
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <AddressButton address={address} size="xs" showAddressIcon={false} />
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
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Tabs */}
      <Tabs.Root
        variant="line"
        size={{ base: "md", md: "lg" }}
        w="full"
        value={tab}
        onValueChange={d => setTab(d.value)}
        lazyMount>
        <Tabs.List>
          <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="about">
            {"About"}
          </Tabs.Trigger>
          <Tabs.Trigger flex={{ base: 1, md: "unset" }} justifyContent="center" value="governance">
            {"Governance Activity"}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="about">
          <VStack gap={6} align="stretch" pt={4}>
            {/* Motivation & Qualifications */}
            <Card.Root variant="primary" w="full">
              <Card.Body>
                <VStack gap={4} align="stretch">
                  <Card.Title textStyle="xl">{"Motivation"}</Card.Title>
                  <Skeleton loading={metadataLoading}>
                    <Text textStyle="sm">{metadata?.motivation || "No motivation provided"}</Text>
                  </Skeleton>

                  <Separator />

                  <Card.Title textStyle="xl">{"Qualifications"}</Card.Title>
                  <Skeleton loading={metadataLoading}>
                    <Text textStyle="sm">{metadata?.qualifications || "No qualifications provided"}</Text>
                  </Skeleton>

                  {metadata?.votingStrategy && (
                    <>
                      <Separator />
                      <Card.Title textStyle="xl">{"Voting Strategy"}</Card.Title>
                      <Text textStyle="sm">{metadata.votingStrategy}</Text>
                    </>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Disclosures */}
            {metadata?.disclosures && (
              <Card.Root variant="primary" w="full">
                <Card.Body>
                  <VStack gap={3} align="stretch">
                    <Card.Title textStyle="xl">{"Disclosures"}</Card.Title>

                    <HStack justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        {"App affiliated"}
                      </Text>
                      <Text textStyle="sm" fontWeight="semibold">
                        {metadata.disclosures.isAppAffiliated ? metadata.disclosures.affiliatedAppNames || "Yes" : "No"}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        {"Foundation member"}
                      </Text>
                      <Text textStyle="sm" fontWeight="semibold">
                        {metadata.disclosures.isFoundationMember ? metadata.disclosures.foundationRole || "Yes" : "No"}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        {"Conflicts of interest"}
                      </Text>
                      <Text textStyle="sm" fontWeight="semibold">
                        {metadata.disclosures.hasConflictsOfInterest ? "Yes" : "No"}
                      </Text>
                    </HStack>

                    {metadata.disclosures.hasConflictsOfInterest && metadata.disclosures.conflictsDescription && (
                      <Text textStyle="xs" color="fg.muted">
                        {metadata.disclosures.conflictsDescription}
                      </Text>
                    )}

                    {metadata.disclosures.previousDaoExperience && (
                      <>
                        <Separator />
                        <Card.Title textStyle="xl">{"Previous DAO Experience"}</Card.Title>
                        <Text textStyle="sm">{metadata.disclosures.previousDaoExperience}</Text>
                      </>
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>
            )}
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="governance">
          <VStack pt={4} align="stretch">
            <NavigatorGovernanceTab address={address} />
          </VStack>
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}
