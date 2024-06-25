import "@uiw/react-md-editor/markdown-editor.css"

import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  HStack,
  Heading,
  Stack,
  Text,
  VStack,
  useMediaQuery,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useProposalFormStore } from "@/store"
import dynamic from "next/dynamic"

import rehypeSanitize from "rehype-sanitize"
import { useTranslation } from "react-i18next"
import { Controller, useForm } from "react-hook-form"
import { updateMarkdownTemplatePlaceholders, validateProposalTemplate } from "@/constants"
import { useWallet } from "@vechain/dapp-kit-react"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

type FormData = {
  markdownDescription: string
}

export const NewProposalPageDiscussionContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()

  const { title, shortDescription, markdownDescription, actions, setData } = useProposalFormStore()

  const { control, formState, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      markdownDescription,
    },
  })

  const [isDesktop] = useMediaQuery("(min-width: 800px)")

  const { errors } = formState

  const onSubmit = useCallback(
    (data: FormData) => {
      setData({ markdownDescription: data.markdownDescription })
      router.push("/proposals/new/form/round")
    },
    [setData, router],
  )
  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const resetMarkdownToDefault = useCallback(() => {
    const defaultMarkdown = updateMarkdownTemplatePlaceholders({
      account,
      title,
      shortDescription,
      actionsLength: actions.length,
    })
    setValue("markdownDescription", defaultMarkdown)
    setData({ markdownDescription: defaultMarkdown })
  }, [setData, setValue, account, title, shortDescription, actions])

  return (
    <Card w="full" data-testid="new-proposal-content-page">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start" as="form" onSubmit={handleSubmit(onSubmit)}>
          <Heading size="lg">{t("Share more about your idea")}</Heading>
          <Text fontSize="md" color="gray.500">
            {t(
              "Providing more information will help the community understand the purpose of your proposal and make informed voting decisions. Include details such as motivation, a detailed description, or any other relevant information.",
            )}
          </Text>
          <FormControl isInvalid={!!errors.markdownDescription}>
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
              spacing={2}>
              {errors.markdownDescription ? (
                <FormErrorMessage data-testid="form-error-message">
                  {errors.markdownDescription.message}
                </FormErrorMessage>
              ) : (
                <FormHelperText color="gray.500" fontSize="sm">
                  {t("Make sure to replace all the placeholders with your own content.")}
                </FormHelperText>
              )}
              <Button data-testid="reset-markdown" variant={"primaryLink"} onClick={resetMarkdownToDefault}>
                {t("Reset to default")}
              </Button>
            </Stack>
          </FormControl>

          <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
            <Button data-testid="go-back" variant="primarySubtle" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button data-testid="continue" variant="primaryAction" type="submit">
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
