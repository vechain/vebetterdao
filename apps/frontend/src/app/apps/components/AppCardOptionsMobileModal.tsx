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
import { XApp, useXAppMetadata } from "@/api"
import { CustomModalContent } from "@/components/CustomModalContent"
import { FaExternalLinkAlt } from "react-icons/fa"
export type Props = {
  isOpen: boolean
  onClose: () => void
  xApp: XApp
}

export const AppCardOptionsMobileModal = ({ isOpen, onClose, xApp }: Props) => {
  const { data: appMetadata, isLoading: appMetadataLoading } = useXAppMetadata(xApp.id)

  const { onCopy } = useClipboard(xApp.receiverAddress)

  const toast = useToast()
  const handleOnCopy = () => {
    onCopy()
    onClose()
    toast({
      title: "dApp receiver address copied",
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
            <Skeleton isLoaded={!appMetadataLoading} w="full">
              <Button
                as={Link}
                href={appMetadata?.external_url ?? ""}
                isExternal
                variant={"solid"}
                size="lg"
                disabled={!appMetadata?.external_url}
                leftIcon={<FaExternalLinkAlt />}
                colorScheme="gray"
                w="full">
                {appMetadata?.external_url ? "Go to the dApp" : "No dApp link available"}
              </Button>
            </Skeleton>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
