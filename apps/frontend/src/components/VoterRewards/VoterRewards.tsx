import { useAllocationsRoundsEvents, useCurrentAllocationsRoundId, useVotingRewards } from "@/api"
import {
  Card,
  CardBody,
  HStack,
  Heading,
  VStack,
  Text,
  Button,
  useColorModeValue,
  Box,
  Image,
  useDisclosure,
  ModalOverlay,
  ModalBody,
  Modal,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import React, { useCallback, useMemo } from "react"
import BigNumber from "bignumber.js"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { TbGift } from "react-icons/tb"
import { coinFlipAnimation } from "@/constants"
import { motion } from "framer-motion"
import { B3TRIcon } from "../Icons"
import { SuccessModalContent } from "../TransactionModal/SuccessModalContent"
import { CustomModalContent } from "../CustomModalContent"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(DECIMAL_PLACES)

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

  const {
    sendTransaction,
    resetStatus,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    txReceipt,
    sendTransactionTx,
  } = useClaimRewards({
    roundRewards,
  })

  const handleClaim = useCallback(() => {
    sendTransaction()
    onOpen()
  }, [sendTransaction, onOpen])

  const isClaimRewardsLoading = isTxReceiptLoading || sendTransactionPending

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  const modalContent = useMemo(() => {
    if (status === "success") {
      return (
        <SuccessModalContent
          title={"Rewards Claimed!"}
          showSocialButtons
          socialDescriptionEncoded="%F0%9F%8E%89%20Just%20claimed%20my%20%24B3TR%20rewards%20for%20voting%20in%20the%20%23VeBetterDAO%21%20%0A%0AJoin%20us%20and%20have%20your%20say%20in%20the%20future%20of%20sustainability%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
          showExplorerButton
          txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        />
      )
    }

    if (isClaimRewardsLoading)
      return (
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
      )
  }, [status, isClaimRewardsLoading, isTxReceiptLoading, sendTransactionPending, txReceipt, sendTransactionTx])

  if (allocationRoundsEvents?.created.length === 0) return null

  return (
    <>
      <Card w="full">
        <Image src="/images/voter-rewards-bg.svg" position={"absolute"} zIndex={0} alt="voter-rewards-background" />
        <CardBody p={6}>
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
              <Heading size={{ base: "2xl", md: "xl" }} test-dataid="voting-rewards">
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
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        trapFocus={true}
        isCentered={true}
        closeOnOverlayClick={status !== "waitingConfirmation" && status !== "pending"}>
        <ModalOverlay />
        <CustomModalContent>{modalContent}</CustomModalContent>
      </Modal>
    </>
  )
}
