// import { useTranslation } from "react-i18next"
import React, { useState, useEffect } from "react"
import { GalaxyRewardsCarrousel } from "./GalaxyRewardsCarrousel"
import { Heading, Box, Text, HStack, Image, VStack, Skeleton, Select } from "@chakra-ui/react"
import { gmNfts } from "@/constants/gmNfts"

import { useSelectedGmNft, useAllocationsRoundsEvents, useVotingRewards, usePotentialRewards } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

export const GalaxyRewardsCalculator = () => {
  // const { t } = useTranslation()
  const { account } = useWallet()
  if (!account) throw new Error("Account is required")

  const { gmName, isGMLoading, gmLevel } = useSelectedGmNft()
  // gmRewardMultiplier, isXNodeAttachedToGM
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  // error: allocationRoundEventsError

  const [selectedAccountRoundId, setselectedAccountRoundId] = useState<string | undefined>()
  const [selectedRoundId, setselectedRoundId] = useState<string | undefined>()
  const [selectedNft, setSelectedNft] = useState(gmNfts[0])

  const [b3TRRewardsApprox, setB3TRRewardsApprox] = useState<number | null>(null)

  const { data: votingRewardsData, isLoading: rewardsAccountLoading } = useVotingRewards(
    selectedAccountRoundId,
    account,
  )
  const roundsRewards = votingRewardsData?.roundsRewards

  // TODO : find the hooks that fetch that
  // rounds should look like that [] a list with a value roundId: "1", roundId: "2", roundId: "3"...

  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  const handleAccountRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setselectedAccountRoundId(e.target.value)
  }

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setselectedRoundId(e.target.value)
  }

  const selectedRoundReward = roundsRewards?.find(reward => reward.roundId === selectedAccountRoundId)

  // CAROUSEL

  const b3TR_rewards_approx = usePotentialRewards(selectedRoundId, account, selectedNft?.level)
  useEffect(() => {
    if (b3TR_rewards_approx) setB3TRRewardsApprox(b3TR_rewards_approx?.rewards)
  }, [selectedNft, account, selectedRoundId])

  const handleNftSelect = (GMId: any) => {
    const selected = gmNfts.find(nft => nft.level === GMId)
    if (selected) {
      setSelectedNft(selected)
    }
  }
  // TODO: remember to put in the PR the technical adaptation of the formula for the rewards calculation for each NFTMultiplier

  return (
    <Box>
      {/* OK Premiere partie */}
      {/* Maybe no need because it's taking in charge in the previous modal ???? Need to check when running the project */}
      <HStack>
        {/* Nothing to show if the connected wallet don't have GMNFT attached to his wallet ( or say, you don't have GMNFT attached ) */}
        <Heading>{}</Heading>
        <Skeleton isLoaded={!isGMLoading}>
          {gmLevel ? <Image src={gmNfts.find(nft => nft.level === gmLevel)?.image} alt={gmName} /> : <Text>{}</Text>}
        </Skeleton>
        {gmLevel ? <Image src={gmNfts.find(nft => nft.level === gmLevel)?.image} alt={gmName} /> : <Text>{}</Text>}

        <VStack>
          <Heading> {}</Heading>

          <Select placeholder="Select round" onChange={handleAccountRoundChange}>
            {invertedCreatedRounds?.map(round => (
              <option key={round.roundId} value={round.roundId}>
                {round.roundId}
              </option>
            ))}
          </Select>

          <Skeleton isLoaded={!rewardsAccountLoading}>
            {/* <Text>Rewards: {selectedRoundReward?.formattedRewards}</Text> */}

            <Text>{selectedRoundReward?.formattedRewards}</Text>
          </Skeleton>
        </VStack>
      </HStack>

      <HStack>
        {/* <Heading> Estimated Rewards: </Heading> */}

        <Select placeholder="Select round" onChange={handleRoundChange}>
          {invertedCreatedRounds?.map(round => (
            <option key={round.roundId} value={round.roundId}>
              {round.roundId}
            </option>
          ))}
        </Select>
        {/* TODO see how that works */}
        <GalaxyRewardsCarrousel selectedGMLevel={handleNftSelect} />

        <Text>{b3TRRewardsApprox}</Text>
        {/* Estimate Rewards:  */}
        <HStack>
          {/* TODO:  MAKE A LITTLE ANIMATION TO SAY -> YOU ARE EARNING +x% BY UPGRADING YOUR NFT (make a pourcentage ) */}
          {/* Percentage_Increase=((Old_Value - New_Value)/Old_Value)*100 */}
        </HStack>
      </HStack>
    </Box>
  )
}
