import { Button, Card, CardBody, HStack, Heading, VStack, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { AddTweetModal } from "./components/AddTweetModal"
import { TweetList } from "./components/TweetList"
import { useCurrentAppMetadata } from "../../hooks"
import { useCurrentAppRole } from "../../hooks/useCurrentAppRole"
import { UilCheckCircle, UilPen, UilPlus, UilTimes } from "@iconscout/react-unicons"
import { useUpdateAppDetails, useUploadAppMetadata } from "@/hooks"
import { useParams } from "next/navigation"
import { UpdateAppMetadataTransactionModal } from "../UpdateAppMetadataTransactionModal"
import { OkHandIcon } from "@/components"

export const AppTweets = () => {
  const [editMode, setEditMode] = useState(false)
  const [tweetsToRemove, setTweetsToRemove] = useState<string[]>([])
  const newTweetModal = useDisclosure()
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()
  const metadataTweets = useMemo(() => appMetadata?.tweets?.filter(Boolean) ?? [], [appMetadata?.tweets])
  const transactionModal = useDisclosure()
  const { isAdminOrModerator } = useCurrentAppRole()
  const { t } = useTranslation()
  const { appId } = useParams<{ appId: string }>()

  const removeTweet = useCallback((tweetId: string) => {
    setTweetsToRemove(prev => [...prev, tweetId])
  }, [])

  const handleEdit = useCallback(() => {
    setEditMode(true)
  }, [setEditMode])

  const handleCancelEdit = useCallback(() => {
    setEditMode(false)
    setTweetsToRemove([])
  }, [setEditMode])

  const handleClose = useCallback(() => {
    handleCancelEdit()
    transactionModal.onClose()
  }, [handleCancelEdit, transactionModal])

  const updateAppDetailsMutation = useUpdateAppDetails({
    appId,
    onSuccess: handleClose,
  })
  const uploadMetadataMutation = useUploadAppMetadata()

  const onSubmit = useCallback(async () => {
    updateAppDetailsMutation.resetStatus()
    transactionModal.onOpen()

    if (!appMetadata) return
    const metadataUri = await uploadMetadataMutation.onMetadataUpload(
      {
        ...appMetadata,
        tweets: (appMetadata.tweets || [])
          .filter((tweetId: string) => {
            return !tweetsToRemove.includes(tweetId)
          })
          .filter(Boolean),
      },
      false,
    )
    if (!metadataUri) return

    updateAppDetailsMutation.sendTransaction({
      metadataUri,
    })
  }, [transactionModal, updateAppDetailsMutation, appMetadata, uploadMetadataMutation, tweetsToRemove])
  const onTryAgain = useCallback(() => {
    onSubmit()
  }, [onSubmit])

  if (appMetadataLoading) {
    return null
  }

  const isListEmpty = metadataTweets.length === 0

  return (
    <>
      <UpdateAppMetadataTransactionModal
        transactionModal={transactionModal}
        handleClose={handleClose}
        uploadMetadataMutation={uploadMetadataMutation}
        updateAppDetailsMutation={updateAppDetailsMutation}
        onTryAgain={onTryAgain}
      />
      <VStack align="stretch" gap={4}>
        <HStack justify={"space-between"} flexWrap={"wrap"}>
          <Heading fontSize={"36px"} fontWeight={700}>
            {t("App updates")}
          </Heading>
          {isAdminOrModerator && (
            <>
              {editMode ? (
                <HStack flexDir={["row-reverse", "row"]} mt={[2, 0]}>
                  <Button
                    variant="primaryGhost"
                    leftIcon={<UilTimes color="#004CFC" fontSize="16px" />}
                    onClick={handleCancelEdit}>
                    {t("Cancel")}
                  </Button>
                  <Button
                    variant="primaryAction"
                    leftIcon={<UilCheckCircle color="#FFFFFF" fontSize="16px" />}
                    isDisabled={tweetsToRemove.length === 0}
                    onClick={onSubmit}>
                    {t("Save changes")}
                  </Button>
                </HStack>
              ) : (
                <HStack flexDir={["row-reverse", "row"]} mt={[2, 0]}>
                  {!isListEmpty && (
                    <Button
                      variant="primaryGhost"
                      leftIcon={<UilPen color="#004CFC" fontSize="16px" />}
                      onClick={handleEdit}>
                      {t("Edit feed")}
                    </Button>
                  )}
                  <Button
                    variant="primaryAction"
                    leftIcon={<UilPlus color="#FFFFFF" fontSize="16px" />}
                    onClick={newTweetModal.onOpen}>
                    {t("Add X post")}
                  </Button>
                </HStack>
              )}
              <AddTweetModal newTweetModal={newTweetModal} />
            </>
          )}
        </HStack>
        {isListEmpty ? (
          <Card w="full">
            <CardBody>
              <VStack align={"center"} justify={"center"} w="full" minH="200px">
                <OkHandIcon color="#757575" />
                <Heading fontSize={"20px"} fontWeight={500} textAlign={"center"}>
                  {t("App will add updates here.")}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <TweetList editMode={editMode} tweetsToRemove={tweetsToRemove} removeTweet={removeTweet} />
        )}
      </VStack>
    </>
  )
}
