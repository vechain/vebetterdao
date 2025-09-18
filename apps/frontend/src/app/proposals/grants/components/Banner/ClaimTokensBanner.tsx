import { useProposalClaimableUserDeposits } from "@/api/contracts/governance/hooks"
import VOT3Icon from "@/components/Icons/svg/vot3.svg"
import { useWithdrawDeposits } from "@/hooks"
import { Box, Button, Card, Heading, HStack, Icon, Text, VStack } from "@chakra-ui/react"
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
    <Card.Root
      variant="baseWithBorder"
      borderRadius="xl"
      w="full"
      h="full"
      minH={{
        base: "30vh",
        sm: "30vh",
        md: "auto",
      }}
      position="relative"
      overflow="hidden">
      <Card.Body
        position="relative"
        zIndex={1}
        alignContent="center"
        justifyContent="center"
        borderRadius="xl"
        padding={{ base: 4, md: 6 }}>
        <Box
          position="absolute"
          inset={0}
          zIndex={0}
          bgImage={`url(/assets/backgrounds/blue-cloud-full.webp)`}
          backgroundPosition="140% 20%"
          bgSize="60%"
          bgRepeat="no-repeat"
        />
        <HStack w="full" justify="space-between">
          <HStack align="center" justify="space-between">
            {/*Left Big Image*/}
            <Icon as={VOT3Icon} boxSize={20} color="icon.default" />
            {/*Right Text*/}
            <VStack align="flex-start" w="full">
              <Heading color="text.default">{t("Claim your tokens back")}</Heading>
              <Text color="text.default">
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
          </HStack>

          <Button variant="primarySubtle" onClick={handleClaim}>
            {t("Claim back")}
          </Button>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
