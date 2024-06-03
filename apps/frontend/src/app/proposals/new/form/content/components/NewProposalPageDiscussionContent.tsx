import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

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
  Text,
  VStack,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import dynamic from "next/dynamic"

import rehypeSanitize from "rehype-sanitize"
import { useTranslation } from "react-i18next"
import { useAutomaticUpdateProposalTemplate } from "../../../hooks/useAutomaticUpdateProposalTemplate"
import { Controller, useForm } from "react-hook-form"
import { validateProposalTemplate } from "@/constants"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

type FormData = {
  markdownDescription: string
}

export const NewProposalPageDiscussionContent = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const { markdownDescription, setData } = useProposalFormStore()

  //automatic update the proposal template based on the form data
  useAutomaticUpdateProposalTemplate()

  const { control, formState, handleSubmit } = useForm<FormData>({
    defaultValues: {
      markdownDescription,
    },
  })

  const { errors } = formState

  const onSubmit = useCallback(
    (data: FormData) => {
      setData({ markdownDescription: data.markdownDescription })
      router.push("/proposals/new/form/preview")
    },
    [setData, router],
  )
  const goBack = useCallback(() => {
    router.back()
  }, [router])

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
            {errors.markdownDescription ? (
              <FormErrorMessage data-testid="form-error-message">{errors.markdownDescription.message}</FormErrorMessage>
            ) : (
              <FormHelperText color="gray.500" fontSize="sm">
                {t("Make sure to replace all the placeholders with your own content.")}
              </FormHelperText>
            )}
          </FormControl>

          <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
            <Button
              data-testid="go-back"
              rounded="full"
              variant={"primarySubtle"}
              colorScheme="primary"
              size="lg"
              onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button data-testid="continue" rounded="full" colorScheme="primary" size="lg" type="submit">
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
