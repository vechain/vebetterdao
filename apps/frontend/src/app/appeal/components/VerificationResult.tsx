import { Alert, AlertIcon, AlertTitle, AlertDescription, Box } from "@chakra-ui/react"

export function VerificationResult({
  status,
  title,
  description,
}: {
  status: "success" | "error"
  title: string
  description: string
}) {
  return (
    <Alert
      status={status}
      borderRadius="16px"
      variant={status === "success" ? "solid" : "subtle"}
      bg={status === "error" ? "#FCEEF1" : undefined}>
      <AlertIcon alignSelf="flex-start" mt="3px" />
      <Box>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Box>
    </Alert>
  )
}
