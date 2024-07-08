import { useGMbalance, useIsGMclaimable, useParticipatedInGovernance } from "@/api"
import { useNFTImage } from "@/api/contracts/galaxyMember/hooks/useNFTImage"
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
import { coinFlipAnimation, pulseAnimation } from "@/constants"
import { NFTWithRings } from "./components"
import { useTranslation } from "react-i18next"

// Convert Button to a motion component
const MotionImage = motion(Image)

export const GmNFT = () => {
  const { isClaimable: isNFTClaimable, isOwned } = useIsGMclaimable()

  const { account } = useWallet()
  const { t } = useTranslation()
  const { isLoading: isLoadingHasVoted } = useParticipatedInGovernance(account)

  const { data: nftBalance, isLoading: isLoadingNftBalance } = useGMbalance(account)

  const nftCardColor = useColorModeValue("50", "100")
  const nftCardBorderColor = useColorModeValue("500", "600")

  const { isOpen, onClose, onOpen } = useDisclosure()

  const { sendTransaction: freeMint, isTxReceiptLoading, sendTransactionPending } = useClaimNFT({ onFailure: onClose })

  const { imageData, tokenID, isLoading: isLoadingNFT } = useNFTImage()

  const handleFreeMint = useCallback(() => {
    freeMint()
    onOpen()
  }, [freeMint, onOpen])

  const isClaimDisabled = useMemo(() => {
    return nftBalance !== undefined && nftBalance > 0
  }, [nftBalance])

  const isClaimLoading = useMemo(() => {
    return isLoadingNftBalance || isLoadingHasVoted || sendTransactionPending
  }, [isLoadingNftBalance, isLoadingHasVoted, sendTransactionPending])

  const showLoader = isClaimLoading || isLoadingNFT || imageData === undefined

  const modalContent = useMemo(() => {
    if (showLoader)
      return (
        <ModalContent rounded="2xl" w="auto">
          <ModalBody py={6} px={12}>
            <VStack alignItems={"center"}>
              <MotionImage {...coinFlipAnimation} src="/images/gm-nft-placeholder.png" maxW="250px" />
              {isClaimLoading /* isClaimLoading */ && (
                <Text fontWeight={400} lineHeight="22px" fontSize={{ base: "16px", md: "16px" }} align={"center"}>
                  {t("Please confirm the transaction in your wallet")}
                </Text>
              )}
              {(isLoadingNFT || isTxReceiptLoading) && (
                <Text fontWeight={400} lineHeight="22px" fontSize={{ base: "16px", md: "16px" }}>
                  {t("Almost there...")}
                </Text>
              )}
            </VStack>{" "}
          </ModalBody>
        </ModalContent>
      )

    return (
      <ModalContent
        rounded="2xl"
        data-testid="gmnft-modal"
        bgGradient={"radial-gradient(76.36% 85.35% at 50.12% 27.48%, #304828 0%, #01091B 100%)"}>
        <ModalCloseButton color={"white"} />
        <ModalBody
          display={"flex"}
          alignContent={"center"}
          alignItems={"center"}
          pt={{ base: 14, md: 20 }}
          px={{ base: 12, md: 20 }}>
          <VStack alignItems={"center"}>
            <Text
              alignSelf={"center"}
              size={"lg"}
              mb={{ base: 4, md: 8 }}
              textAlign={"center"}
              data-testid={"gmnft-token-id"}
              color={"white"}
              fontSize={28}
              fontWeight={700}>
              {t("VeBetterDAO")} <br /> {t("Governance")}
            </Text>

            <NFTWithRings image={imageData?.image} tokenID={tokenID} />
            <Text
              alignSelf={"center"}
              size={"lg"}
              mt={{ base: 4, md: 8 }}
              textAlign={"center"}
              data-testid={"gmnft-token-id"}
              color={"white"}
              fontSize={24}
              fontWeight={600}>
              {t("GM Earth")}
            </Text>
            <Text
              alignSelf={"center"}
              size={"lg"}
              textAlign={"center"}
              data-testid={"gmnft-token-id"}
              color={"white"}
              fontSize={16}
              fontWeight={500}>
              {t("#")}
              {tokenID}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent={"center"} pb={{ base: 14, md: 20 }}>
          <ShareButtons descriptionEncoded="As%20a%20Voter%20in%20VeBetterDAO%2C%20I%E2%80%99ve%20just%20minted%20my%20GM%20Earth%20NFT.%20%F0%9F%8C%8D%0A%0AGet%20yours%20here%20%F0%9F%91%89%20%20https%3A%2F%2Fgovernance.vebetterdao.org%2F%0A%0A%23GalaxyMember%20%23VeBetterDAO" />
        </ModalFooter>
      </ModalContent>
    )
  }, [showLoader, isClaimLoading, t, isLoadingNFT, isTxReceiptLoading, imageData?.image, tokenID])

  return (
    <>
      {isNFTClaimable && (
        <Card w="full" variant={"baseWithBorder"}>
          <CardBody>
            <VStack spacing={4} align="flex-start" w={"full"}>
              <Heading size="md">{t("Galaxy Member")}</Heading>
              <VStack spacing={4} w="full">
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
                      {t("You have a new GM NFT")}
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  isDisabled={isClaimDisabled}
                  isLoading={isClaimLoading}
                  onClick={handleFreeMint}
                  color="white"
                  variant={"primaryAction"}
                  borderRadius={"full"}
                  w={"full"}>
                  {t("Mint now")}
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {isOwned && (
        <Card w="full" variant="baseWithBorder">
          <CardBody>
            <VStack spacing={4} align="flex-start" w={"full"}>
              <HStack justifyContent={"space-between"} w="full">
                <Heading size="md">{t("Galaxy Member")}</Heading>
              </HStack>
              <VStack spacing={8} w="full">
                <HStack
                  w="full"
                  color={"#1e1e1e"}
                  bg={`#F8F8F8`}
                  _hover={{
                    bgGradient:
                      "radial-gradient(76.36% 85.35% at 50.12% 27.48%, rgba(230, 252, 207, 0.82) 38.14%, rgba(194, 212, 254, 0.82) 100%), #7DF000",
                  }}
                  borderRadius="8px"
                  borderColor={`#D5D5D5`}
                  borderWidth={1}
                  spacing={4}
                  pr={4}
                  pl={2}
                  onClick={onOpen}
                  cursor={"pointer"}>
                  <HStack w="full" justifyContent={"start"}>
                    <Box
                      p={2}
                      bgGradient={
                        "radial-gradient(113.65% 122.7% at 52.87% 0%, #BDF87C 45.8%, #4575E1 70.4%, #004CFC 88.37%)"
                      }
                      borderRadius={16}
                      m={2}
                      boxShadow={"0px 2.773px 9.473px -2.079px #0019A0"}>
                      <Image src={imageData?.image} maxH="100px" borderRadius={16} alt="gm-image" />
                    </Box>

                    <Text fontWeight={600} lineHeight="22px" fontSize={{ base: "18px", md: "20px" }}>
                      {t("GM Earth #")}
                      {tokenID}
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
