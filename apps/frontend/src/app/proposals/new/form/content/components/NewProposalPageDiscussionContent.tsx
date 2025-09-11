import "@uiw/react-md-editor/markdown-editor.css"

import { Box, Button, Card, Field, HStack, Heading, Stack, Text, VStack, useMediaQuery } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useProposalFormStore } from "@/store"
import dynamic from "next/dynamic"

import rehypeSanitize from "rehype-sanitize"
import { useTranslation } from "react-i18next"
import { Controller, useForm } from "react-hook-form"
import {
  buttonClickActions,
  buttonClicked,
  ButtonClickProperties,
  updateMarkdownTemplatePlaceholders,
  validateProposalTemplate,
} from "@/constants"
import { useWallet } from "@vechain/vechain-kit"
import { AnalyticsUtils } from "@/utils"
import { useUploadProposalMetadata } from "@/hooks"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

type FormData = {
  markdownDescription: string
  metadataUri: string
}

export const NewProposalPageDiscussionContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()

  const { title, shortDescription, markdownDescription, actions, setData, metadataUri } = useProposalFormStore()
  const { onMetadataUpload, metadataUploading: isMetadataUploading } = useUploadProposalMetadata()

  const { control, formState, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      markdownDescription,
      metadataUri,
    },
  })

  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])

  const { errors } = formState

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!title || !shortDescription || !data.markdownDescription)
        return control.setError("markdownDescription", { message: "Missing data" })
      setData({ markdownDescription: data.markdownDescription })
      const metadataUri = await onMetadataUpload({
        title,
        shortDescription,
        markdownDescription: data.markdownDescription,
      })
      if (!metadataUri) return
      setData({ metadataUri })
      router.push("/proposals/new/form/round")
      AnalyticsUtils.trackEvent(
        buttonClicked,
        buttonClickActions(ButtonClickProperties.CONTINUE_CREATE_PROPOSAL_CONTENT),
      )
    },
    [setData, router, title, shortDescription, onMetadataUpload, control],
  )
  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const resetMarkdownToDefault = useCallback(() => {
    const defaultMarkdown = updateMarkdownTemplatePlaceholders({
      account: account?.address,
      title,
      shortDescription,
      actionsLength: actions.length,
    })
    setValue("markdownDescription", defaultMarkdown)
    setData({ markdownDescription: defaultMarkdown })
  }, [setData, setValue, account?.address, title, shortDescription, actions])

  return (
    <Card.Root w="full" variant="baseWithBorder" data-testid="new-proposal-content-page">
      <Card.Body py={8}>
        <VStack gap={[6, 8]} align="flex-start" as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={[4, 6]} align="flex-start">
            <Heading size={["xl", "2xl"]} fontWeight="bold">
              {t("Share more about your idea")}
            </Heading>
            <Text fontSize={["sm", "md"]} color="gray.500">
              {t(
                "Providing more information will help the community understand the purpose of your proposal and make informed voting decisions. Include details such as motivation, a detailed description, or any other relevant information.",
              )}
            </Text>
          </VStack>
          <Field.Root invalid={!!errors.markdownDescription}>
            <Box w="full" h={500}>
              <Controller
                name="markdownDescription"
                control={control}
                rules={{
                  validate: value => {
                    if (!value) return t("Description cannot be empty.")
                    const errors = validateProposalTemplate(value)
                    if (!errors.length) return true
                    let errorMessage = "One or more placeholders have not been replaced: "
                    errors.forEach((error, index) => {
                      errorMessage += error
                      if (index < errors.length - 1) errorMessage += ", "
                    })
                    return errorMessage
                  },
                }}
                render={({ field }) => (
                  <MDEditor
                    preview={isDesktop ? "live" : "edit"}
                    data-testid="markdown-description-input"
                    value={field.value}
                    onChange={field.onChange}
                    height={"100%"}
                    previewOptions={{
                      rehypePlugins: [[rehypeSanitize]],
                    }}
                  />
                )}
              />
            </Box>
            <Stack
              direction={["column", "column", "row"]}
              w="full"
              justify={"space-between"}
              align={["flex-start", "flex-start", "center"]}
              gap={2}>
              {errors.markdownDescription ? (
                <Field.ErrorText data-testid="form-error-message">{errors.markdownDescription.message}</Field.ErrorText>
              ) : (
                <Field.HelperText color="gray.500" fontSize="sm">
                  {t("Make sure to replace all the placeholders with your own content.")}
                </Field.HelperText>
              )}
              <Button data-testid="reset-markdown" variant={"primaryLink"} onClick={resetMarkdownToDefault}>
                {t("Reset to default")}
              </Button>
            </Stack>
          </Field.Root>

          <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
            <Button data-testid="go-back" variant="primarySubtle" onClick={goBack} disabled={isMetadataUploading}>
              {t("Go back")}
            </Button>
            <Button
              data-testid="continue"
              variant="primaryAction"
              type="submit"
              disabled={isMetadataUploading}
              loading={isMetadataUploading}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
