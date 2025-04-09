import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Text } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"

export function AppealWarning({
  walletAddress,
  title,
  description,
  isVerified,
}: {
  walletAddress?: string
  title: string
  description: string
  isVerified: boolean
}) {
  return (
    <Alert status="warning" borderRadius="16px" bg={isVerified ? "green.600" : "#FFF3E5"}>
      <AlertIcon alignSelf="flex-start" color={isVerified ? "white" : "orange.800"} />
      <Box>
        <AlertTitle fontSize="md" color={isVerified ? "white" : "orange.800"}>
          {title}
        </AlertTitle>
        <AlertDescription fontSize="sm" color={isVerified ? "white" : "orange.600"}>
          {description}
        </AlertDescription>
        {walletAddress && (
          <Text
            fontSize="sm"
            mt={2}
            fontFamily={"mono"}
            color={"black"}
            bg={isVerified ? "green.200" : "orange.200"}
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
