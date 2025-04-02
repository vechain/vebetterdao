import { BaseModal } from "@/components/BaseModal"
import { Box, Divider, Heading, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
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
      <VStack spacing={6} p={4}>
        <Box position="relative" p={4} bg="white" borderRadius="xl" boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)">
          <Image src={logo ?? ""} alt="app-logo" w="32" h="32" rounded="xl" objectFit="cover" />
        </Box>

        <VStack spacing={3}>
          <Heading
            fontSize={{
              base: "xl",
              md: "2xl",
            }}>
            {t("Distribution Strategy")}
          </Heading>

          <Text
            fontSize={{
              base: "md",
              md: "lg",
            }}
            color={"gray.600"}>
            {distributionStrategy}
          </Text>
          <Divider />
          <Skeleton isLoaded={!distributorsLoading} w="full">
            {distributors?.length > 0 ? (
              <VStack align="stretch" w="full">
                <Text fontSize="md" fontWeight={"500"}>
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
