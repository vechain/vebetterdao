import { useGMbalance, useParticipatedInGovernance } from "@/api"
import { useNFTImage } from "@/api/contracts/galaxyMember/hooks/useNFTImage"
import { CustomModalContent } from "@/components/CustomModalContent"
import { NFTWithRings } from "@/components/GmNFT/components"
import { ShareButtons } from "@/components/ShareButtons"
import { coinFlipAnimation } from "@/constants"
import {
  Card,
  CardBody,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  UseDisclosureReturn,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { motion } from "framer-motion"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

// Convert Button to a motion component
const MotionImage = motion(Image)

type Props = {
  mintNftModal: UseDisclosureReturn
  sendTransactionPending: boolean
  isTxReceiptLoading: boolean
}

export const MintNFTModal = ({
  mintNftModal: { isOpen, onClose },
  sendTransactionPending,
  isTxReceiptLoading,
}: Props) => {
  const { account } = useWallet()

  const { isLoading: isLoadingNftBalance } = useGMbalance(account)
  const { isLoading: isLoadingHasVoted } = useParticipatedInGovernance(account)

  const isClaimLoading = useMemo(() => {
    return isLoadingNftBalance || isLoadingHasVoted || sendTransactionPending
  }, [isLoadingHasVoted, isLoadingNftBalance, sendTransactionPending])
  const { imageData, tokenID, isLoading: isLoadingNFT } = useNFTImage()

  const showLoader = isClaimLoading || isLoadingNFT || imageData === undefined
  const { t } = useTranslation()

  const modalContent = useMemo(() => {
    if (showLoader)
      return (
        <VStack alignItems={"center"} py={6} px={12}>
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
        </VStack>
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
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent w={"auto"} maxW={"container.md"}>
        <Card rounded={20}>
          <CardBody>{modalContent}</CardBody>
        </Card>
      </CustomModalContent>
    </Modal>
  )
}
