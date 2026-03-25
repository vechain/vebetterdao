import { VStack, Heading, Field, Input, Textarea } from "@chakra-ui/react"
import { decodeFunctionCalldata, DecodedFunctionData, encodeFunctionCalldata } from "@repo/utils/ContractUtils"
import MDEditor from "@uiw/react-md-editor"
import { ethers } from "ethers"
import { useEffect, useCallback } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import rehypeSanitize from "rehype-sanitize"

import { FunctionParamsField } from "../../../../../../../components/GenerateFunctionToCallParamsInput/GenerateFunctionToCallParamsInput"
import { useProposalFormStore, ProposalFormStoreState } from "../../../../../../../store/useProposalFormStore"

import { ExecutableFunctionCard } from "./ExecutableFunctionCard"

export type FormData = {
  title: string
  description: string
  actions: (ProposalFormStoreState["actions"][0] & { params: Omit<FunctionParamsField, "id">[] })[]
  markdownDescription: string
}
/**
 * This component is a form to create a new proposal
 * @param onSubmit - function to call when the form is submitted
 * @param isDisabled - if the form should be disabled
 * @param formId - the form id
 * @param renderTitle - if the title field should be rendered
 * @param renderDescription - if the description field should be rendered
 * @param renderMarkdownDescription - if the markdown description field should be rendered
 * @param renderActions - if the actions field should be rendered
 */
type Props = {
  onSubmit?: (_data: FormData) => void
  isDisabled?: boolean
  formId?: string
  renderTitle?: boolean
  renderDescription?: boolean
  renderMarkdownDescription?: boolean
  renderActions?: boolean
  canAddAnotherTransaction?: boolean
}
/**
 * This component read/write from/to useFormStore and renders a form to create a new proposal
 * @param see {@link Props}
 * @returns
 */
export const NewProposalForm: React.FC<Props> = ({
  onSubmit,
  isDisabled = false,
  formId = "proposal-functions-form",
  renderTitle = true,
  renderDescription = true,
  renderMarkdownDescription = false,
  renderActions = true,
  canAddAnotherTransaction = true,
}) => {
  const { t } = useTranslation()
  const { actions, setData, title, shortDescription, markdownDescription } = useProposalFormStore()
  const { handleSubmit, register, control, formState, setValue } = useForm<FormData>({
    defaultValues: {
      title: title ?? "",
      description: shortDescription ?? "",
      actions: [],
      markdownDescription: markdownDescription ?? "",
    },
  })

  const { errors } = formState
  const { fields, insert, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "actions", // unique name for your Field Array
  })

  //parse actions from store and set them in the form, decoding calldata if available
  useEffect(() => {
    const formActions = actions.map(action => {
      let decoded: DecodedFunctionData = {}
      try {
        if (action.calldata) decoded = decodeFunctionCalldata(action.calldata, action.abiDefinition)
      } catch (e) {
        console.error("Error decoding call data", e)
      }

      return {
        ...action,
        params: action.abiDefinition.inputs.map(param => {
          const requiresEthParse = param.requiresEthParse === true
          const parsedParam = (() => {
            if (typeof decoded[param.name] === "undefined") return undefined
            if (requiresEthParse) return ethers.formatEther(decoded[param.name] as ethers.BigNumberish)
            return decoded[param.name]
          })()

          return {
            name: param.name,
            type: param.type,
            value: parsedParam,
            requiresEthParse,
          }
        }),
      }
    })
    setValue("actions", formActions)
    setValue("title", title ?? "")
    setValue("description", shortDescription ?? "")
    setValue("markdownDescription", markdownDescription ?? "")
  }, [actions, title, shortDescription, setValue, markdownDescription])

  const onFormSubmit = useCallback(
    (data: FormData) => {
      setData({
        title: data.title,
        shortDescription: data.description,
        actions: data.actions.map(action => {
          return {
            contractAddress: action.contractAddress,
            abiDefinition: action.abiDefinition,
            name: action.name,
            description: action.description,
            calldata: encodeFunctionCalldata(
              action.abiDefinition,
              action.params.map(param => {
                if (param.type === "bool") {
                  return param.value === true || param.value === 1 || param.value === "true"
                }
                if (param.requiresEthParse) {
                  const value = ethers.parseEther(String(param.value))
                  return value.toString()
                }
                return param.value
              }),
            ),
          }
        }),
      })
      onSubmit?.(data)
    },
    [setData, onSubmit],
  )

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      data-testid="new-proposal-form"
      id={formId}
      style={{
        width: "100%",
      }}>
      <VStack gap={8} align="flex-start" w="full">
        {renderTitle && (
          <Field.Root invalid={!!errors.title}>
            <Field.Label>{t("Proposal title")}</Field.Label>
            <Input
              data-testid="proposal-title-input"
              disabled={isDisabled}
              placeholder={t("Enter proposal title")}
              colorPalette="blue"
              {...register("title", {
                required: t("This field is required"),
              })}
            />
            {errors.title && (
              <Field.ErrorText data-testid="newproposal-form-title-error-message">
                {errors.title.message}
              </Field.ErrorText>
            )}
          </Field.Root>
        )}
        {renderDescription && (
          <Field.Root invalid={!!errors.description}>
            <Field.Label>{t("Proposal description")}</Field.Label>
            <Textarea
              data-testid="proposal-description-input"
              disabled={isDisabled}
              placeholder={t("Enter proposal description")}
              {...register("description", {
                required: t("This field is required"),
              })}
              colorPalette="blue"
            />
            {errors.description && (
              <Field.ErrorText data-testid="newproposal-form-description-error-message">
                {errors.description.message}
              </Field.ErrorText>
            )}
          </Field.Root>
        )}
        {renderMarkdownDescription && (
          <Field.Root w="full" mt={4} maxH={400} h={400} invalid={!!errors.markdownDescription}>
            <Field.Label>
              <Heading size="md">{t("Your proposal")}</Heading>
            </Field.Label>
            <Controller
              data-testid="proposal-markdown-description-input"
              name="markdownDescription"
              control={control}
              render={({ field }) => (
                <MDEditor
                  style={{
                    marginTop: "1rem",
                  }}
                  {...field}
                  height={"100%"}
                  value={field.value}
                  onChange={field.onChange}
                  previewOptions={{
                    rehypePlugins: [[rehypeSanitize]],
                  }}
                />
              )}
            />
            {errors.markdownDescription && (
              <Field.ErrorText data-testid="newproposal-form-markdown-error-message">
                {errors.markdownDescription.message}
              </Field.ErrorText>
            )}
          </Field.Root>
        )}
      </VStack>

      {renderActions && (
        <VStack gap={4} align="flex-start" w="full" mt={12} data-testid="proposal-actions-container">
          <Heading size="md">{t("Executable functions")}</Heading>
          <VStack gap={8} align="flex-start" w="full">
            {fields?.map((field, index) => {
              const onAddAnotherTransactionClick = () => {
                insert(index + 1, {
                  name: field.name,
                  icon: field.icon,
                  description: field.description,
                  params: field.params,
                  abiDefinition: field.abiDefinition,
                  contractAddress: field.contractAddress,
                  calldata: undefined,
                })
              }

              const wasAddedLater = fields.filter((_field, i) => _field.name === field.name && i < index).length > 0
              return (
                <ExecutableFunctionCard
                  key={field.id}
                  field={field}
                  index={index}
                  register={register}
                  control={control}
                  errors={errors}
                  isDisabled={isDisabled}
                  {...(canAddAnotherTransaction && { onAddAnotherTransactionClick: onAddAnotherTransactionClick })}
                  {...(wasAddedLater && { onRemoveTransactionClick: () => remove(index) })}
                />
              )
            })}
          </VStack>
        </VStack>
      )}
    </form>
  )
}
