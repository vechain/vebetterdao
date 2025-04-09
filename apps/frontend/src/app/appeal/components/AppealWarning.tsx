import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Text } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"

export function AppealWarning({
  walletAddress,
  title,
  description,
}: {
  walletAddress?: string
  title: string
  description: string
}) {
  return (
    <Alert status="warning" borderRadius="16px" bg="#FFF3E5">
      <AlertIcon alignSelf="flex-start" />
      <Box>
        <AlertTitle fontSize="md" color="orange.800">
          {title}
        </AlertTitle>
        <AlertDescription fontSize="sm" color="orange.600">
          {description}
        </AlertDescription>
        {walletAddress && (
          <Text
            fontSize="sm"
            mt={2}
            fontFamily={"mono"}
            color="black"
            bg="orange.200"
            w="fit-content"
            p={1}
            borderRadius={4}>
            {humanAddress(walletAddress)}
          </Text>
        )}
      </Box>
    </Alert>
  )
}
