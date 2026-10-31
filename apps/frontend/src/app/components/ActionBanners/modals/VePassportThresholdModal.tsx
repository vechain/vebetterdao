import { Heading, VStack, Text, HStack, Icon, Box, Button, Link } from "@chakra-ui/react"
import { Sparks } from "iconoir-react"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const VePassportThresholdModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  const handleExploreApps = () => {
    onClose()
    router.push("/apps")
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton modalContentProps={{ maxW: "md" }}>
      <VStack align="stretch" gap={5}>
        <HStack gap={2}>
          <Icon as={Sparks} boxSize={6} color="text.default" />
          <Heading size="2xl" fontWeight="bold">
            {t("VePassport Threshold Update")}
          </Heading>
        </HStack>

        <Text textStyle="md" color="text.subtle">
          {t("To encourage active governance, the requirements to maintain your voting eligibility have been updated.")}
        </Text>

        <VStack gap={3} w="full">
          {/* New Standard Card */}
          <Box bg="green.subtle" borderRadius="xl" p={4} w="full">
            <VStack align="start" gap={2}>
              <Box bg="#22c55e" color="white" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="bold">
                {t("4 Actions / 4 Rounds")}
              </Box>
              <Text textStyle="sm" color="text.default" fontWeight="medium">
                {t("New Standard — Maintain 1 action per round to keep voting eligibility active")}
              </Text>
            </VStack>
          </Box>

          {/* Previous Standard Card */}
          <Box bg="orange.subtle" borderRadius="xl" p={4} w="full">
            <VStack align="start" gap={2}>
              <Box bg="#ea580c" color="white" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="bold">
                {t("3 Actions / 12 Rounds")}
              </Box>
              <Text textStyle="sm" color="text.default" fontWeight="medium">
                {t("Previous Standard — Minimal activity across 12 rounds")}
              </Text>
            </VStack>
          </Box>
        </VStack>

        {/* Footnote */}
        <Text textStyle="xs" color="text.subtle">
          {t("Holders of a GM NFT (Level 2+) at the snapshot are exempt from App activity requirements.")}{" "}
          <Link asChild color="blue.500" fontWeight="semibold">
            <NextLink href="/galaxy-member" onClick={onClose}>
              {t("Upgrade now!")}
            </NextLink>
          </Link>
        </Text>

        {/* Action Button */}
        <Button variant="primary" size={{ base: "sm", md: "md" }} w="full" onClick={handleExploreApps}>
          {t("Explore Apps")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

