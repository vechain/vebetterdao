import { useTweet } from "@/api/twitter/hooks/useTweets"
import { Button, Field, Heading, Input, InputGroup, VStack, useSteps } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { RiTwitterXFill } from "react-icons/ri"
import { EmbeddedTweet, TweetSkeleton } from "react-tweet"
import "./tweetStyle.css"
import { useCurrentAppMetadata } from "../../../hooks"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
import UploadingMetadataAnimation from "@/lottieAnimations/uploadingMetadata.json"
import { StepModal } from "@/components/StepModal/StepModal"
import { useUpdateAppMetadataReturnValue } from "@/hooks/useUpdateAppDetails"
import { UseUploadAppMetadataReturnValue } from "@/hooks/useUploadAppMetadata"
import Lottie from "react-lottie"

type Props = {
  onClose: () => void
  isOpen: boolean
  updateAppDetailsMutation: useUpdateAppMetadataReturnValue
  uploadMetadataMutation: UseUploadAppMetadataReturnValue
}

type TweetForm = {
  tweetUrl: string
}
enum AddTweetModalStep {
  SUBMIT = "SUBMIT",
  UPLOADING = "UPLOADING",
}
export const AddTweetModal = ({ onClose, isOpen, updateAppDetailsMutation, uploadMetadataMutation }: Props) => {
  const { t } = useTranslation()
  const form = useForm<TweetForm>()
  const { errors } = form.formState
  const { appMetadata } = useCurrentAppMetadata()
  const {
    value: activeStep,
    setStep: setActiveStep,
    goToPrevStep: goToPrevious,
    goToNextStep: goToNext,
  } = useSteps({
    defaultStep: 0,
    count: Object.keys(AddTweetModalStep).length + 1, // +1 for the upload metadata status
  })

  const handleClose = useCallback(() => {
    onClose()
    form.reset()
    setActiveStep(0)
  }, [form, onClose, setActiveStep])

  const tweetUrl = form.watch("tweetUrl")

  const tweetId = useMemo(() => {
    if (!tweetUrl) return null
    const match = tweetUrl.match(/\/status\/(\d+)/)
    return match ? match[1] : null
  }, [tweetUrl])

  const { data: tweet, isLoading: isTweetLoading, error: tweetError } = useTweet(tweetId ?? undefined)

  const onSubmit = async (data: TweetForm) => {
    goToNext()

    const newTweetId = data.tweetUrl.match(/\/status\/(\d+)/)?.[1] ?? null

    if (!appMetadata || !newTweetId) return goToPrevious()
    const metadataUri = await uploadMetadataMutation.onMetadataUpload(
      {
        ...appMetadata,
        tweets: [newTweetId, ...(appMetadata?.tweets || [])].filter(Boolean),
      },
      false,
    )
    if (!metadataUri) return goToPrevious()
    updateAppDetailsMutation.sendTransaction({
      metadataUri,
    })
  }

  const SubmitTwitterContent = (
    <VStack align="stretch" gap={6} pt={4} as="form" onSubmit={form.handleSubmit(onSubmit)}>
      <Field.Root invalid={!!errors.tweetUrl}>
        <Field.Label>{t("X post URL")}</Field.Label>
        <InputGroup startAddon={<RiTwitterXFill />}>
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
        <Field.ErrorText>{errors.tweetUrl?.message}</Field.ErrorText>
      </Field.Root>
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
        <Button variant="primaryGhost" onClick={onClose}>
          {t("Maybe later")}
        </Button>
      </VStack>
    </VStack>
  )

  return (
    <StepModal
      disableBackButton={true}
      disableCloseButton={true}
      steps={[
        {
          key: AddTweetModalStep.SUBMIT,
          content: SubmitTwitterContent,
          title: t("Add X post"),
          description: t(
            "Paste the URL to an X post that contains some kind of update about your app to show it on your app’s feed.",
          ),
        },
        {
          key: AddTweetModalStep.UPLOADING,
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
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      goToPrevious={goToPrevious}
      goToNext={goToNext}
      isOpen={isOpen}
      onClose={handleClose}
    />
  )
}
