// import { useTranslation } from "react-i18next"
import React, { useState, useEffect } from "react"
import { GalaxyRewardsCarrousel } from "./GalaxyRewardsCarrousel"
import { Heading, Text, HStack, Stack, Image, VStack, Skeleton, Select, useMediaQuery } from "@chakra-ui/react"
import { gmNfts } from "@/constants/gmNfts"

// import { useTranslation } from "react-i18next"

import { useSelectedGmNft, useAllocationsRoundsEvents, useVotingRewards, usePotentialRewards } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

export const GalaxyRewardsCalculator = async () => {
  const [isAbove800] = useMediaQuery("(min-width: 800px)")
  // const { t } = useTranslation()
  const { account } = useWallet()

  if (!account) throw new Error("Account is required")

  const { isGMLoading, gmLevel } = useSelectedGmNft()
  // gmRewardMultiplier, isXNodeAttachedToGMn gmName
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  // error: allocationRoundEventsError

  const [selectedAccountRoundId, setselectedAccountRoundId] = useState<string | undefined>()
  const [selectedRoundId, setselectedRoundId] = useState<string | undefined>()
  const [selectedNft, setSelectedNft] = useState(gmNfts[0])

  const [b3TRRewardsApprox, setB3TRRewardsApprox] = useState<number | null>(null)

  const { data: roundsRewards, isLoading: rewardsAccountLoading } = useVotingRewards(selectedAccountRoundId, account)
  console.log("votingRewardsData", roundsRewards)
  const roundsRewardsA = roundsRewards?.roundsRewards

  // TODO : find the hooks that fetch that
  // rounds should look like that [] a list with a value roundId: "1", roundId: "2", roundId: "3"...

  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  const handleAccountRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setselectedAccountRoundId(e.target.value)
  }

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setselectedRoundId(e.target.value)
  }

  const selectedRoundReward = roundsRewardsA?.find(reward => reward.roundId === selectedAccountRoundId)
  console.log("selectedRoundReward", selectedRoundReward)
  // CAROUSEL

  useEffect(() => {
    const FetchPotentialRewards = async () => {
      const { data } = await usePotentialRewards(selectedRoundId, account, selectedNft?.level)
      if (data) {
        setB3TRRewardsApprox(data.rewards)
      } else {
        console.log("response of usePotentialRewards", data)
        setB3TRRewardsApprox(null) // or handle the undefined case as needed
      }
    }

    FetchPotentialRewards()
  }, [selectedNft, account, selectedRoundId])

  const handleNftSelect = (GMId: any) => {
    const selected = gmNfts.find(nft => nft.level === GMId)
    if (selected) {
      setSelectedNft(selected)
    }
  }

  console.log("selectedGMLevel", selectedNft)
  // TODO: remember to put in the PR the technical adaptation of the formula for the rewards calculation for each NFTMultiplier

  return (
    <Stack border={"1px solid black"}>
      {/* OK Premiere partie */}
      {/* Maybe no need because it's taking in charge in the previous modal ???? Need to check when running the project */}
      {/* <Heading>Your NFT</Heading> */}

      <HStack>
        {/* Nothing to show if the connected wallet don't have GMNFT attached to his wallet ( or say, you don't have GMNFT attached ) */}
        <Skeleton isLoaded={!isGMLoading}>
          {gmLevel ? (
            <Image
              w={isAbove800 ? "126px" : "64px"}
              h={isAbove800 ? "126px" : "64px"}
              rounded="7px"
              src={gmNfts.find(nft => nft.level === gmLevel)?.image}
              alt={"gm"}
            />
          ) : (
            <Text>{}</Text>
          )}
        </Skeleton>

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
            {/* <Text >Rewards: {selectedRoundReward?.formattedRewards}</Text> */}

            <Text>{selectedRoundReward?.formattedRewards}</Text>
          </Skeleton>
        </VStack>
      </HStack>

      <GalaxyRewardsCarrousel selectedGMLevel={handleNftSelect} />

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

        <Text>{b3TRRewardsApprox}</Text>
        {/* Estimate Rewards:  */}
        <HStack>
          {/* TODO:  MAKE A LITTLE ANIMATION TO SAY -> YOU ARE EARNING +x% BY UPGRADING YOUR NFT (make a pourcentage ) */}
          {/* Percentage_Increase=((Old_Value - New_Value)/Old_Value)*100 */}
        </HStack>
      </HStack>
    </Stack>
  )
}
