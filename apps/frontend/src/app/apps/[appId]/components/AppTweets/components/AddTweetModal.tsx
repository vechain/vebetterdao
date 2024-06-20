import { useTweet } from "@/api/twitter/hooks/useTweets"
import { CustomModalContent, TransactionModal } from "@/components"
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { RiTwitterXFill } from "react-icons/ri"
import { EmbeddedTweet, TweetSkeleton } from "react-tweet"
import "./tweetStyle.css"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { getXAppMetadataQueryKey } from "@/api"
import { useCurrentAppInfo } from "../../../hooks/useCurrentAppInfo"
import { useCurrentAppMetadata } from "../../../hooks"
import { useUploadAndUpdateAppDetails } from "../../../hooks/useUploadAndUpdateAppDetails"

type Props = {
  modal: ReturnType<typeof useDisclosure>
}

type TweetForm = {
  tweetUrl: string
}

export const AddTweetModal = ({ modal }: Props) => {
  const { t } = useTranslation()
  const form = useForm<TweetForm>()
  const { errors } = form.formState
  const { appMetadata } = useCurrentAppMetadata()

  const handleClose = useCallback(() => {
    form.reset()
    modal.onClose()
  }, [form, modal])

  const tweetUrl = form.watch("tweetUrl")

  const tweetId = useMemo(() => {
    if (!tweetUrl) return null
    const match = tweetUrl.match(/\/status\/(\d+)/)
    return match ? match[1] : null
  }, [tweetUrl])

  const { data: tweet, isLoading: isTweetLoading, error: tweetError } = useTweet(tweetId ?? undefined)

  const { updateAppDetailsMutation, uploadMetadataMutation } = useUploadAndUpdateAppDetails({
    onSuccess: handleClose,
  })

  const onSubmit = useCallback(
    async (data: TweetForm) => {
      updateAppDetailsMutation.resetStatus()

      const newTweetId = data.tweetUrl.match(/\/status\/(\d+)/)?.[1] || null

      if (!appMetadata || !newTweetId) return
      const metadataUri = await uploadMetadataMutation.onMetadataUpload(
        {
          ...appMetadata,
          tweets: [newTweetId, ...(appMetadata.tweets || [])].filter(Boolean),
        },
        false,
      )
      if (!metadataUri) return

      updateAppDetailsMutation.sendTransaction({
        metadataUri,
      })
    },
    [updateAppDetailsMutation, appMetadata, uploadMetadataMutation],
  )
  const onTryAgain = useCallback(() => {
    handleClose()
    form.handleSubmit(onSubmit)()
  }, [form, handleClose, onSubmit])

  if (uploadMetadataMutation.metadataUploading || updateAppDetailsMutation.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen}
        onClose={handleClose}
        confirmationTitle="Update App details"
        successTitle="App details updated!"
        status={
          uploadMetadataMutation.metadataUploading
            ? "uploadingMetadata"
            : updateAppDetailsMutation.error || uploadMetadataMutation.metadataUploadError
              ? "error"
              : updateAppDetailsMutation.status
        }
        errorDescription={uploadMetadataMutation.metadataUploadError?.message ?? updateAppDetailsMutation.error?.reason}
        errorTitle={
          uploadMetadataMutation.metadataUploadError
            ? "Error uploading metadata"
            : updateAppDetailsMutation.error
              ? "Error updating app details"
              : undefined
        }
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Updating app details..."
        txId={updateAppDetailsMutation.txReceipt?.meta.txID}
        showExplorerButton
      />
    )
  }
  return (
    <Modal isOpen={modal.isOpen} onClose={handleClose} size="2xl" trapFocus={false}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalBody p="24px">
          <VStack align="stretch" gap={6} as="form" onSubmit={form.handleSubmit(onSubmit)}>
            <Heading fontSize="24px" fontWeight={700}>
              {t("Add X post")}
            </Heading>
            <Text fontSize="16px" color="#6A6A6A">
              {t(
                "Paste the URL to an X post that contains some kind of update about your app to show it on your app’s feed.",
              )}
            </Text>
            <FormControl isInvalid={!!errors.tweetUrl}>
              <FormLabel>{t("X post URL")}</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <RiTwitterXFill />
                </InputLeftElement>
                <Input
                  rounded={"full"}
                  {...form.register("tweetUrl", {
                    required: { value: true, message: t("This field is required") },
                    pattern: {
                      value: /^https:\/\/(twitter|x)\.com\/.*\/status\/\d+$/,
                      // recognize twitter.com urls and x.com urls
                      message: t("Invalid url"),
                    },
                  })}
                />
              </InputGroup>
              <FormErrorMessage>{errors.tweetUrl?.message}</FormErrorMessage>
            </FormControl>
            {tweetId && !errors.tweetUrl && !tweetError && (
              <VStack align="stretch">
                <Heading fontSize="20px" fontWeight={700}>
                  {t("Preview")}
                </Heading>
                {tweet && !isTweetLoading ? <EmbeddedTweet key={tweet.id_str} tweet={tweet} /> : <TweetSkeleton />}
              </VStack>
            )}
            <VStack align={"stretch"}>
              <Button variant="primaryAction" type="submit">
                {t("Save and show on feed")}
              </Button>
              <Button variant="primaryGhost" onClick={modal.onClose}>
                {t("Maybe later")}
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
