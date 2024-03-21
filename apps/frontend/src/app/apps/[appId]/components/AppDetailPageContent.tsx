import { VStack } from "@chakra-ui/react"
import { AppDetailCard } from "./AppDetailCard"

type Props = {
  appId: string
}

export const AppDetailPageContent = ({ appId }: Props) => {
  return (
    <VStack w="full" spacing={8} align="flex-start" data-testid={`app-${appId}-detail`}>
      <AppDetailCard appId={appId} />
    </VStack>
  )
}
