import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { Alert, Box, Button, VStack, Code, Collapsible, useDisclosure, Text } from "@chakra-ui/react"
import { UilArrowUp, UilArrowDown } from "@iconscout/react-unicons"
import { ResetStatus } from "../types"
import { RESET_STATUS } from "../constants"

export const ResetingResult = ({
  resetingStatus,
  apiResponse,
}: {
  resetingStatus: ResetStatus
  apiResponse: string | undefined
}) => {
  const router = useRouter()
  const { open: isOpen, onToggle } = useDisclosure()
  const { t } = useTranslation()

  return (
    <>
      {resetingStatus === RESET_STATUS.SUCCESS && (
        <VStack alignItems={"flex-start"} gap={2} mt={2}>
          <Button variant="primary" w="auto" onClick={() => router.push("/")}>
            {t("Back to Dashboard")}
          </Button>
        </VStack>
      )}

      {resetingStatus === RESET_STATUS.ERROR && (
        <VStack align="stretch" gap={2}>
          <Alert.Root status="error" size="md" borderRadius="16px">
            <Alert.Indicator w={4} h={4} color="error.primary" />
            <Box textStyle="md" color="error.primary">
              <Alert.Title>
                {t("Unable to process request. Try refreshing or contact support.")}{" "}
                <Button
                  p={0}
                  ml={2}
                  size="sm"
                  variant="ghost"
                  onClick={onToggle}
                  color={"black"}
                  _hover={{ color: "black" }}>
                  {t("Show Details")}

                  {isOpen ? <UilArrowUp /> : <UilArrowDown />}
                </Button>
              </Alert.Title>

              <Collapsible.Root open={isOpen}>
                <Collapsible.Content mt={2} borderRadius="md" bg={"gray.50"} overflowX="auto">
                  <Text textStyle="xs" p={2} fontWeight="bold" color={"gray.600"}>
                    {t("Error Details")}
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    p={2}
                    borderRadius="md"
                    bg={"gray.100"}
                    color={"black"}
                    textStyle="xs">
                    {apiResponse}
                  </Code>
                </Collapsible.Content>
              </Collapsible.Root>
            </Box>
          </Alert.Root>
        </VStack>
      )}
    </>
  )
}
