import { VStack, Heading, FormControl, FormLabel, Input, Textarea } from "@chakra-ui/react"

import { useEffect, useCallback } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { abi } from "thor-devkit"
import { ExecutableFunctionCard } from "./ExecutableFunctionCard"
import { FunctionParamsField } from "@/hooks"
import { ProposalFormStoreState, useProposalFormStore } from "@/store/useProposalFormStore"

export type FormData = {
  title: string
  description: string
  actions: (ProposalFormStoreState["actions"][0] & { params: Omit<FunctionParamsField, "id">[] })[]
}

type Props = {
  onSubmit?: (data: FormData) => void
  isDisabled?: boolean
  formId?: string
  renderTitle?: boolean
  renderDescription?: boolean
  renderActions?: boolean
}
export const NewProposalForm: React.FC<Props> = ({
  onSubmit,
  isDisabled = false,
  formId = "proposal-functions-form",
  renderTitle = true,
  renderDescription = true,
  renderActions = true,
}) => {
  const { actions, setData, title, shortDescription } = useProposalFormStore()
  const { handleSubmit, register, control, formState, setValue } = useForm<FormData>()

  const { errors } = formState
  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "actions", // unique name for your Field Array
  })

  //parse actions from store and set them in the form, decoding calldata inf available
  useEffect(() => {
    const formActions = actions.map(action => {
      const _abi = new abi.Function(action.abiDefinition as abi.Function.Definition)
      let decoded: abi.Decoded = {}
      try {
        if (action.calldata) decoded = abi.decodeParameters(_abi.definition.inputs, `0x${action.calldata.slice(10)}`)
      } catch (e) {
        console.error("Error decoding call data", e)
      }
      return {
        ...action,
        params: _abi.definition.inputs.map(param => {
          return {
            name: param.name,
            type: param.type,
            value: decoded[param.name],
          }
        }),
      }
    })
    setValue("actions", formActions)
    setValue("title", title ?? "")
    setValue("description", shortDescription ?? "")
  }, [actions, title, shortDescription, setValue])

  const onFormSubmit = useCallback(
    (data: FormData) => {
      setData({
        title: data.title,
        shortDescription: data.description,
        actions: data.actions.map(action => {
          const _abi = new abi.Function(action.abiDefinition)
          return {
            contractAddress: action.contractAddress,
            abiDefinition: _abi.definition,
            functionName: action.functionName,
            functionDescription: action.functionDescription,
            calldata: _abi.encode(...action.params.map(param => param.value)),
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
          <FormControl>
            <FormLabel>Proposal title</FormLabel>
            <Input
              isDisabled={isDisabled}
              placeholder="Enter proposal title"
              {...register("title", {
                required: "This field is required",
              })}
            />
          </FormControl>
        )}
        {renderDescription && (
          <FormControl>
            <FormLabel>Proposal description</FormLabel>
            <Textarea
              isDisabled={isDisabled}
              placeholder="Enter proposal description"
              {...register("description", {
                required: "This field is required",
              })}
            />
          </FormControl>
        )}
      </VStack>
      {renderActions && (
        <VStack spacing={4} align="flex-start" w="full" mt={4}>
          <Heading size="md">Executable functions</Heading>
          {fields?.map((field, index) => (
            <ExecutableFunctionCard
              key={field.id}
              field={field}
              index={index}
              register={register}
              errors={errors}
              isDisabled={isDisabled}
            />
          ))}
        </VStack>
      )}
    </form>
  )
}
