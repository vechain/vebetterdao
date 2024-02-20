import { useIsNFTClaimable } from "@/api"
import { useNFTImage } from "@/api/contracts/b3trBadge/hooks/useNFTImage"
import { useClaimNFT } from "@/hooks"
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { ShareButtons } from "./ShareButtons"

export const ClaimNFT = () => {
  const isNFTClaimable = useIsNFTClaimable()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const [fetchNFT, setFetchNFT] = useState(false)

  const { sendTransaction, sendTransactionPending } = useClaimNFT({
    onSuccess: () => {
      onOpen()
      setFetchNFT(true)
    },
  })

  const handleClaimNFT = useCallback(() => {
    sendTransaction(undefined)
  }, [sendTransaction])

  const { imageData, imageMetadata, isLoading: isLoadingImage, isError: isErrorImage } = useNFTImage(fetchNFT)

  const modalContent = useMemo(() => {
    if (isLoadingImage) {
      return (
        <ModalContent rounded="2xl" w="auto">
          <ModalBody display={"flex"} alignContent={"center"} alignItems={"center"}>
            <HStack justifyContent={"center"} w={"full"} gap={4}>
              <Spinner />
              <Text>Loading NFT</Text>
            </HStack>
          </ModalBody>
        </ModalContent>
      )
    }
    if (isErrorImage || !imageData) {
      return (
        <ModalContent rounded="2xl">
          <Alert rounded={"2xl"} status="error">
            <AlertDescription display="flex" flex="1">
              <Text>Failed to load NFT image</Text>
            </AlertDescription>
          </Alert>
        </ModalContent>
      )
    }
    return (
      <ModalContent w={"auto"} rounded="2xl">
        <ModalCloseButton />
        <ModalHeader>
          <Text textAlign={"center"}>Your new NFT 🎉</Text>
        </ModalHeader>
        <ModalBody display={"flex"} alignContent={"center"} alignItems={"center"}>
          <Box rounded="3xl" position={"relative"}>
            <Image src={imageData?.image} w={["full", "300px"]} aspectRatio="1/1" rounded="3xl" />
            <Box position={"absolute"} bottom={0} roundedBottom={"3xl"} bg={"#00000099"} w="full" py={2} px={4}>
              <Text color={"white"}>{imageMetadata?.name}</Text>
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter>
          <ShareButtons description="I just claimed an nft as voter in the B3tr DAO!" />
        </ModalFooter>
      </ModalContent>
    )
  }, [isErrorImage, isLoadingImage, imageData?.image])

  return (
    <>
      {isNFTClaimable && (
        <Alert rounded="2xl">
          <AlertDescription display="flex" flex="1">
            <Stack direction={["column", "row"]} justify="space-between" w={"full"} alignItems="center">
              <HStack gap={0}>
                <AlertIcon />
                <Text as="b" fontSize="md">
                  Claim your NFT
                </Text>
              </HStack>
              <Text>You can claim your NFT as a voter here.</Text>
              <Button colorScheme="blue" isLoading={sendTransactionPending} onClick={handleClaimNFT}>
                Claim NFT
              </Button>
            </Stack>
          </AlertDescription>
        </Alert>
      )}

      <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
        <ModalOverlay />
        {modalContent}
      </Modal>
    </>
  )
}
