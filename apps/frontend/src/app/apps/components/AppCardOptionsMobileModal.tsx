"use-client"
import {
  Button,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  useClipboard,
  useToast,
  Link,
  VStack,
  ModalBody,
  ModalHeader,
  Skeleton,
} from "@chakra-ui/react"
import { FaCopy } from "react-icons/fa6"
import { CustomModalContent } from "@/components/CustomModalContent"
import { FaExternalLinkAlt } from "react-icons/fa"
export type Props = {
  isOpen: boolean
  onClose: () => void
  receiverAddress: string
  externalUrl?: string
  isLoading?: boolean
}

export const AppCardOptionsMobileModal = ({ isOpen, onClose, receiverAddress, externalUrl, isLoading }: Props) => {
  const { onCopy } = useClipboard(receiverAddress)

  const toast = useToast()
  const handleOnCopy = () => {
    onCopy()
    onClose()
    toast({
      title: "App receiver address copied",
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalHeader>
          Options
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4} w="full">
            <Button
              w="full"
              size="lg"
              colorScheme="gray"
              variant={"solid"}
              onClick={handleOnCopy}
              leftIcon={<FaCopy />}>
              Copy receiver address
            </Button>
            <Skeleton isLoaded={!isLoading} w="full">
              <Button
                as={Link}
                href={externalUrl ?? ""}
                isExternal
                variant={"solid"}
                size="lg"
                disabled={!externalUrl}
                leftIcon={<FaExternalLinkAlt />}
                colorScheme="gray"
                w="full">
                {externalUrl ? "Go to the App" : "No App link available"}
              </Button>
            </Skeleton>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
