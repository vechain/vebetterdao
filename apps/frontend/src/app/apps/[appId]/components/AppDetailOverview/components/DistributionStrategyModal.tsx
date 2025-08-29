import { BaseModal } from "@/components/BaseModal"
import { Box, Separator, Heading, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { DistributorItem } from "../../../admin/components/AdminAppPageContent/components/EditAppRewardDistributors/components/DistributorItem"
import { useCurrentAppRewardDistributors } from "../../../hooks/useCurrentAppRewardDistributors"
export const DistributionStrategyModal = ({
  isOpen,
  onClose,
  distributionStrategy,
  logo,
}: {
  isOpen: boolean
  onClose: () => void
  distributionStrategy: string
  logo: string
}) => {
  const { t } = useTranslation()
  const { distributors, isLoading: distributorsLoading } = useCurrentAppRewardDistributors()

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <VStack gap={6} p={4}>
        <Box position="relative" p={4} bg="white" borderRadius="xl" boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)">
          <Image src={logo ?? ""} alt="app-logo" w="32" h="32" rounded="xl" objectFit="cover" />
        </Box>

        <VStack gap={3}>
          <Heading
            textStyle={{
              base: "xl",
              md: "2xl",
            }}>
            {t("Distribution Strategy")}
          </Heading>

          <Text
            textStyle={{
              base: "md",
              md: "lg",
            }}
            color={"gray.600"}>
            {distributionStrategy}
          </Text>
          <Separator />
          <Skeleton loading={distributorsLoading} w="full">
            {distributors?.length > 0 ? (
              <VStack align="stretch" w="full">
                <Text textStyle="md" fontWeight={"500"}>
                  {t("Reward distributors")}
                </Text>
                {distributors?.map((distributor: string) => (
                  <HStack key={distributor} borderWidth={1} borderColor="gray.200" w="full" borderRadius="xl" p={2}>
                    <DistributorItem distributor={distributor} />
                  </HStack>
                ))}
              </VStack>
            ) : null}
          </Skeleton>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
