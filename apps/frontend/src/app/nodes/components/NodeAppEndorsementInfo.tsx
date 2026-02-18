import { Text, VStack, SimpleGrid } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { UserNode } from "@/api/contracts/xNodes/useGetUserNodes"

type Props = {
  node: UserNode | null
  currentPoints: bigint
}

export const NodeAppEndorsementInfo = ({ node, currentPoints }: Props) => {
  const { t } = useTranslation()

  if (!node) return null

  return (
    <SimpleGrid columns={{ base: 1, md: currentPoints > BigInt(0) ? 3 : 2 }} gap={3} w="full">
      <VStack flex={1} bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
        <Text textStyle="md" color="text.subtle">
          {t("Node")}
        </Text>
        <Text textStyle="md" fontWeight="semibold">
          {node.metadata?.name} {" #"}
          {node.id.toString()}
        </Text>
      </VStack>
      <VStack bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
        <Text textStyle="md" color="text.subtle">
          {t("Available points")}
        </Text>
        <Text textStyle="md" fontWeight="semibold">
          {node.availablePoints.toString()} {t("pts")}
        </Text>
      </VStack>
      {currentPoints > BigInt(0) && (
        <VStack bg="bg.subtle" p={3} rounded="xl" justify="start" align="start">
          <Text textStyle="md" color="text.subtle">
            {t("Current endorsement")}
          </Text>
          <Text textStyle="md" fontWeight="semibold">
            {currentPoints.toString()} {t("pts")}
          </Text>
        </VStack>
      )}
    </SimpleGrid>
  )
}
