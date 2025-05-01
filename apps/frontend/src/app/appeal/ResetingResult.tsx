import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import {
  AlertTitle,
  Box,
  AlertIcon,
  Alert,
  Button,
  VStack,
  Code,
  Collapse,
  useDisclosure,
  Text,
} from "@chakra-ui/react"
import { UilArrowUp, UilArrowDown } from "@iconscout/react-unicons"

export const ResetingResult = ({
  resetingStatus,
  apiResponse,
}: {
  resetingStatus: "idle" | "pending" | "success" | "error"
  apiResponse: string | undefined
}) => {
  const router = useRouter()
  const { isOpen, onToggle } = useDisclosure()
  const { t } = useTranslation()

  return (
    <>
      {resetingStatus === "success" && (
        <VStack align="stretch" gap={2}>
          <Button variant="primaryAction" w="auto" onClick={() => router.push("/")}>
            {"Back to the home page"}
          </Button>
        </VStack>
      )}

      {resetingStatus === "error" && (
        <VStack align="stretch" gap={2}>
          <Alert status="error" size="md" borderRadius="16px">
            <AlertIcon w={4} h={4} color="#C84968" />
            <Box lineHeight={"1.20rem"} fontSize="md" color="#C84968">
              <AlertTitle>
                {`Unable to process request. Try refreshing or contact support.`}{" "}
                <Button
                  p={0}
                  ml={2}
                  size="sm"
                  variant="ghost"
                  onClick={onToggle}
                  rightIcon={isOpen ? <UilArrowUp /> : <UilArrowDown />}
                  color={"black"}
                  _hover={{ color: "black" }}>
                  {t("Show Details")}
                </Button>
              </AlertTitle>

              <Collapse in={isOpen} animateOpacity>
                <Box mt={2} borderRadius="md" bg={"gray.50"} overflowX="auto">
                  <Text fontSize="xs" p={2} fontWeight="bold" color={"gray.600"}>
                    {t("Error Details")}
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    p={2}
                    borderRadius="md"
                    bg={"gray.100"}
                    color={"black"}
                    fontSize="xs">
                    {apiResponse}
                  </Code>
                </Box>
              </Collapse>
            </Box>
          </Alert>
        </VStack>
      )}
    </>
  )
}
