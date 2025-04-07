import { Heading, Icon, Link, Text, VStack, Button } from "@chakra-ui/react"
import { FiExternalLink } from "react-icons/fi"
import { useTranslation } from "react-i18next"

export function VerificationSection() {
  const { t } = useTranslation()

  const getVetDomainsVerifyUrl = () => {
    return "https://vet.domains/verify"
  }

  return (
    <VStack align="stretch" w="full" borderRadius="16px" bg="blue.50" p={6} spacing={4}>
      <Heading size="md">{t("Complete Identity Verification")}</Heading>

      <Text>
        {t("For your security, we'll redirect you to our trusted verification partner {{value}} in a new tab.", {
          value: "vet.domains",
        })}
      </Text>

      <Button
        as={Link}
        href={getVetDomainsVerifyUrl()}
        isExternal
        colorScheme="blue"
        rightIcon={<Icon as={FiExternalLink} />}
        width="fit-content"
        _hover={{ textDecoration: "none" }}>
        {t("Start Verification")}
      </Button>

      <Text fontSize="sm" color="gray.600">
        {t("After completing verification, return to this page and click 'I've Completed Verification' below.")}
      </Text>
    </VStack>
  )
}
