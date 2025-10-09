import { Alert, VStack } from "@chakra-ui/react"

import { useCurrentRoundActiveState } from "../../api/contracts/xAllocations/hooks/useCurrentRoundActiveState"

import { StartRoundButton } from "@/app/admin/components/StartRoundCard/components/StartRoundButton"

export const StartNewRoundAlert = () => {
  const { isCurrentRoundActive } = useCurrentRoundActiveState()
  if (isCurrentRoundActive) return null
  return (
    <Alert.Root status="error">
      <VStack
        direction={["column-reverse", "column-reverse", "row"]}
        align={["stretch", "stretch", "flex-start"]}
        gap={4}>
        <Alert.Title textStyle="xl" fontWeight="bold">
          {"The previous round has ended. Start a new round to continue voting."}
        </Alert.Title>
        <Alert.Description>
          <StartRoundButton redirectTo="/" />
        </Alert.Description>
      </VStack>
    </Alert.Root>
  )
}
