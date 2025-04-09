import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Text,
  Button,
  useDisclosure,
  Collapse,
  Code,
} from "@chakra-ui/react"
import { UilArrowUp, UilArrowDown } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export function VerificationResult({
  status,
  title,
  description,
  result,
}: {
  status: "success" | "error"
  title: string
  description: string
  result: string | undefined
}) {
  const { isOpen, onToggle } = useDisclosure()
  const { t } = useTranslation()
  // Format the result as JSON if it's an object
  const formattedResult = typeof result === "object" ? JSON.stringify(result, null, 2) : result

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

        {result && (
          <Box mt={2}>
            <Button
              p={0}
              size="sm"
              variant="ghost"
              onClick={onToggle}
              rightIcon={isOpen ? <UilArrowUp /> : <UilArrowDown />}
              color={status === "success" ? "white" : "gray.600"}
              _hover={{
                bg: status === "success" ? "green.600" : "gray.100",
              }}>
              {isOpen ? "Hide Details" : "Show Details"}
            </Button>

            <Collapse in={isOpen} animateOpacity>
              <Box mt={2} borderRadius="md" bg={status === "success" ? "green.600" : "gray.50"} overflowX="auto">
                <Text fontSize="xs" mb={1} fontWeight="bold" color={status === "success" ? "white" : "gray.600"}>
                  {t("API Response:")}
                </Text>
                <Code
                  display="block"
                  whiteSpace="pre"
                  p={2}
                  borderRadius="md"
                  bg={status === "success" ? "green.700" : "gray.100"}
                  color={status === "success" ? "white" : "black"}
                  fontSize="xs">
                  {formattedResult}
                </Code>
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </Alert>
  )
}
