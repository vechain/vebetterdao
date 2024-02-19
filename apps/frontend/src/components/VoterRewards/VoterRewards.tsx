import { useCurrentAllocationsRoundId, useVotingRewards } from "@/api"
import { Card, CardBody, HStack, Heading, Icon, VStack, Text, Button, Flex, Show } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import React, { useMemo } from "react"
import { FaGift } from "react-icons/fa6"
import BigNumber from "bignumber.js"
import { useClaimRewards } from "@/hooks/useClaimRewards"

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "standard",
  compactDisplay: "short",
})

export const VoterRewards: React.FC = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()

  const rewardsPerRound = useVotingRewards(currentRoundId, account ?? undefined)

  const roundRewards = useMemo(() => {
    if (!rewardsPerRound) return []

    return rewardsPerRound.map(reward => {
      return {
        roundId: reward.data?.roundId ?? "",
        rewards: reward.data?.rewards ?? "0",
      }
    })
  }, [rewardsPerRound])

  const totalRewards = useMemo(() => {
    if (!rewardsPerRound) return new BigNumber("0")

    return rewardsPerRound.reduce((acc, reward) => acc.plus(reward.data?.rewards ?? "0"), new BigNumber("0"))
  }, [rewardsPerRound])

  const totalRewardsFormatted = useMemo(() => {
    if (!totalRewards) return "0"

    return totalRewards.toFixed(4)
  }, [totalRewards])

  const isRewardsLoading = rewardsPerRound?.some(reward => reward.isLoading) // Loading rewards to claim

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useClaimRewards({
    roundRewards,
  })

  const isClaimRewardsLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <Card w="full">
      <CardBody>
        <VStack spacing={2} w="full" align={"flex-start"}>
          <HStack spacing={8} w="full" align={"flex-start"}>
            <HStack spacing={2}>
              <Icon as={FaGift} />
              <Heading size="md">Claimable rewards</Heading>
            </HStack>
          </HStack>
          <Text fontSize="sm">Participate for a better future and get rewarded.</Text>
          <HStack spacing={2} w="full" pt={2}>
            <HStack spacing={2} w="full" align={"flex-start"}>
              <Show below="sm">
                <Heading size="3xl">{compactFormatter.format(Number(totalRewardsFormatted))}</Heading>
              </Show>
              <Show above="sm">
                <Heading size="2xl">{compactFormatter.format(Number(totalRewardsFormatted))}</Heading>
              </Show>
              <Text fontSize={"md"} textTransform={"uppercase"} alignSelf={"end"}>
                B3TR
              </Text>
            </HStack>
            <Button
              isDisabled={totalRewards?.eq(0)}
              isLoading={isRewardsLoading || isClaimRewardsLoading}
              onClick={sendTransaction}>
              Claim
            </Button>
          </HStack>
        </VStack>
      </CardBody>
      {!account && (
        <Flex backdropFilter="blur(10px)" position={"absolute"} h={"100%"} w={"100%"} align="center" justify="center">
          <Card rounded="xl">
            <CardBody>
              <VStack gap={4}>
                <Heading size="md" textAlign={"center"}>
                  You are not connected
                </Heading>
                <Text textAlign={"center"} fontSize="14px">
                  Connect your wallet to check your rewards
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Flex>
      )}
    </Card>
  )
}
