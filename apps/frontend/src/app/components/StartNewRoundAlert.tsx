import { Alert, VStack, Text } from "@chakra-ui/react"
import { StartRoundButton } from "@/app/admin/components/StartRoundCard/components/StartRoundButton"
import { useCurrentRoundActiveState } from "@/api"

export const StartNewRoundAlert = () => {
  const { isCurrentRoundActive } = useCurrentRoundActiveState()

  if (isCurrentRoundActive) return null

  return (
    <Alert.Root status="error" borderRadius="16px" bg="#FFF3E5" border="1px solid #AF5F00">
      <VStack
        direction={["column-reverse", "column-reverse", "row"]}
        align={["stretch", "stretch", "flex-start"]}
        gap={4}>
        <Text fontWeight="700" fontSize="16px" color="#AF5F00" as="span">
          {"The previous round has ended. Start a new round to continue voting."}
        </Text>
        <Alert.Description>
          <StartRoundButton redirectTo="/" />
        </Alert.Description>
      </VStack>
    </Alert.Root>
  )
}
