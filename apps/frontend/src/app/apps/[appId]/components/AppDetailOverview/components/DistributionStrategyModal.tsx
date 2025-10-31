import { Card, Heading, Skeleton, Text, VStack, Center, HStack, Box, Popover, Portal } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FaCopy, FaExternalLinkAlt, FaCheck } from "react-icons/fa"
import { HiDotsVertical } from "react-icons/hi"

import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { getExplorerAddressLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { useCurrentAppRewardDistributors } from "../../../hooks/useCurrentAppRewardDistributors"

const DistributorItemWithMenu = ({ distributor }: { distributor: string }) => {
  const { t } = useTranslation()
  const { data: vnsData } = useVechainDomain(distributor)
  const domain = vnsData?.domain
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(distributor)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
      setIsPopoverOpen(false)
    }, 1000)
  }

  const handleViewOnExplorer = () => {
    setIsPopoverOpen(false)
    window.open(getExplorerAddressLink(distributor), "_blank", "noopener,noreferrer")
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
        <Popover.Trigger>
          <Box as="button" onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
            <HiDotsVertical />
          </Box>
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
                  <HStack onClick={handleViewOnExplorer} cursor="pointer">
                    <FaExternalLinkAlt />
                    <Text whiteSpace="nowrap" textStyle={["sm", "md"]}>
                      {t("View on explorer")}
                    </Text>
                  </HStack>
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
  const { distributors, isLoading: distributorsLoading } = useCurrentAppRewardDistributors()
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalProps={{ size: "3xl" }}>
      <VStack gap={6} align="flex-start" w="full">
        <Heading size="2xl">{t("Distribution Strategy")}</Heading>

        <Card.Root variant="primary" p={4} gap={4} w="full">
          <Card.Header p={0}>
            <Heading size="xl" alignSelf="flex-start">
              {t("Details")}
            </Heading>
          </Card.Header>

          <Card.Body p={0}>
            <Text textStyle="md" color="text.subtle" lineHeight="tall">
              {distributionStrategy}
            </Text>
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
