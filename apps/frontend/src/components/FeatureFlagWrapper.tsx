import { Text, VStack } from "@chakra-ui/react"
import { ReactNode } from "react"

import { FeatureFlag } from "../constants/featureFlag"
import { useFeatureFlag } from "../hooks/useFeatureFlag"

interface Props {
  feature: FeatureFlag
  children: ReactNode
  fallback?: ReactNode
}
export const FeatureFlagWrapper = ({ feature, children, fallback }: Props) => {
  const { isEnabled, comingSoonText } = useFeatureFlag(feature)
  if (isEnabled) {
    return <>{children}</>
  }
  if (fallback) {
    return <>{fallback}</>
  }
  return (
    <VStack w="full" p={4} bg="gray.50" borderRadius="xl" border="1px dashed" borderColor="gray.200" opacity={0.7}>
      <Text color="gray.600" textStyle="sm">
        {comingSoonText}
      </Text>
    </VStack>
  )
}
