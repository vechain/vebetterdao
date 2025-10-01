import B3trIcon from "@/components/Icons/svg/b3tr.svg"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { Card, Heading, HStack, Icon, Separator, Stack, Text, VStack, Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Clock } from "iconoir-react"

import { DeleteGrantProposalModal } from "./DeleteGrantProposalModal"
import { useGrantProposalFormStore } from "@/store"
import { humanNumber } from "@repo/utils/FormattingUtils"

type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T]

const requiredGrantFieldKeys = [
  "grantType",
  "proposerAddress",
  "grantsReceiverAddress",
  "companyName",
  "companyRegisteredNumber",
  "companyEmail",
  "projectName",
  "projectWebsite",
  "githubUsername",
  "problemDescription",
  "solutionDescription",
  "targetUsers",
  "competitiveEdge",
  "benefitsToUsers",
  "benefitsToVeChainEcosystem",
  "x2EModel",
  "revenueModel",
  "highLevelRoadmap",
  "termsOfService",
  "votingRoundId",
] as const satisfies ReadonlyArray<RequiredKeys<GrantFormData>>

const requiredMilestoneFieldKeys = [
  "description",
  "fundingAmount",
  "durationFrom",
  "durationTo",
] as const satisfies ReadonlyArray<RequiredKeys<GrantFormData["milestones"][0]>>

/**
 * Calculates the completion percentage of a grant proposal draft
 * @param proposal - The grant form data
 * @returns Completion percentage (0-100)
 */
export const calculateGrantDraftCompletion = (proposal: GrantFormData): number => {
  let filledCount = 0
  // Total fields = direct fields + 1 for milestones (treated as single unit)
  const totalRequiredFields = requiredGrantFieldKeys.length + 1

  // Check direct required fields
  requiredGrantFieldKeys.forEach(field => {
    const value = proposal[field]
    if (isFieldFilled(value)) {
      filledCount++
    }
  })

  // Check if at least one milestone is complete (all or nothing)
  const hasCompleteMilestone = proposal.milestones.some(milestone => {
    return requiredMilestoneFieldKeys.every(key => isFieldFilled(milestone[key]))
  })

  if (hasCompleteMilestone) filledCount += 1

  const percentage = Math.round((filledCount / totalRequiredFields) * 100)
  return Math.min(percentage, 100)
}

/**
 * Helper function to check if a field is considered "filled"
 */
const isFieldFilled = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (typeof value === "number") {
    return value > 0
  }

  if (typeof value === "boolean") {
    return value === true
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return false
}

type GrantsProposalDraftCardProps = {
  proposal: GrantFormData
}

export const GrantsProposalDraftCard = ({ proposal }: GrantsProposalDraftCardProps) => {
  const router = useRouter()
  const { t } = useTranslation()
  const { setData } = useGrantProposalFormStore()

  const editGrantProposal = () => {
    setData(proposal as unknown as GrantFormData, 1)
    router.push(`/proposals/grants/new`)
  }

  const grantAmountRequested = proposal.milestones.reduce((acc, milestone) => acc + milestone.fundingAmount, 0)
  const completionPercentage = calculateGrantDraftCompletion(proposal)

  return (
    <Card.Root w="full" borderColor="border.secondary" borderWidth="1px" p={{ base: 5, md: 7 }}>
      <VStack w="full" gap={4} alignItems="flex-start">
        <Heading size={{ base: "lg", lg: "md" }}>{proposal.projectName}</Heading>

        <Stack
          direction={{ base: "column", md: "row" }}
          w="full"
          fontSize={{ base: "14px", md: "16px" }}
          justify={{ base: "flex-start" }}
          gap={{ base: 3, md: 2 }}
          align={{ base: "flex-start", md: "center" }}>
          <HStack
            color="text.subtle"
            gap={{ base: 2, md: 3 }}
            flexWrap={{ base: "wrap", sm: "nowrap" }}
            w={{ base: "full", md: "auto" }}>
            <HStack gap={2} minW="fit-content">
              <Icon as={B3trIcon} color="actions.primary.default" boxSize={{ base: 4, md: 5 }} />
              <Text fontSize={{ base: "sm", lg: "md" }} whiteSpace="nowrap">
                {humanNumber(grantAmountRequested, grantAmountRequested, "B3TR")}
              </Text>
              <Text display={{ base: "none", lg: "block" }} fontSize={{ base: "sm", lg: "md" }}>
                {"•"} {proposal.grantType === "dapp" ? t("App Grant") : t("Tooling Grant")}
              </Text>
            </HStack>
            <Separator orientation="vertical" h="16px" />
            <HStack gap="1">
              <Icon as={Clock} color="text.subtle" boxSize="4" />
              <Text fontSize="sm" color="text.subtle">
                {t("grant application")}
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="text.subtle">
                {`${completionPercentage}%`}
              </Text>
            </HStack>
          </HStack>
        </Stack>

        <Separator w="full" h={1} color="border.secondary" />

        <HStack w="full" gap={2}>
          <Button w="40" variant="secondary" size="md" onClick={editGrantProposal}>
            {t("Edit")}
          </Button>

          <DeleteGrantProposalModal proposal={proposal}>
            <Button w="40" variant="ghost" color="actions.tertiary.default" size="md">
              {t("Delete")}
            </Button>
          </DeleteGrantProposalModal>
        </HStack>
      </VStack>
    </Card.Root>
  )
}
