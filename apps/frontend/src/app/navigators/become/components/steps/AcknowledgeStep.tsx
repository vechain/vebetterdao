import { Card, Checkbox, Heading, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useIsAutoVotingEnabled } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useNavigatorApplicationStore } from "@/store/useNavigatorApplicationStore"

export const AcknowledgeStep = () => {
  const { t } = useTranslation()
  const { data, setData } = useNavigatorApplicationStore()
  const { account } = useWallet()
  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: isAutoVotingEnabled } = useIsAutoVotingEnabled()

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1} align="start">
        <Heading size="md">{t("Accept terms")}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {t(
            "Navigators are subject to protocol-enforced penalties designed to deter negligence and misconduct. Please acknowledge the following:",
          )}
        </Text>
      </VStack>

      <VStack gap={3} align="stretch">
        {isAutoVotingEnabled && (
          <Checkbox.Root
            checked={data.acceptedAutoVotingDisable}
            onCheckedChange={e => setData({ acceptedAutoVotingDisable: !!e.checked })}
            colorPalette="orange"
            alignItems="flex-start"
            gap={3}>
            <Checkbox.HiddenInput />
            <Checkbox.Control mt="1" />
            <Checkbox.Label>
              <Text textStyle="sm">
                {t(
                  "I understand that I currently have auto-voting enabled, and by registering as a navigator, auto-voting will be disabled and cannot be used while I am a navigator.",
                )}
              </Text>
            </Checkbox.Label>
          </Checkbox.Root>
        )}
        {isDelegated && (
          <Checkbox.Root
            checked={data.acceptedDelegationExit}
            onCheckedChange={e => setData({ acceptedDelegationExit: !!e.checked })}
            colorPalette="orange"
            alignItems="flex-start"
            gap={3}>
            <Checkbox.HiddenInput />
            <Checkbox.Control mt="1" />
            <Checkbox.Label>
              <Text textStyle="sm">
                {t(
                  "I understand that I am currently delegating to a navigator, and by registering I will automatically exit my current delegation.",
                )}
              </Text>
            </Checkbox.Label>
          </Checkbox.Root>
        )}
        <Checkbox.Root
          checked={data.acceptedVotingPenalty}
          onCheckedChange={e => setData({ acceptedVotingPenalty: !!e.checked })}
          colorPalette="blue"
          alignItems="flex-start"
          gap={3}>
          <Checkbox.HiddenInput />
          <Checkbox.Control mt="1" />
          <Checkbox.Label>
            <Text textStyle="sm">
              {t(
                "I acknowledge that failing to vote on governance proposals and app allocations may result in one minor slash per reported round.",
              )}
            </Text>
          </Checkbox.Label>
        </Checkbox.Root>

        <Checkbox.Root
          checked={data.acceptedReportPenalty}
          onCheckedChange={e => setData({ acceptedReportPenalty: !!e.checked })}
          colorPalette="blue"
          alignItems="flex-start"
          gap={3}>
          <Checkbox.HiddenInput />
          <Checkbox.Control mt="1" />
          <Checkbox.Label>
            <Text textStyle="sm">
              {t(
                "I acknowledge that I must publish a Navigator Report at least once every two rounds, covering allocation rationale, strategy changes, dApp performance insights, and recommendations. Failure to do so may result in a minor slash when a completed round is reported (at most once per round; percentage is governance-configurable).",
              )}
            </Text>
          </Checkbox.Label>
        </Checkbox.Root>

        <Checkbox.Root
          checked={data.acceptedDisclosurePenalty}
          onCheckedChange={e => setData({ acceptedDisclosurePenalty: !!e.checked })}
          colorPalette="blue"
          alignItems="flex-start"
          gap={3}>
          <Checkbox.HiddenInput />
          <Checkbox.Control mt="1" />
          <Checkbox.Label>
            <Text textStyle="sm">
              {t(
                "I acknowledge that I must provide full and timely conflict-of-interest disclosures, including compensation, token allocations, or advisory relationships with any dApp. Severe or repeated failures may be addressed through governance, including slashing as outlined below.",
              )}
            </Text>
          </Checkbox.Label>
        </Checkbox.Root>
      </VStack>

      <Card.Root variant="outline" bg="red.50" _dark={{ bg: "red.900/20" }} borderRadius="xl">
        <Card.Body py={3}>
          <VStack gap={2} align="start">
            <Text textStyle="xs" fontWeight="semibold">
              {t("Severe violations")}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {t(
                "Governance manipulation or bribery, vote buying, undisclosed paid relationships with dApps, and attacks on governance or protocol integrity are considered severe violations.",
              )}
            </Text>
            <Text textStyle="xs" color="fg.muted" fontStyle="italic">
              {t(
                "The applicable penalty will be proposed and decided through governance and may result in slashing of up to 100% of the staked funds, depending on severity.",
              )}
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}
