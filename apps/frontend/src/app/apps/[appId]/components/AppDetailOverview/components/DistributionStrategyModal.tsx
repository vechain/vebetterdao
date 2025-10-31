import { Card, Heading, Skeleton, Text, VStack, Center } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"

import { DistributorItem } from "../../../admin/components/AdminAppPageContent/components/EditAppRewardDistributors/components/DistributorItem"
import { useCurrentAppRewardDistributors } from "../../../hooks/useCurrentAppRewardDistributors"

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
