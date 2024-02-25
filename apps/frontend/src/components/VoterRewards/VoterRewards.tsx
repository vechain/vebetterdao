import { useAllocationsRoundsEvents, useCurrentAllocationsRoundId, useVotingRewards } from "@/api"
import {
  Card,
  CardBody,
  HStack,
  Heading,
  VStack,
  Text,
  Button,
  Flex,
  useColorModeValue,
  Box,
  Image,
  useDisclosure,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Modal,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import React, { useCallback, useMemo } from "react"
import BigNumber from "bignumber.js"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { backdropBlurAnimation } from "@/app/theme"
import { TbGift } from "react-icons/tb"
import { coinFlipAnimation } from "@/constants"
import { motion } from "framer-motion"
import { B3TRIcon } from "../Icons"

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: DECIMAL_PLACES,
})

// Convert Button to a motion component
const MotionImage = motion(Image)

export const VoterRewards: React.FC = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()

  const rewardsPerRound = useVotingRewards(currentRoundId, account ?? undefined)
  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()

  const { isOpen, onClose, onOpen } = useDisclosure()

  const iconColor = useColorModeValue("800", "900")

  const iconBgColor = useColorModeValue("200", "300")

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

    return totalRewards.decimalPlaces(DECIMAL_PLACES, BigNumber.ROUND_DOWN).toString()
  }, [totalRewards])

  const isRewardsLoading = rewardsPerRound?.some(reward => reward.isLoading) // Loading rewards to claim

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending } = useClaimRewards({
    roundRewards,
    onSuccess: onClose,
    onFailure: onClose,
  })

  const handleClaim = useCallback(() => {
    sendTransaction()
    onOpen()
  }, [sendTransaction, onOpen])

  const isClaimRewardsLoading = isTxReceiptLoading || sendTransactionPending

  const modalContent = useMemo(() => {
    if (isClaimRewardsLoading)
      return (
        <ModalContent rounded="2xl" w="auto">
          <ModalBody py={6} px={12}>
            <VStack alignItems={"center"}>
              <MotionImage {...coinFlipAnimation} src="/images/b3tr-token-3d.png" maxH="250px" />
              {sendTransactionPending /* sendTransactionPending */ && (
                <Text fontWeight={400} lineHeight="22px" fontSize={{ base: "16px", md: "16px" }} align={"center"}>
                  Please confirm the transaction in your wallet
                </Text>
              )}
              {isTxReceiptLoading && (
                <Text fontWeight={400} lineHeight="22px" fontSize={{ base: "16px", md: "16px" }}>
                  Almost there...
                </Text>
              )}
            </VStack>{" "}
          </ModalBody>
        </ModalContent>
      )
  }, [isClaimRewardsLoading, sendTransactionPending, isTxReceiptLoading])

  return (
    <>
      <Card w="full">
        <Image src="/images/voter-rewards-bg.svg" position={"absolute"} zIndex={0} />

        <CardBody p={6} zIndex={1}>
          <VStack spacing={4} w="full" align={"flex-start"}>
            <HStack w="full" justify={"space-between"}>
              <Box bgColor={`secondary.${iconBgColor}`} p={4} borderRadius={32} color={`secondary.${iconColor}`}>
                <TbGift size={22} />
              </Box>
            </HStack>

            <Box>
              <Heading size="md">Voting Rewards</Heading>
              <Text fontSize={14} mt={1}>
                Participate for a better future and get rewarded.
              </Text>
            </Box>

            <HStack w="full" spacing={4}>
              <Heading size={{ base: "2xl", md: "xl" }}>
                {compactFormatter.format(Number(totalRewardsFormatted))}
              </Heading>
              <B3TRIcon boxSize="auto" />
            </HStack>

            <Button
              mt={2}
              isDisabled={totalRewards?.eq(0)}
              isLoading={isRewardsLoading || isClaimRewardsLoading}
              onClick={handleClaim}
              colorScheme="primary"
              borderRadius={"full"}
              w={"full"}>
              Claim
            </Button>
          </VStack>
        </CardBody>
        {!account && (
          <Flex
            borderRadius={"lg"}
            backdropFilter="blur(10px)"
            position={"absolute"}
            h={"100%"}
            w={"100%"}
            align="center"
            justify="center"
            zIndex={2}>
            <Card>
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

        {allocationRoundsEvents && allocationRoundsEvents?.created.length === 0 && (
          <Flex
            borderRadius={"lg"}
            backdropFilter="blur(10px)"
            animation={backdropBlurAnimation("0px", "10px")}
            position={"absolute"}
            h={"100%"}
            w={"100%"}
            align="center"
            justify="center">
            <Card w={["90%", "50%", "40%"]}>
              <CardBody>
                <VStack gap={4}>
                  <Heading fontSize="md" textAlign={"center"}>
                    Coming soon
                  </Heading>
                </VStack>
              </CardBody>
            </Card>
          </Flex>
        )}
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
        <ModalOverlay />
        {modalContent}
      </Modal>
    </>
  )
}
