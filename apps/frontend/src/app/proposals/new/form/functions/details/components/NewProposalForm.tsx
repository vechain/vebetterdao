import { VStack, Heading, FormControl, FormLabel, Input, Textarea, FormErrorMessage } from "@chakra-ui/react"

import { useEffect, useCallback } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { abi } from "thor-devkit"
import { ExecutableFunctionCard } from "./ExecutableFunctionCard"
import { ProposalFormStoreState, useProposalFormStore } from "@/store/useProposalFormStore"
import MDEditor from "@uiw/react-md-editor"
import rehypeSanitize from "rehype-sanitize"
import { FunctionParamsField } from "@/components"
import { ethers } from "ethers"
import { t } from "i18next"
import { useTranslation } from "react-i18next"

export type FormData = {
  title: string
  description: string
  actions: (ProposalFormStoreState["actions"][0] & { params: Omit<FunctionParamsField, "id">[] })[]
  markdownDescription: string
}

type Props = {
  onSubmit?: (data: FormData) => void
  isDisabled?: boolean
  formId?: string
  renderTitle?: boolean
  renderDescription?: boolean
  renderMarkdownDescription?: boolean
  renderActions?: boolean
}

/**
 * This component read/write from/to useFormStore and renders a form to create a new proposal
 * @param param0
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
  const { fields } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "actions", // unique name for your Field Array
  })

  //parse actions from store and set them in the form, decoding calldata inf available
  useEffect(() => {
    const formActions = actions.map(action => {
      const _abi = new abi.Function(action.abiDefinition)
      let decoded: abi.Decoded = {}
      try {
        if (action.calldata) decoded = abi.decodeParameters(_abi.definition.inputs, `0x${action.calldata.slice(10)}`)
      } catch (e) {
        console.error("Error decoding call data", e)
      }
      return {
        ...action,
        params: action.abiDefinition.inputs.map(param => {
          return {
            name: param.name,
            type: param.type,
            value: decoded[param.name]
              ? param.requiresEthParse
                ? ethers.formatEther(decoded[param.name])
                : decoded[param.name]
              : undefined,
            requiresEthParse: param.requiresEthParse,
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
          const _abi = new abi.Function(action.abiDefinition)
          return {
            contractAddress: action.contractAddress,
            abiDefinition: action.abiDefinition,
            name: action.name,
            description: action.description,
            calldata: _abi.encode(
              ...action.params.map(param => {
                if (param.requiresEthParse) {
                  const value = ethers.parseEther(String(param.value))
                  return value.toString()
                } else return param.value
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
      id={formId}
      style={{
        width: "100%",
      }}>
      <VStack spacing={8} align="flex-start" w="full">
        {renderTitle && (
          <FormControl isInvalid={!!errors.title}>
            <FormLabel>{t("Proposal title")}</FormLabel>
            <Input
              isDisabled={isDisabled}
              placeholder={t("Enter proposal title")}
              {...register("title", {
                required: t("This field is required"),
              })}
            />
            {errors.title && <FormErrorMessage>{errors.title.message}</FormErrorMessage>}
          </FormControl>
        )}
        {renderDescription && (
          <FormControl isInvalid={!!errors.description}>
            <FormLabel>{t("Proposal description")}</FormLabel>
            <Textarea
              isDisabled={isDisabled}
              placeholder={t("Enter proposal description")}
              {...register("description", {
                required: t("This field is required"),
              })}
            />
            {errors.description && <FormErrorMessage>{errors.description.message}</FormErrorMessage>}
          </FormControl>
        )}
        {renderMarkdownDescription && (
          <FormControl w="full" mt={4} maxH={400} h={400} isInvalid={!!errors.markdownDescription}>
            <FormLabel>
              <Heading size="md">{t("Your proposal")}</Heading>
            </FormLabel>
            <Controller
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
            {errors.markdownDescription && <FormErrorMessage>{errors.markdownDescription.message}</FormErrorMessage>}
          </FormControl>
        )}
      </VStack>

      {renderActions && (
        <VStack spacing={4} align="flex-start" w="full" mt={4}>
          <Heading size="md">{t("Executable functions")}</Heading>
          {fields?.map((field, index) => (
            <ExecutableFunctionCard
              key={field.id}
              field={field}
              index={index}
              register={register}
              control={control}
              errors={errors}
              isDisabled={isDisabled}
            />
          ))}
        </VStack>
      )}
    </form>
  )
}
