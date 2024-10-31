// import { useTranslation } from "react-i18next"
import React, { useState, useEffect } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { GalaxyRewardsCarrousel } from "./GalaxyRewardsCarrousel"
import {
  Heading,
  Text,
  HStack,
  Stack,
  Image,
  VStack,
  Skeleton,
  Select,
  useMediaQuery,
  Card,
  CardBody,
} from "@chakra-ui/react"
import { useSelectedGmNft, useAllocationsRoundsEvents, useVotingRewards } from "@/api"
import { usePotentialRewards } from "../utils/usePotentialRewards"

import { gmNfts } from "@/constants/gmNfts"

import { useTranslation } from "react-i18next"

export const GalaxyRewardsCalculator = async () => {
  const [selectedAccountRoundId, setselectedAccountRoundId] = useState<string | undefined>()
  const [selectedRoundId, setselectedRoundId] = useState<string | undefined>()
  const [selectedNft, setSelectedNft] = useState(gmNfts[0])
  const [b3TRRewardsApprox, setB3TRRewardsApprox] = useState<number | null>(null)

  const { account } = useWallet()
  if (!account) throw new Error("Account is required")

  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const { isGMLoading, gmLevel } = useSelectedGmNft()
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const roundsRewards = useVotingRewards(selectedAccountRoundId, account)
  const {
    potentialRewards,
    isLoading,
    error: errorGetPotentialRewards,
  } = usePotentialRewards(selectedRoundId, account, Number(selectedNft?.level))

  console.log("selectedAccountRoundId before calling useVotingRewards", selectedAccountRoundId)
  console.log("account before calling useVotingRewards", account)
  console.log("roundsRewards", roundsRewards)

  const showClaimB3trBanner = !!account && roundsRewards.data?.total && Number(roundsRewards.data.total) !== 0
  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  const handleNftSelect = (GMId: any) => {
    const selected = gmNfts.find(nft => nft.level === GMId)
    if (selected) {
      setSelectedNft(selected)
    }
  }

  const handleAccountRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setselectedAccountRoundId(e.target.value)
  }

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setselectedRoundId(e.target.value)
  }
  // const roundsRewardsA = roundsRewards?.roundsRewards
  // const selectedRoundReward = roundsRewardsA?.find(reward => reward.roundId === selectedAccountRoundId)

  useEffect(() => {
    if (!isLoading) {
      setB3TRRewardsApprox(potentialRewards)
    }
  }, [potentialRewards, isLoading])

  useEffect(() => {
    console.log("selectedNft", selectedNft)
  }, [selectedNft])

  return (
    <Stack border={"1px solid black"}>
      <HStack>
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

        <VStack w="30%">
          <Heading></Heading>

          <Select placeholder="Select round" onChange={handleAccountRoundChange}>
            {invertedCreatedRounds?.map(round => (
              <option key={round.roundId} value={round.roundId}>
                {round.roundId}
              </option>
            ))}
          </Select>

          {/* <Skeleton isLoaded={!rewardsAccountLoading}> */}
          {/* <Text>Rewards: {selectedRoundReward?.formattedRewards}</Text> */}

          {/* <Text>{selectedRoundReward?.formattedRewards}</Text> */}
          <Text>{showClaimB3trBanner}</Text>

          {/* </Skeleton> */}
        </VStack>
      </HStack>

      <HStack>
        <GalaxyRewardsCarrousel selectedGMLevel={handleNftSelect} />

        <VStack w={"30%"}>
          <Heading></Heading>

          <Select placeholder="Select round" onChange={handleRoundChange}>
            {invertedCreatedRounds?.map(round => (
              <option key={round.roundId} value={round.roundId}>
                {round.roundId}
              </option>
            ))}
          </Select>

          {errorGetPotentialRewards ? (
            <Card variant={"filled"} w="full" rounded={"xl"}>
              <CardBody>
                <Text color={"red.500"}>{errorGetPotentialRewards.message}</Text>
              </CardBody>
            </Card>
          ) : (
            <Card variant={"filled"} w="full" rounded={"xl"}>
              <CardBody>
                <Text fontSize="xl">{b3TRRewardsApprox}</Text>
              </CardBody>
            </Card>
          )}
          <Text>
            {t(
              "The displayed rewards are indicative and based on the rounds you have voted in. If you select a round you haven't voted in, you won't be able to project the upcoming rewards.",
            )}
          </Text>
        </VStack>
      </HStack>
      {/* <Heading> Rewards Increase </Heading> */}
      <HStack>
        {/* TODO: little animation for rendment % ) */}
        {/* Percentage_Increase=((Old_Value - New_Value)/Old_Value)*100 */}
        {/* <Text>+</Text>
        <Heading> X% </Heading> */}
      </HStack>
    </Stack>
  )
}
