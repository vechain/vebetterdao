import {
  Card,
  Heading,
  Skeleton,
  Text,
  VStack,
  Center,
  HStack,
  IconButton,
  Link,
  Popover,
  Portal,
  SimpleGrid,
  useClipboard,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaCopy, FaExternalLinkAlt, FaCheck } from "react-icons/fa"
import { HiDotsVertical } from "react-icons/hi"

import { useAppActionOverview } from "@/api/indexer/actions/useAppActionOverview"
import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { getExplorerAddressLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useCurrentAppRewardDistributors } from "../../../hooks/useCurrentAppRewardDistributors"

const DistributorItemWithMenu = ({ distributor }: { distributor: string }) => {
  const { t } = useTranslation()
  const { data: vnsData } = useVechainDomain(distributor)
  const domain = vnsData?.domain
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const { copy, copied: isCopied } = useClipboard({
    value: distributor,
    timeout: 1000,
  })

  const handleCopyAddress = () => {
    copy()
    setTimeout(() => {
      setIsPopoverOpen(false)
    }, 1000)
  }

  const handleViewOnExplorer = () => {
    setIsPopoverOpen(false)
  }

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
          <Text textStyle="sm" color="text.subtle">
            {humanAddress(distributor, 10, 6)}
          </Text>
        </VStack>
      </HStack>
      <Popover.Root
        positioning={{
          placement: "bottom-end",
        }}
        open={isPopoverOpen}
        onOpenChange={details => setIsPopoverOpen(details.open)}>
        <Popover.Trigger asChild>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={t("Options")}
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
            <HiDotsVertical />
          </IconButton>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content width="auto" boxShadow="md" border="1px solid #EFEFEF">
              <Popover.Body p={2}>
                <VStack alignItems="stretch" gap={3}>
                  <HStack onClick={handleCopyAddress} cursor="pointer">
                    {isCopied ? <FaCheck /> : <FaCopy />}
                    <Text whiteSpace="nowrap" textStyle={["sm", "md"]}>
                      {isCopied ? t("Address copied") : t("Copy address")}
                    </Text>
                  </HStack>
                  <Link
                    href={getExplorerAddressLink(distributor)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleViewOnExplorer}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    textStyle={["sm", "md"]}
                    fontWeight="normal"
                    color="inherit"
                    _hover={{ textDecoration: "none" }}
                    _focus={{ boxShadow: "none", outline: "none" }}
                    _active={{ boxShadow: "none" }}>
                    <FaExternalLinkAlt />
                    {t("View on explorer")}
                  </Link>
                </VStack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </HStack>
  )
}

export const DistributionStrategyModal = ({
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
  const { data: appOverview, isLoading: appOverviewLoading } = useAppActionOverview(app?.id ?? "", undefined, !!app?.id)

  const formattedStats = useMemo(() => {
    if (!appOverview) return null
    return {
      totalRewards: FormattingUtils.humanNumber(appOverview.totalRewardAmount ?? 0),
      actionsRewarded: FormattingUtils.humanNumber(appOverview.actionsRewarded ?? 0),
      uniqueUsers: FormattingUtils.humanNumber(appOverview.totalUniqueUserInteractions ?? 0),
    }
  }, [appOverview])

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalProps={{ size: "4xl" }}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading size="2xl">{t("Distribution Strategy")}</Heading>

        <Card.Root variant="primary" p={4} gap={4} w="full">
          <Card.Header p={0}>
            <Heading size="xl" alignSelf="flex-start">
              {t("Details")}
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
              {t("Reward Statistics")}
            </Heading>
          </Card.Header>

          <Card.Body p={0}>
            {appOverviewLoading ? (
              <SimpleGrid columns={[1, 2, 3]} gap={4} w="full">
                <VStack align="flex-start" gap={1}>
                  <Skeleton w="40%" h="16px" />
                  <Skeleton w="60%" h="32px" />
                </VStack>
                <VStack align="flex-start" gap={1}>
                  <Skeleton w="40%" h="16px" />
                  <Skeleton w="60%" h="32px" />
                </VStack>
                <VStack align="flex-start" gap={1}>
                  <Skeleton w="40%" h="16px" />
                  <Skeleton w="60%" h="32px" />
                </VStack>
              </SimpleGrid>
            ) : formattedStats ? (
              <SimpleGrid columns={[1, 2, 3]} gap={4} w="full">
                <VStack align="flex-start" gap={1}>
                  <Text textStyle="sm" color="text.subtle">
                    {t("Total B3TR Distributed")}
                  </Text>
                  <Heading size="xl" color="brand.primary">
                    {formattedStats.totalRewards}
                  </Heading>
                </VStack>
                <VStack align="flex-start" gap={1}>
                  <Text textStyle="sm" color="text.subtle">
                    {t("Actions Rewarded")}
                  </Text>
                  <Heading size="xl" color="brand.primary">
                    {formattedStats.actionsRewarded}
                  </Heading>
                </VStack>
                <VStack align="flex-start" gap={1}>
                  <Text textStyle="sm" color="text.subtle">
                    {t("Unique Users")}
                  </Text>
                  <Heading size="xl" color="brand.primary">
                    {formattedStats.uniqueUsers}
                  </Heading>
                </VStack>
              </SimpleGrid>
            ) : (
              <Center w="full" py={8}>
                <Text textStyle="sm" color="text.subtle">
                  {t("No statistics available")}
                </Text>
              </Center>
            )}
          </Card.Body>
        </Card.Root>

        <Card.Root variant="primary" p={4} gap={4} w="full">
          <Card.Header p={0}>
            <Heading size="xl" alignSelf="flex-start">
              {t("Reward Distributors")}
            </Heading>
          </Card.Header>

          <Card.Body p={0}>
            <Skeleton loading={distributorsLoading} w="full">
              {distributors && distributors.length > 0 ? (
                <VStack align="stretch" w="full" gap={2}>
                  {distributors.map((distributor: string) => (
                    <Card.Root
                      key={distributor}
                      borderWidth={1}
                      borderColor="gray.200"
                      w="full"
                      borderRadius="xl"
                      p={3}
                      bg="bg.surface">
                      <DistributorItemWithMenu distributor={distributor} />
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
