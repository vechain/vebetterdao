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
import { FaCopy, FaRegImage } from "react-icons/fa6"
import { CustomModalContent } from "@/components/CustomModalContent"
import { FaExternalLinkAlt } from "react-icons/fa"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export type Props = {
  isOpen: boolean
  onClose: () => void
  teamWalletAddress?: string
  xAppId?: string
  externalUrl?: string
  isLoading?: boolean
  showViewDetails?: boolean
}

export const AppCardOptionsMobileModal = ({
  isOpen,
  onClose,
  teamWalletAddress,
  externalUrl,
  isLoading,
  xAppId,
  showViewDetails = false,
}: Props) => {
  const { onCopy } = useClipboard(teamWalletAddress ?? "")
  const { t } = useTranslation()
  const toast = useToast()
  const handleOnCopy = () => {
    onCopy()
    onClose()
    toast({
      title: "Treasury address copied",
      status: "success",
      duration: 3000,
      isClosable: true,
    })
  }

  const router = useRouter()
  const navigateToAppDetail = () => {
    router.push(`/apps/${xAppId}`)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalHeader>
          {t("Options")}
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <VStack spacing={4} w="full">
            {showViewDetails && (
              <Button
                w="full"
                size="lg"
                colorScheme="gray"
                variant={"solid"}
                onClick={navigateToAppDetail}
                leftIcon={<FaRegImage />}>
                {t("View details")}
              </Button>
            )}
            <Button
              w="full"
              size="lg"
              colorScheme="gray"
              variant={"solid"}
              onClick={handleOnCopy}
              leftIcon={<FaCopy />}>
              {t("Copy team wallet address")}
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
