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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton>
      <VStack align="stretch" gap={5}>
        <HStack gap={2}>
          <Icon as={Sparks} boxSize={6} color="text.default" />
          <Heading size="2xl" fontWeight="bold">
            {t("VePassport Update")}
          </Heading>
        </HStack>

        <Text textStyle="md" color="text.subtle">
          {t(
            "To ensure DAO decisions and rewards are driven by active community members, the Proof of Participation requirements have been updated.",
          )}
        </Text>

        <VStack gap={2} w="full">
          <TierRow label={t("Before")} description={t("3 actions in 12 rounds")} variant="orange" />
          <TierRow label={t("Now")} description={t("4 actions in 4 rounds")} variant="green" />
          <TierRow
            label={t("How to stay eligible")}
            description={t("Perform 1 sustainable action per round to maintain your voting rights")}
            variant="green"
          />
        </VStack>

        <Text textStyle="xs" color="text.subtle">
          {t("Holders of a GM NFT (Level 2+) are exempt from App activity requirements.")}{" "}
          <Link asChild textDecoration="underline">
            <NextLink href="/galaxy-member" onClick={onClose}>
              {t("Upgrade now!")}
            </NextLink>
          </Link>
        </Text>

        <Button
          variant="primary"
          size={{ base: "sm", md: "md" }}
          onClick={() => {
            onClose()
            router.push("/apps")
          }}>
          {t("Explore Apps")}
        </Button>
      </VStack>
    </BaseModal>
  )
}

const TierRow = ({
  label,
  description,
  variant,
}: {
  label: string
  description?: string
  variant: "green" | "orange"
}) => (
  <Box bg={`${variant}.subtle`} borderRadius="lg" p={3} w="full">
    <HStack justify="space-between" align="start">
      <VStack align="start" gap={0}>
        <Text textStyle="sm" fontWeight="bold" color={`${variant}.fg`}>
          {label}
        </Text>
        {description && (
          <Text textStyle="xs" color={`${variant}.fg`} opacity={0.8}>
            {description}
          </Text>
        )}
      </VStack>
    </HStack>
  </Box>
)
