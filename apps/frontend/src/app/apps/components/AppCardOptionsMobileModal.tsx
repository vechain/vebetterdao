"use-client"
import { Button, useClipboard, VStack, Skeleton, Dialog } from "@chakra-ui/react"
import { FaCopy, FaRegImage } from "react-icons/fa6"
import { CustomModalContent } from "@/components/CustomModalContent"
import { FaExternalLinkAlt } from "react-icons/fa"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toaster } from "@/components/ui/toaster"

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
  const { copy: onCopy } = useClipboard({ value: teamWalletAddress ?? "" })
  const { t } = useTranslation()
  const handleOnCopy = () => {
    onCopy()
    onClose()
    toaster.success({
      title: "Treasury address copied",
      duration: 3000,
      closable: true,
    })
  }

  const router = useRouter()
  const navigateToAppDetail = () => {
    router.push(`/apps/${xAppId}`)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose} placement="center">
      <Dialog.Backdrop />
      <CustomModalContent>
        <Dialog.Header>
          {t("Options")}
          <Dialog.CloseTrigger />
        </Dialog.Header>
        <Dialog.Body>
          <VStack gap={4} w="full">
            {showViewDetails && (
              <Button w="full" size="lg" colorPalette="gray" variant={"solid"} onClick={navigateToAppDetail}>
                <FaRegImage />
                {t("View details")}
              </Button>
            )}
            <Button w="full" size="lg" colorPalette="gray" variant={"solid"} onClick={handleOnCopy}>
              <FaCopy />
              {t("Copy team wallet address")}
            </Button>
            <Skeleton loading={isLoading} w="full">
              <Button
                variant={"solid"}
                size="lg"
                disabled={!externalUrl}
                colorPalette="gray"
                w="full"
                onClick={() => {
                  if (externalUrl) {
                    window.open(externalUrl, "_blank")
                  }
                }}>
                <FaExternalLinkAlt />
                {externalUrl ? "Go to the App" : "No App link available"}
              </Button>
            </Skeleton>
          </VStack>
        </Dialog.Body>
      </CustomModalContent>
    </Dialog.Root>
  )
}
