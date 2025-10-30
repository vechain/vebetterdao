import { VStack, Button, useDisclosure, Card, Text, HStack, Skeleton, Stack } from "@chakra-ui/react"
import { UilExclamationTriangle } from "@iconscout/react-unicons"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAllowedImpactKeys } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAllowedImpactKeys"
import { useAppRewardDistributedEvents } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppRewardDistributedEvents"
import { validateRewardProof, ProofIssue } from "../../utils/validateRewardProof"

import { ProofValidationDetailsModal } from "./ProofValidationDetailsModal"

type Props = {
  appId: string
}

/**
 * Component that validates recent RewardDistributed events and displays warnings
 * if proofs are missing or incorrectly formatted
 */
export const ProofValidationAlert = ({ appId }: Props) => {
  const { t } = useTranslation()
  const { data: rewardEvents, isLoading } = useAppRewardDistributedEvents(appId, 5)
  const { data: allowedImpactKeys, isLoading: isLoadingImpactKeys } = useAllowedImpactKeys()
  const { open, onOpen, onClose } = useDisclosure()

  // Validate all recent reward events
  const validationResults = useMemo(() => {
    if (!rewardEvents || rewardEvents.length === 0) return null
    if (!allowedImpactKeys) return null // Wait for impact keys to be loaded

    const allIssues: ProofIssue[] = []
    let hasInvalidProofs = false

    for (const event of rewardEvents) {
      const result = validateRewardProof(event.proof, allowedImpactKeys)
      if (!result.isValid || result.issues.length > 0) {
        hasInvalidProofs = true
        // Add issues but avoid duplicates
        result.issues.forEach(issue => {
          const isDuplicate = allIssues.some(
            existing => existing.type === issue.type && existing.message === issue.message,
          )
          if (!isDuplicate) {
            allIssues.push(issue)
          }
        })
      }
    }

    if (!hasInvalidProofs) return null

    return {
      issues: allIssues,
      hasErrors: allIssues.some(issue => issue.severity === "error"),
    }
  }, [rewardEvents, allowedImpactKeys])

  // Don't show alert if no issues found
  if (!validationResults) return null

  const isLoadingData = isLoading || isLoadingImpactKeys

  return (
    <>
      <Skeleton loading={isLoadingData}>
        <Card.Root bg="#FFF3E5" border="1px solid #AF5F00" rounded="xl" w="full" p="4">
          <Card.Body position="relative" overflow="hidden" borderRadius="xl" p="0">
            <VStack gap={0} w="full" align="flex-start">
              <HStack align={["flex-start", "flex-start", "center"]} position="relative" w="full" h="full">
                <UilExclamationTriangle size={36} color="#AF5F00" />
                <VStack gap={0} w="full" align="flex-start">
                  <Text fontWeight="bold" color="#AF5F00" as="span">
                    {validationResults.hasErrors
                      ? t("Reward proofs have validation errors")
                      : t("Reward proofs have validation warnings")}
                  </Text>
                  <Stack
                    flexDir={{ base: "column", md: "row" }}
                    gap="0"
                    alignSelf="flex-end"
                    justify="space-between"
                    alignItems={{ base: "flex-end", md: "flex-start" }}
                    w="full">
                    <Text color="#AF5F00">
                      {validationResults.hasErrors
                        ? t(
                            "Your app is not properly emitting sustainability proofs. This affects transparency and impact tracking.",
                          )
                        : t("Your app's sustainability proofs could be improved for better compatibility.")}
                    </Text>
                    <Button
                      size="sm"
                      alignItems="flex-end"
                      variant="plain"
                      _hover={{ textDecoration: "underline" }}
                      color="#AF5F00"
                      onClick={onOpen}>
                      {t("View details")}
                    </Button>
                  </Stack>
                </VStack>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Skeleton>

      <ProofValidationDetailsModal isOpen={open} onClose={onClose} issues={validationResults.issues} />
    </>
  )
}
