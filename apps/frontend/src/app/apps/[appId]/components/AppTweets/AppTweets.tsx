import { Button, Card, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import { UilCheckCircle, UilPen, UilPlus, UilTimes } from "@iconscout/react-unicons"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Lottie from "react-lottie"

import { StepModal } from "@/components/StepModal/StepModal"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
import UploadingMetadataAnimation from "@/lottieAnimations/uploadingMetadata.json"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { OkHandIcon } from "../../../../../components/Icons/OkHandIcon"
import { useUpdateAppDetails } from "../../../../../hooks/useUpdateAppDetails"
import { useUploadAppMetadata } from "../../../../../hooks/useUploadAppMetadata"
import { useCurrentAppMetadata } from "../../hooks/useCurrentAppMetadata"
import { useCurrentAppRole } from "../../hooks/useCurrentAppRole"

import { AddTweetModal } from "./components/AddTweetModal"
import { TweetList } from "./components/TweetList/TweetList"

import "./components/tweetStyle.css"
enum AppTweetsStep {
  UPLOADING = "UPLOADING",
}
export const AppTweets = () => {
  const [editMode, setEditMode] = useState(false)
  const { open: isNewTweetModalOpen, onOpen: onNewTweetModalOpen, onClose: onNewTweetModalClose } = useDisclosure()
  const { isAdminOrModerator } = useCurrentAppRole()
  const { t } = useTranslation()
  const { appId } = useParams<{ appId: string }>()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
  const { isTxModalOpen } = useTransactionModal()
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()
  const metadataTweets = useMemo(() => appMetadata?.tweets?.filter(Boolean) ?? [], [appMetadata?.tweets])
  const [tweets, setTweets] = useState<string[]>(metadataTweets)
  useEffect(() => {
    setTweets(metadataTweets)
  }, [metadataTweets])
  const handleEdit = useCallback(() => {
    setEditMode(true)
  }, [setEditMode])
  const handleCancelEdit = useCallback(() => {
    setEditMode(false)
    setTweets(metadataTweets)
  }, [metadataTweets])

  const handleClose = useCallback(() => {
    handleCancelEdit()
  }, [handleCancelEdit])

  const updateAppDetailsMutation = useUpdateAppDetails({
    appId,
    onSuccess: () => {
      handleClose()
      onNewTweetModalClose()
      updateAppDetailsMutation.resetStatus()
    },
    onFailure: () => {
      handleClose()
      onNewTweetModalClose()
      updateAppDetailsMutation.resetStatus()
    },
  })
  const uploadMetadataMutation = useUploadAppMetadata()

  const onSubmit = useCallback(async () => {
    onOpen()
    if (!appMetadata) return null

    const metadataUri = await uploadMetadataMutation.onMetadataUpload(
      {
        ...appMetadata,
        tweets: [...tweets.filter(Boolean)],
      },
      false,
    )
    if (!metadataUri) return

    updateAppDetailsMutation.sendTransaction({
      metadataUri,
    })
  }, [updateAppDetailsMutation, onOpen, appMetadata, uploadMetadataMutation, tweets])

  if (appMetadataLoading) {
    return null
  }

  const isListEmpty = metadataTweets.length === 0

  return (
    <>
      <StepModal
        isOpen={isOpen && !isTxModalOpen}
        onClose={onClose}
        disableCloseButton={true}
        steps={[
          {
            key: AppTweetsStep.UPLOADING,
            content: (
              <ModalAnimation>
                <VStack align={"center"} p={6}>
                  {/* @ts-ignore eslint-disable-line */}
                  <Lottie
                    style={{
                      pointerEvents: "none",
                    }}
                    options={{
                      loop: true,
                      autoplay: true,
                      animationData: UploadingMetadataAnimation,
                    }}
                    height={200}
                    width={200}
                  />
                </VStack>
              </ModalAnimation>
            ),
            title: "Upload metadata",
            description: "Please wait while we upload the metadata",
          },
        ]}
        activeStep={0}
        setActiveStep={() => {}}
        goToPrevious={() => {}}
      />
      <VStack align="stretch" gap={4}>
        <HStack justify={"space-between"} flexWrap={"wrap"}>
          <Heading size="2xl">{t("App updates")}</Heading>
          {isAdminOrModerator && (
            <>
              {editMode ? (
                <HStack flexDir={["row-reverse", "row"]} mt={[2, 0]}>
                  <Button variant="ghost" color="actions.tertiary.default" onClick={handleCancelEdit}>
                    <UilTimes color="#004CFC" fontSize="16px" />
                    {t("Cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={metadataTweets.every((metadataTweet, index) => metadataTweet === tweets[index])}
                    onClick={onSubmit}>
                    <UilCheckCircle color="white" fontSize="16px" />
                    {t("Save changes")}
                  </Button>
                </HStack>
              ) : (
                <HStack flexDir={["row-reverse", "row"]} mt={[2, 0]}>
                  {!isListEmpty && (
                    <Button variant="ghost" color="actions.tertiary.default" onClick={handleEdit}>
                      <UilPen color="#004CFC" fontSize="16px" />
                      {t("Edit feed")}
                    </Button>
                  )}
                  <Button variant="primary" onClick={onNewTweetModalOpen}>
                    <UilPlus color="white" fontSize="16px" />
                    {t("Add X post")}
                  </Button>
                </HStack>
              )}
              <AddTweetModal
                isOpen={isNewTweetModalOpen}
                onClose={onNewTweetModalClose}
                updateAppDetailsMutation={updateAppDetailsMutation}
                uploadMetadataMutation={uploadMetadataMutation}
              />
            </>
          )}
        </HStack>
        {isListEmpty ? (
          <Card.Root w="full">
            <Card.Body>
              <VStack align={"center"} justify={"center"} w="full" minH="200px">
                <OkHandIcon color="#757575" />
                <Heading size="xl" fontWeight="semibold" textAlign={"center"}>
                  {t("App will add updates here.")}
                </Heading>
              </VStack>
            </Card.Body>
          </Card.Root>
        ) : (
          <TweetList editMode={editMode} tweets={tweets} setTweets={setTweets} />
        )}
      </VStack>
    </>
  )
}
