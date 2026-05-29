import "@uiw/react-md-editor/markdown-editor.css"
import {
  Box,
  Button,
  Card,
  Field,
  HStack,
  Heading,
  Input,
  InputGroup,
  Link,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import rehypeSanitize from "rehype-sanitize"

import { useTreasuryB3trTransferLimit } from "@/api/contracts/treasury/useTreasuryTransferLimit"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { buttonClicked, buttonClickActions, ButtonClickProperties } from "@/constants/AnalyticsEvents"
import { useMainnetB3TRPrice } from "@/hooks/useMainnetB3TRPrice"

import {
  updateMarkdownTemplatePlaceholders,
  validateProposalTemplate,
} from "../../../../../../constants/GovernanceProposalTemplate"
import { useUploadProposalMetadata } from "../../../../../../hooks/useUploadProposalMetadata"
import { useProposalFormStore } from "../../../../../../store/useProposalFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })
type FormData = {
  markdownDescription: string
  metadataUri: string
  maxBudget: string
}
export const NewProposalPageDiscussionContent = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { title, shortDescription, markdownDescription, actions, setData, metadataUri, maxBudget } =
    useProposalFormStore()
  const { onMetadataUpload, metadataUploading: isMetadataUploading } = useUploadProposalMetadata()
  const { data: b3trUsdPrice } = useMainnetB3TRPrice()
  // Treasury enforces a per-call B3TR cap on transferB3TR; claimPayout() would revert forever
  // if maxBudget exceeds it, so the budget input is hard-capped here at creation time.
  const { data: treasuryB3trLimit } = useTreasuryB3trTransferLimit()
  const treasuryB3trLimitEther = useMemo(
    () => (treasuryB3trLimit !== undefined ? ethers.formatEther(treasuryB3trLimit as unknown as bigint) : undefined),
    [treasuryB3trLimit],
  )
  const { control, formState, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      markdownDescription,
      metadataUri,
      maxBudget: maxBudget ?? "",
    },
  })
  const { errors } = formState
  const maxBudgetValue = watch("maxBudget")
  const maxBudgetUsd = useMemo(() => {
    const n = Number(maxBudgetValue)
    if (!Number.isFinite(n) || n <= 0) return undefined
    const price = Number(b3trUsdPrice)
    if (!Number.isFinite(price) || price <= 0) return undefined
    return n * price
  }, [maxBudgetValue, b3trUsdPrice])
  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!title || !shortDescription || !data.markdownDescription)
        return control.setError("markdownDescription", { message: "Missing data" })
      setData({
        markdownDescription: data.markdownDescription,
        maxBudget: data.maxBudget?.trim() || undefined,
      })
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
    <Card.Root w="full" variant="primary" data-testid="new-proposal-content-page">
      <Card.Body py={8}>
        <VStack gap={[6, 8]} align="flex-start" as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={[4, 6]} align="flex-start">
            <Heading size={["xl", "2xl"]}>{t("Share more about your idea")}</Heading>
            <Text textStyle={["sm", "md"]} color="gray.500">
              {t(
                "Providing more information will help the community understand the purpose of your proposal and make informed voting decisions. Include details such as motivation, a detailed description, or any other relevant information.",
              )}
            </Text>
          </VStack>
          <Field.Root invalid={!!errors.markdownDescription}>
            <Box
              w="full"
              h={500}
              className="wmde-markdown-var"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="md"
              overflow="hidden">
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
                    preview={"edit"}
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
                <Field.HelperText color="gray.500" textStyle="sm">
                  {t("Make sure to replace all the placeholders with your own content.")}
                </Field.HelperText>
              )}
              <Button data-testid="reset-markdown" variant="link" onClick={resetMarkdownToDefault}>
                {t("Reset to default")}
              </Button>
            </Stack>
          </Field.Root>

          <VStack gap={2} align="flex-start" w="full">
            <Heading size={["sm", "md"]}>{t("Implementation Cost (B3TR)")}</Heading>
            <Text textStyle="sm" color="gray.500">
              {t(
                "Specify the maximum amount of B3TR that can be paid from the Treasury for implementing this proposal.",
              )}
            </Text>
            <Text textStyle="sm" color="gray.500">
              {t(
                "Once development begins, you will select a single payout address. Treasury funds, if approved, will be sent to that address, and the recipient will be responsible for distributing payments to contributors off-chain.",
              )}
            </Text>
            <Text textStyle="sm" color="gray.500">
              {t("Enter 0 if this proposal does not require funding.")}
            </Text>

            <Field.Root invalid={!!errors.maxBudget}>
              <Controller
                name="maxBudget"
                control={control}
                rules={{
                  validate: value => {
                    if (!value || value.trim() === "") return true
                    const n = Number(value)
                    if (!Number.isFinite(n) || n < 0) return t("Budget must be a non-negative number")
                    if (treasuryB3trLimit !== undefined && treasuryB3trLimitEther !== undefined) {
                      let parsed: bigint
                      try {
                        parsed = ethers.parseEther(value.trim())
                      } catch {
                        return t("Budget must be a non-negative number")
                      }
                      if (parsed > (treasuryB3trLimit as unknown as bigint)) {
                        return t(
                          "Budget exceeds Treasury's per-transfer B3TR limit ({{limit}} B3TR). The payout would be unclaimable.",
                          { limit: humanNumber(treasuryB3trLimitEther) },
                        )
                      }
                    }
                    return true
                  },
                }}
                render={({ field }) => (
                  <InputGroup
                    w="full"
                    mt={4}
                    startElement={<B3TRIcon boxSize={8} colorVariant="dark" />}
                    startElementProps={{
                      p: 1,
                      pointerEvents: "none",
                    }}
                    endElement={
                      maxBudgetUsd !== undefined ? (
                        <Heading w="auto" size={["lg", "lg", "3xl"]} color="gray.500">
                          {`≈ $${maxBudgetUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                        </Heading>
                      ) : undefined
                    }>
                    <Input
                      data-testid="proposal-max-budget-input"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={field.value}
                      onChange={field.onChange}
                      w="full"
                      textStyle={["xl", "xl", "3xl"]}
                    />
                  </InputGroup>
                )}
              />
              {errors.maxBudget ? (
                <Field.ErrorText fontStyle="sm" color="red.500">
                  {errors.maxBudget.message}
                </Field.ErrorText>
              ) : (
                <Field.HelperText fontStyle="sm" color="gray.500">
                  {t("Do not know how much this could cost? Head over to the")}{" "}
                  <Link
                    href="https://vechain.discourse.group/c/vebetterdao/47"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="underline">
                    {t("Discourse forum")}
                  </Link>{" "}
                  {t("and chat with other community builders.")}
                </Field.HelperText>
              )}
            </Field.Root>
          </VStack>

          <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
            <Button data-testid="go-back" variant="link" onClick={router.back} disabled={isMetadataUploading}>
              {t("Go back")}
            </Button>
            <Button
              data-testid="continue"
              variant="primary"
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
