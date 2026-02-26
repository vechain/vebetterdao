import { Card, Heading, Skeleton, Text, VStack, Center, HStack, IconButton, useClipboard } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"
import { FaCopy, FaExternalLinkAlt, FaCheck } from "react-icons/fa"

import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { getExplorerAddressLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useCurrentAppRewardDistributors } from "../../../hooks/useCurrentAppRewardDistributors"

import { RewardStatisticsSection } from "./RewardStatisticsSection"

const DistributorItem = ({ distributor }: { distributor: string }) => {
  const { t } = useTranslation()
  const { data: vnsData } = useVechainDomain(distributor)
  const domain = vnsData?.domain
  const { copy, copied: isCopied } = useClipboard({
    value: distributor,
    timeout: 1000,
  })

  return (
    <HStack w="full" justify="space-between">
      <HStack gap={3}>
        <AddressIcon address={distributor} h="34px" w="34px" rounded="full" />
        <VStack align="stretch" gap={0}>
          {domain && (
            <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
              {domain}
            </Text>
          )}
          <HStack gap={1}>
            <Text textStyle="sm" color="text.subtle">
              {humanAddress(distributor, 10, 6)}
            </Text>
            <IconButton
              variant="ghost"
              size="2xs"
              color="text.subtle"
              aria-label={isCopied ? t("Address copied") : t("Copy address")}
              onClick={() => copy()}>
              {isCopied ? <FaCheck /> : <FaCopy />}
            </IconButton>
          </HStack>
        </VStack>
      </HStack>
      <IconButton color="text.subtle" variant="ghost" size="sm" aria-label={t("View on explorer")} asChild>
        <a href={getExplorerAddressLink(distributor)} target="_blank" rel="noopener noreferrer">
          <FaExternalLinkAlt />
        </a>
      </IconButton>
    </HStack>
  )
}

export const RewardDetailsModal = ({
  isOpen,
  onClose,
  distributionStrategy,
}: {
  isOpen: boolean
  onClose: () => void
  distributionStrategy: string
}) => {
  const { t } = useTranslation()
  const { app } = useCurrentAppInfo()
  const { distributors, isLoading: distributorsLoading } = useCurrentAppRewardDistributors()

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalProps={{ size: "4xl" }}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading size="2xl">{t("Reward Details")}</Heading>

        <Card.Root variant="primary" p={4} gap={4} w="full">
          <Card.Header p={0}>
            <Heading size="xl" alignSelf="flex-start">
              {t("Strategy")}
            </Heading>
          </Card.Header>

          <Card.Body p={0}>
            <Text textStyle="md" color="text.subtle" whiteSpace="pre-wrap">
              {distributionStrategy}
            </Text>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="primary" p={4} gap={4} w="full">
          <Card.Header p={0}>
            <Heading size="xl" alignSelf="flex-start">
              {t("All time statistics")}
            </Heading>
          </Card.Header>

          <Card.Body p={0}>
            <RewardStatisticsSection />
          </Card.Body>
        </Card.Root>

        {app?.teamWalletAddress && (
          <Card.Root variant="primary" p={4} gap={4} w="full">
            <Card.Header p={0}>
              <Heading size="xl" alignSelf="flex-start">
                {t("Treasury address")}
              </Heading>
            </Card.Header>

            <Card.Body p={0}>
              <Card.Root borderWidth={1} w="full" borderRadius="xl" p={3} bg="bg.surface">
                <DistributorItem distributor={app.teamWalletAddress} />
              </Card.Root>
            </Card.Body>
          </Card.Root>
        )}

        <Card.Root variant="primary" p={4} gap={4} w="full">
          <Card.Header p={0}>
            <Heading size="xl" alignSelf="flex-start">
              {t("Distributors")}
            </Heading>
          </Card.Header>

          <Card.Body p={0}>
            <Skeleton loading={distributorsLoading} w="full">
              {distributors && distributors.length > 0 ? (
                <VStack align="stretch" w="full" gap={2}>
                  {distributors.map((distributor: string) => (
                    <Card.Root key={distributor} borderWidth={1} w="full" borderRadius="xl" p={3} bg="bg.surface">
                      <DistributorItem distributor={distributor} />
                    </Card.Root>
                  ))}
                </VStack>
              ) : (
                <Center w="full" py={8}>
                  <Text textStyle="sm" color="text.subtle">
                    {t("No reward distributors configured")}
                  </Text>
                </Center>
              )}
            </Skeleton>
          </Card.Body>
        </Card.Root>
      </VStack>
    </BaseModal>
  )
}
