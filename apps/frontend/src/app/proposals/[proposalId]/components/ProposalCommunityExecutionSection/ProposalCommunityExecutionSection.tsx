import { Badge, Box, HStack, Heading, Link, Stack, Text, VStack } from "@chakra-ui/react"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useIsPayoutClaimed } from "@/api/contracts/governance/hooks/useIsPayoutClaimed"
import { useProposalBudget } from "@/api/contracts/governance/hooks/useProposalBudget"
import { useProposalDevInfo } from "@/api/contracts/governance/hooks/useProposalDevInfo"
import { useProposalPayees } from "@/api/contracts/governance/hooks/useProposalPayees"
import { AddressWithProfilePicture } from "@/app/components/AddressWithProfilePicture/AddressWithProfilePicture"
import { CollapsibleSection } from "@/app/components/CollapsibleSection"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"

type Props = {
  proposalId: string
}

const formatB3TR = (wei: bigint) =>
  Number(ethers.formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 4 })

/**
 * V11 Community Execution section on the proposal detail page.
 * Renders the max B3TR budget, the registered developer payees with per-payee
 * claim status, and the dev nickname + discussion link. Hidden entirely for
 * proposals that have neither a budget nor registered payees.
 */
export const ProposalCommunityExecutionSection = ({ proposalId }: Props) => {
  const { t } = useTranslation()
  const { data: maxBudget } = useProposalBudget(proposalId)
  const { data: payees } = useProposalPayees(proposalId)
  const { data: devInfo } = useProposalDevInfo(proposalId)
  const { data: b3trUsdPrice } = useGetTokenUsdPrice("B3TR")

  const hasBudget = !!maxBudget && maxBudget > 0n
  const hasPayees = !!payees && payees.length > 0
  const hasDevInfo = !!devInfo && (devInfo.devNickname.length > 0 || devInfo.discussionLink.length > 0)

  const usdPrice = useMemo(() => {
    const price = Number(b3trUsdPrice)
    return Number.isFinite(price) && price > 0 ? price : undefined
  }, [b3trUsdPrice])

  const budgetUsd = useMemo(() => {
    if (!hasBudget || usdPrice === undefined) return undefined
    return Number(ethers.formatEther(maxBudget)) * usdPrice
  }, [hasBudget, maxBudget, usdPrice])

  if (!hasBudget && !hasPayees && !hasDevInfo) {
    return null
  }

  return (
    <CollapsibleSection title={t("Implementation budget")} defaultOpen={true}>
      <VStack gap={5} align="flex-start" w="full">
        {/* Budget */}
        {hasBudget && (
          <VStack gap={2} align="flex-start" w="full">
            <HStack gap={3} align="center">
              <B3TRIcon boxSize={6} colorVariant="dark" />
              <Heading size={["md", "md", "lg"]}>{`${formatB3TR(maxBudget)} B3TR`}</Heading>
              {budgetUsd !== undefined && (
                <Text textStyle="md" color="gray.500">
                  {`≈ $${budgetUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </Text>
              )}
            </HStack>
            <Text textStyle="sm" color="gray.500">
              {t(
                "Hard cap that may be paid out from the Treasury to the developers selected to implement this proposal.",
              )}
            </Text>
          </VStack>
        )}

        {/* Dev info */}
        {hasDevInfo && (
          <VStack gap={2} align="flex-start" w="full">
            {devInfo?.devNickname ? (
              <Box>
                <Text fontWeight="semibold">{t("Developer")}</Text>
                <Text textStyle="md">{devInfo.devNickname}</Text>
              </Box>
            ) : null}
            {devInfo?.discussionLink ? (
              <Box>
                <Text fontWeight="semibold">{t("Discussion")}</Text>
                <Link
                  href={devInfo.discussionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="underline"
                  wordBreak="break-all">
                  {devInfo.discussionLink}
                </Link>
              </Box>
            ) : null}
          </VStack>
        )}

        {/* Payees */}
        {hasPayees && (
          <VStack gap={2} align="flex-start" w="full">
            <Text fontWeight="semibold">{t("Developer payees")}</Text>
            <VStack gap={2} align="stretch" w="full">
              {payees?.map((p, idx) => (
                <PayeeRow
                  key={`${p.account}-${idx}`}
                  proposalId={proposalId}
                  payeeIndex={idx}
                  account={p.account}
                  amount={p.amount}
                  usdPrice={usdPrice}
                />
              ))}
            </VStack>
          </VStack>
        )}
      </VStack>
    </CollapsibleSection>
  )
}

const PayeeRow = ({
  proposalId,
  payeeIndex,
  account,
  amount,
  usdPrice,
}: {
  proposalId: string
  payeeIndex: number
  account: string
  amount: bigint
  usdPrice?: number
}) => {
  const { t } = useTranslation()
  const { data: claimed } = useIsPayoutClaimed(proposalId, payeeIndex)
  const usd = usdPrice !== undefined ? Number(ethers.formatEther(amount)) * usdPrice : undefined
  return (
    <Stack
      direction={["column", "row"]}
      justify="space-between"
      align={["flex-start", "center"]}
      bg="b3tr-balance-bg"
      p={3}
      borderRadius="md"
      gap={3}>
      <AddressWithProfilePicture address={account} />
      <HStack gap={3}>
        <Text textStyle="md" fontWeight="semibold">
          {`${formatB3TR(amount)} B3TR`}
        </Text>
        {usd !== undefined && (
          <Text textStyle="sm" color="gray.500">
            {`≈ $${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </Text>
        )}
        {claimed ? (
          <Badge colorPalette="green" variant="subtle">
            {t("Paid")}
          </Badge>
        ) : (
          <Badge colorPalette="gray" variant="subtle">
            {t("Pending")}
          </Badge>
        )}
      </HStack>
    </Stack>
  )
}
