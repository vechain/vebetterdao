import { Heading, VStack, Text, HStack, Icon, Box, Button, Separator } from "@chakra-ui/react"
import { Sparks } from "iconoir-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { MdHowToVote } from "react-icons/md"

import { BaseModal } from "@/components/BaseModal"

type Props = {
  isOpen: boolean
  onClose: () => void
  /** Opened from in-flow info (e.g. Freshness hint): show Close instead of Vote now */
  infoOnly?: boolean
}

export const FreshnessMultiplierModal = ({ isOpen, onClose, infoOnly = false }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton>
      <VStack align="stretch" gap={5}>
        <HStack gap={2}>
          <Icon as={Sparks} boxSize={6} color="text.default" />
          <Heading size="2xl" fontWeight="bold">
            {t("Rewards Multipliers")}
          </Heading>
        </HStack>

        <Text textStyle="md" color="text.subtle">
          {t("To encourage active, intentional participation, your voting rewards are now boosted by two multipliers.")}
        </Text>

        <MultiplierSection
          icon={Sparks}
          title={t("Freshness Multiplier")}
          description={t(
            "Earned through allocation voting. Update your app selection each round to receive a higher multiplier. Repeating the same vote lowers your bonus over time.",
          )}>
          <VStack gap={2} w="full">
            <TierRow label="x3" description={t("Updated your apps this round or first vote")} variant="green" />
            <TierRow label="x2" description={t("Updated your apps within the last 2 rounds")} variant="green" />
            <TierRow label="x1" description={t("No update for 3 or more rounds")} variant="orange" />
          </VStack>
          <Text textStyle="xs" color="text.subtle">
            {t("You'll see this indicator when voting, showing which multiplier tier you'll achieve.")}
          </Text>
        </MultiplierSection>

        <Separator />

        <MultiplierSection
          icon={MdHowToVote}
          title={t("Governance Intent Multiplier")}
          description={t(
            "Earned through proposal voting. Voting For or Against a proposal signals conviction and earns a higher multiplier than Abstaining.",
          )}>
          <VStack gap={2} w="full">
            <TierRow label="x1" description={t("Vote For or Against a proposal")} variant="green" />
            <TierRow label="x0.30" description={t("Abstain from a proposal")} variant="orange" />
          </VStack>
        </MultiplierSection>

        {infoOnly ? (
          <Button variant="primary" size={{ base: "sm", md: "md" }} onClick={onClose}>
            {t("Close")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size={{ base: "sm", md: "md" }}
            onClick={() => {
              onClose()
              router.push("/allocations/vote")
            }}>
            {t("Vote now")}
          </Button>
        )}
      </VStack>
    </BaseModal>
  )
}

const MultiplierSection = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) => (
  <VStack align="stretch" gap={3}>
    <HStack gap={3} align="start">
      <Icon as={icon} boxSize={5} color="text.default" mt={0.5} />
      <VStack align="start" gap={1}>
        <Text textStyle="sm" fontWeight="semibold">
          {title}
        </Text>
        <Text textStyle="xs" color="text.subtle">
          {description}
        </Text>
      </VStack>
    </HStack>
    {children}
  </VStack>
)

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
