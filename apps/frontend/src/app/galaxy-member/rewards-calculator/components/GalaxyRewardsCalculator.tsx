// import { useTranslation } from "react-i18next"
import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { GalaxyCarrousel } from "./GalaxyCarrousel"
import { Heading, Box, Card, HStack, Input, Image, Stack, CardBody, Spinner } from "@chakra-ui/react"

// useAllocationsRoundsEvents
// import { useVotingRewards } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

export const GalaxyRewardsCalculator = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  if (!account) throw new Error("Account is required")

  // gmRewardMultiplier, isXNodeAttachedToGM
  // const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  // error: allocationRoundEventsError

  // const [selectedAccountRoundId, setselectedAccountRoundId] = useState<string | undefined>()
  // const [selectedRoundId, setselectedRoundId] = useState<string | undefined>()
  const [selectedGMLevel, setSelectedGMLevel] = useState<string | undefined>(undefined)
  const [inputVOT3, setInputVOT3] = useState<number | undefined>(undefined)
  const [estimateRewards, setEstimateRewards] = useState<number | undefined>(undefined)
  const [isLoading, setLoading] = useState<boolean>(false)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputVOT3(value ? parseFloat(value) : undefined)
  }
  // const [b3TRRewardsApprox, setB3TRRewardsApprox] = useState<number | null>(null)

  // const { data: votingRewardsData, isLoading } = useVotingRewards(
  //   selectedAccountRoundId,
  //   account,
  // )
  // const roundsRewards = votingRewardsData?.roundsRewards

  // TODO : find the hooks that fetch that
  // rounds should look like that [] a list with a value roundId: "1", roundId: "2", roundId: "3"...

  // const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  // const handleAccountRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setselectedAccountRoundId(e.target.value)
  // }

  // const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setselectedRoundId(e.target.value)
  // }

  // const selectedRoundReward = roundsRewards?.find(reward => reward.roundId === selectedAccountRoundId)

  // CAROUSEL

  // const b3TR_rewards_approx = usePotentialRewards(selectedRoundId, account, selectedGMLevel)
  // useEffect(() => {
  //   if (b3TR_rewards_approx) setB3TRRewardsApprox(b3TR_rewards_approx?.rewards)
  // }, [selectedNft, account, selectedRoundId])

  const handleNftSelect = (GMLevel: string | undefined) => {
    setSelectedGMLevel(GMLevel)
  }

  useMemo(() => {
    setLoading(true)
    if (!selectedGMLevel || !inputVOT3) {
      setEstimateRewards(undefined)
      return
    }
    // Example calculation (TODO: replace with the usePotentialRewards once finished hook)
    const _estimateRewards = (inputVOT3 * parseFloat(selectedGMLevel)).toFixed(2)
    setEstimateRewards(parseFloat(_estimateRewards))
    setLoading(false)
  }, [selectedGMLevel, inputVOT3])

  console.log("selectedGMLevel", selectedGMLevel)
  return (
    <Card
      variant="baseWithBorder"
      position="relative"
      overflow={"hidden"}
      alignItems="center"
      w={"full"}
      style={{
        backgroundImage: `url('/images/stardust.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}>
      <CardBody>
        <Heading color={"white"}>{t("Rewards calculator")}</Heading>

        <Stack
          // border={"1px solid yellow"}
          direction={["column", "column", "row"]}
          gap={4}
          h={"full"}
          justifyContent={"space-between"}>
          <GalaxyCarrousel setSelectedGMLevel={handleNftSelect} />

          {/* TODO: SIZE of the 2 BOX SMALLER FOR SMALLER SCREENS  */}
          <Stack spacing={4} alignItems="center" justifyContent="flex-end">
            {/* VOT3 Input Card */}

            <Box
              py={4}
              px={4}
              bg="gray.900"
              shadow="lg"
              rounded="lg"
              h="32"
              w="full"
              style={{ backgroundImage: "linear-gradient(90deg, rgb(127, 140, 255), rgb(152, 163, 255))" }}>
              <Box
                borderLeft="4px"
                borderColor="lime.300"
                pl={4}
                h="full"
                display="flex"
                flexDirection="column"
                justifyContent="space-between">
                <Heading fontSize="x-large">{t("VOT3 amount")}</Heading>
                <HStack display="flex" alignItems="center">
                  <Image boxSize="7" rounded="full" bg="gray.800" src="/images/logo/vot3_logo.svg/" alt="" />
                  <Input
                    type="number"
                    bg="transparent"
                    fontWeight="semibold"
                    px={2}
                    w="full"
                    fontSize="4xl"
                    placeholder="Powered VOT3"
                    border="none"
                    focusBorderColor="none"
                    value={inputVOT3 !== undefined ? inputVOT3 : ""}
                    onChange={handleInputChange}
                  />
                </HStack>
              </Box>
            </Box>

            {/* Estimated Rewards Output Card */}
            <Box
              py={4}
              px={4}
              bg="gray.900"
              shadow="lg"
              rounded="lg"
              h="32"
              w="full"
              style={{ backgroundImage: "linear-gradient(90deg, rgb(236, 255, 176), rgb(247, 255, 215))" }}>
              <Box
                borderLeft="4px"
                borderColor="lime.300"
                pl={4}
                h="full"
                display="flex"
                flexDirection="column"
                justifyContent="space-between">
                <Heading fontSize="x-large">{t("Estimated Rewards")}</Heading>
                <HStack display="flex" alignItems="center">
                  <Image boxSize="7" rounded="full" bg="gray.800" src="/images/logo/b3tr_logo.svg/" alt="" />
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <Input
                      type="text"
                      bg="transparent"
                      color="gray.900"
                      fontWeight="semibold"
                      px={2}
                      w="full"
                      fontSize="4xl"
                      focusBorderColor="none"
                      placeholder="0"
                      readOnly
                      value={estimateRewards} // TODO : Dynamic values
                    />
                  )}
                </HStack>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </CardBody>
    </Card>

    // <>
    //   <Stack w="full" flexDirection={["column", "column", "column"]} border={"1px solid black"}>
    //     <VStack>
    //       <Heading> Actual NFT </Heading>
    //       <Box boxSize="200px" padding={"10px"}>
    //         <Skeleton isLoaded={!isGMLoading}>
    //           {gmLevel && <Image src={gmNfts.find(nft => nft.level === gmLevel)?.image} alt={gmName} />}
    //         </Skeleton>
    //       </Box>
    //     </VStack>
    //     <VStack>
    //       <Select placeholder="Select round" onChange={handleAccountRoundChange}>
    //         {invertedCreatedRounds?.map(round => (
    //           <option key={round.roundId} value={round.roundId}>
    //             {round.roundId}
    //           </option>
    //         ))}
    //       </Select>

    //       <Skeleton isLoaded={!rewardsAccountLoading}>
    //         <Text>Rewards: {selectedRoundReward?.formattedRewards}</Text>

    //         <Text>{selectedRoundReward?.formattedRewards}</Text>
    //       </Skeleton>
    //       <Text>{/* Descriptioni of the GM NFT */}</Text>
    //     </VStack>
    //   </Stack>

    //   <Stack>
    //     <GalaxyCarrousel selectedGMLevel={handleNftSelect} />

    //   </Stack>
    //   </>
    // <Stack w="full" flexDirection={["column", "column", "row"]} border={"1px solid black"}>
    //   <Heading> Estimated Rewards: </Heading>

    //   <VStack>
    //     <Select placeholder="Select round" onChange={handleAccountRoundChange}>
    //       {invertedCreatedRounds?.map(round => (
    //         <option key={round.roundId} value={round.roundId}>
    //           {round.roundId}
    //         </option>
    //       ))}
    //     </Select>

    //     <GalaxyCarrousel selectedGMLevel={handleNftSelect} />
    //     <Text>{b3TRRewardsApprox}</Text>
    //     <HStack>
    //       {/* TODO:  MAKE A LITTLE ANIMATION TO SAY -> YOU ARE EARNING +x% BY UPGRADING YOUR NFT (make a pourcentage ) */}
    //       {/* Percentage_Increase=((Old_Value - New_Value)/Old_Value)*100 */}
    //     </HStack>

    //     <Text>{/* Descriptioni of the GM NFT */}</Text>
    //   </VStack>
    // </Stack>
    // <Box>
    //   {/* OK Premiere partie */}
    //   {/* Maybe no need because it's taking in charge in the previous modal ???? Need to check when running the project */}
    //   <HStack>
    //     {/* Nothing to show if the connected wallet don't have GMNFT attached to his wallet ( or say, you don't have GMNFT attached ) */}
    //     <Heading>{}</Heading>
    //     <Skeleton isLoaded={!isGMLoading}>
    //       {gmLevel ? <Image src={gmNfts.find(nft => nft.level === gmLevel)?.image} alt={gmName} /> : <Text>{}</Text>}
    //     </Skeleton>
    //     {gmLevel ? <Image src={gmNfts.find(nft => nft.level === gmLevel)?.image} alt={gmName} /> : <Text>{}</Text>}

    //     <VStack>
    //       <Heading> {}</Heading>

    //       <Select placeholder="Select round" onChange={handleAccountRoundChange}>
    //         {invertedCreatedRounds?.map(round => (
    //           <option key={round.roundId} value={round.roundId}>
    //             {round.roundId}
    //           </option>
    //         ))}
    //       </Select>

    //       <Skeleton isLoaded={!rewardsAccountLoading}>
    //         {/* <Text>Rewards: {selectedRoundReward?.formattedRewards}</Text> */}

    //         <Text>{selectedRoundReward?.formattedRewards}</Text>
    //       </Skeleton>
    //     </VStack>
    //   </HStack>

    //   <HStack>
    //     {/* <Heading> Estimated Rewards: </Heading> */}

    //     <Select placeholder="Select round" onChange={handleRoundChange}>
    //       {invertedCreatedRounds?.map(round => (
    //         <option key={round.roundId} value={round.roundId}>
    //           {round.roundId}
    //         </option>
    //       ))}
    //     </Select>
    //     {/* TODO see how that works */}
    //     <GalaxyCarrousel selectedGMLevel={handleNftSelect} />

    //     <Text>{b3TRRewardsApprox}</Text>
    //     {/* Estimate Rewards:  */}
    //     <HStack>
    //       {/* TODO:  MAKE A LITTLE ANIMATION TO SAY -> YOU ARE EARNING +x% BY UPGRADING YOUR NFT (make a pourcentage ) */}
    //       {/* Percentage_Increase=((Old_Value - New_Value)/Old_Value)*100 */}
    //     </HStack>
    //   </HStack>
    // </Box>
  )
}

export type InputBoxProps = {
  value?: string
}
export const InputBox = ({ value }: InputBoxProps) => {
  return (
    <Input
      type="text"
      bg="transparent"
      color="gray.900"
      fontWeight="semibold"
      px={2}
      w="full"
      fontSize="4xl"
      focusBorderColor="none"
      placeholder="0"
      readOnly
      value={value} // TODO : Dynamic values
    />
  )
}
