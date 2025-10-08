import { useProposalClaimableUserDeposits } from "@/api/contracts/governance/hooks"
import VOT3Icon from "@/components/Icons/svg/vot3.svg"
import { useWithdrawDeposits } from "@/hooks"
import { Box, Button, Card, Heading, Stack, Icon, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

export const ClaimTokensBanner = () => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const { data: { totalClaimableDeposits, claimableDeposits } = { totalClaimableDeposits: 0, claimableDeposits: [] } } =
    useProposalClaimableUserDeposits(account?.address ?? "")

  const { sendTransaction } = useWithdrawDeposits({
    proposalDeposits: claimableDeposits,
  })

  const handleClaim = useCallback(() => {
    sendTransaction()
  }, [sendTransaction])

  const formattedDeposits = useMemo(() => {
    return Number(ethers.formatEther(totalClaimableDeposits))
  }, [totalClaimableDeposits])
  return (
    <Card.Root variant="primary" borderRadius="xl" w="full" h="full" position="relative" overflow="hidden">
      <Card.Body position="relative" zIndex={1} justifyContent="center" borderRadius="xl">
        <Box
          position="absolute"
          inset={0}
          zIndex={0}
          right={{ base: "-50%", md: 0 }}
          bgImage={`url(/assets/backgrounds/blue-cloud-full.webp)`}
          backgroundPosition={{ base: "-40% 100%", md: "140% 20%" }}
          rotate={{ base: "450deg", md: "0deg" }}
          scale={{ base: "0.8", md: "1" }}
          bgRepeat="no-repeat"
        />

        <Stack
          direction={{ base: "column", md: "row" }}
          align={{ base: "left", md: "center" }}
          position="relative"
          w="full"
          gap={4}>
          {/* Mobile: Full vertical stack - Image, Title, Desc, Button */}
          {/* Desktop: Icon on left, Text in center, Button on right */}

          {/* Icon - Top on mobile, Left on desktop */}
          <Icon as={VOT3Icon} boxSize={20} color="icon.default" flexShrink={0} />

          {/* Text content - Stacked on mobile, Center on desktop */}
          <VStack gap={2} flex={1} align="flex-start">
            <Heading>{t("Claim your tokens back")}</Heading>
            <Text>
              <Trans
                i18nKey="You have <b>{{votesToClaim}} VOT3</b> tokens ready to be claimed from supporting {{amountProposals}} proposals."
                components={{ b: <b /> }}
                values={{
                  votesToClaim: compactFormatter.format(formattedDeposits),
                  amountProposals: claimableDeposits.length,
                }}
              />
            </Text>
          </VStack>

          {/* Button - Bottom on mobile, Right on desktop */}
          <Button variant="secondary" onClick={handleClaim} borderRadius="full" w={{ base: "50%", md: "auto" }}>
            {t("Claim back")}
          </Button>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
