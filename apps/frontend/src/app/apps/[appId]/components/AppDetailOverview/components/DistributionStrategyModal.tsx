import { BaseModal } from "@/components/BaseModal"
import { Box, Heading, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

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
        </VStack>
      </VStack>
    </BaseModal>
  )
}
