import { useB3trBadgeBalance, useIsNFTClaimable, useParticipatedInGovernance } from "@/api"
import { useNFTImage } from "@/api/contracts/b3trBadge/hooks/useNFTImage"
import { useClaimNFT } from "@/hooks"
import {
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { ShareButtons } from "../ShareButtons"
import { useWallet } from "@vechain/dapp-kit-react"
import { motion } from "framer-motion"
import { RiArrowRightSLine } from "react-icons/ri"

// Convert Button to a motion component
const MotionImage = motion(Image)

const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
}

const flipAnimation = {
  animate: {
    rotateY: [0, 360],
    scale: [1, 0.7, 1],
    borderRadius: ["20%", "50%", "20%"],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
}

export const GmNFT = () => {
  const { isClaimable: isNFTClaimable, isOwned } = useIsNFTClaimable()

  const { account } = useWallet()

  const { isLoading: isLoadingHasVoted } = useParticipatedInGovernance(account)

  const { data: nftBalance, isLoading: isLoadingNftBalance } = useB3trBadgeBalance(account)

  const buttonColor = useColorModeValue("400", "300")

  const nftCardColor = useColorModeValue("50", "100")
  const nftCardBorderColor = useColorModeValue("500", "600")
  const nftToClaimColorCard = useColorModeValue("300", "400")
  const nftOwnedColorCard = useColorModeValue("100", "200")

  const { isOpen, onClose, onOpen } = useDisclosure()

  const { sendTransaction: freeMint, isTxReceiptLoading, sendTransactionPending } = useClaimNFT({ onFailure: onClose })

  const { imageData, imageMetadata, tokenID, isLoading: isLoadingNFT, isError: isErrorImage } = useNFTImage()

  const handleFreeMint = useCallback(() => {
    freeMint()
    onOpen()
  }, [freeMint, onOpen])

  const isClaimDisabled = useMemo(() => {
    return nftBalance !== undefined && nftBalance > 0
  }, [nftBalance])

  const isClaimLoading = useMemo(() => {
    return isLoadingNftBalance || isLoadingHasVoted || sendTransactionPending
  }, [isLoadingNftBalance, isLoadingHasVoted, isTxReceiptLoading, sendTransactionPending])

  const showLoader = isClaimLoading || isLoadingNFT || imageData === undefined

  const modalContent = useMemo(() => {
    if (showLoader)
      return (
        <ModalContent rounded="2xl" w="auto">
          <ModalBody py={6} px={12}>
            <VStack alignItems={"center"}>
              <MotionImage {...flipAnimation} src="/images/b3trvot3-tokens.png" maxH="250px" />
              {isClaimLoading /* isClaimLoading */ && (
                <Text fontWeight={600} lineHeight="22px" fontSize={{ base: "18px", md: "20px" }}>
                  Waiting for confirmation
                </Text>
              )}
              {(isLoadingNFT || isTxReceiptLoading) && (
                <Text fontWeight={600} lineHeight="22px" fontSize={{ base: "18px", md: "20px" }} align={"center"}>
                  Almost there...
                </Text>
              )}
            </VStack>{" "}
          </ModalBody>
        </ModalContent>
      )

    return (
      <ModalContent w={"auto"} rounded="2xl">
        <ModalCloseButton />
        <ModalBody display={"flex"} alignContent={"center"} alignItems={"center"} pt={12} px={12}>
          <VStack alignItems={"center"}>
            <Image src={imageData?.image} w={["full", "300px"]} aspectRatio="1/1" rounded="3xl" />
            <Heading alignSelf={"center"} size={"lg"} mt={4} textAlign={"center"}>
              GM Earth #{tokenID}
            </Heading>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <ShareButtons description="I just claimed an nft as voter in the B3tr DAO!" />
        </ModalFooter>
      </ModalContent>
    )
  }, [isErrorImage, isLoadingNFT, imageData?.image, imageMetadata?.name, isClaimLoading, showLoader])

  return (
    <>
      {isNFTClaimable && (
        <Card w="full">
          <CardBody>
            <VStack spacing={4} align="flex-start" w={"full"}>
              <Heading size="md">Galaxy Member</Heading>
              <VStack spacing={8} w="full">
                <HStack
                  color={"black"}
                  w="full"
                  justifyContent={"start"}
                  bg={`secondary.${nftCardColor}`}
                  borderRadius="8px"
                  borderColor={`secondary.${nftCardBorderColor}`}
                  borderWidth={1}
                  spacing={4}>
                  <MotionImage {...pulseAnimation} src="/images/gm-nft-placeholder.png" maxH="110px" />

                  <VStack alignItems={"self-start"} spacing={3} pr={4}>
                    <Text fontWeight={600} lineHeight="22px" fontSize={{ base: "18px", md: "20px" }}>
                      You have a new badge
                    </Text>
                    <Button
                      size="sm"
                      isDisabled={isClaimDisabled}
                      isLoading={isClaimLoading}
                      onClick={handleFreeMint}
                      color="white"
                      bgColor={`primary.${buttonColor}`}
                      borderRadius={8}
                      _hover={{ bgColor: `primary.${nftToClaimColorCard}` }}>
                      Mint now
                    </Button>
                  </VStack>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {isOwned && (
        <Card w="full">
          <CardBody>
            <VStack spacing={4} align="flex-start" w={"full"}>
              <HStack justifyContent={"space-between"} w="full">
                <Heading size="md">Galaxy Member</Heading>
              </HStack>
              <VStack spacing={8} w="full">
                <HStack
                  w="full"
                  color={"#1e1e1e"}
                  bg={`primary.${nftCardColor}`}
                  borderRadius="8px"
                  borderColor={`primary.${nftCardBorderColor}`}
                  borderWidth={1}
                  spacing={4}
                  pr={4}
                  pl={2}
                  onClick={onOpen}
                  cursor={"pointer"}
                  _hover={{
                    bgColor: `primary.${nftOwnedColorCard}`,
                    transition: "all 0.3s ease-in-out",
                  }}>
                  <HStack w="full" justifyContent={"start"}>
                    <Box p={4}>
                      <Image {...pulseAnimation} src={imageData?.image} maxH="90px" borderRadius={16} />
                    </Box>

                    <Text fontWeight={600} lineHeight="22px" fontSize={{ base: "18px", md: "20px" }}>
                      GM Earth #{tokenID}
                    </Text>
                  </HStack>
                  <Box>
                    <RiArrowRightSLine size={32} />
                  </Box>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
        <ModalOverlay />
        {modalContent}
      </Modal>
    </>
  )
}
