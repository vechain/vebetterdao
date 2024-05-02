import { FormControl, FormErrorMessage, FormLabel, FormLabelProps, Input, InputProps, Stack } from "@chakra-ui/react"
import { FieldError, FieldErrorsImpl, Merge, UseFormRegister } from "react-hook-form"
import { FunctionParamsField } from "../CreateProposalModal"
import { AddressUtils } from "@repo/utils"
import { useMemo } from "react"
import { FormData as ProposalFunctionFormData } from "@/app/proposals/new/form/functions/details/components/NewProposalForm"

type Props = {
  actionIndex: number
  field: Omit<FunctionParamsField, "id">
  index: number
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
  register: UseFormRegister<ProposalFunctionFormData>
  inputProps?: InputProps
  formLabelProps?: FormLabelProps
  humanizeLabels?: boolean
}

export const GenerateFunctionToCallParamsInput: React.FC<Props> = ({
  actionIndex,
  field,
  index,
  error,
  register,
  inputProps = {},
  formLabelProps = {},
  humanizeLabels = true,
}) => {
  const label = useMemo(() => {
    if (humanizeLabels) {
      switch (field.name) {
        case "_to":
          return "Who will receive the tokens?"
        case "_value":
          return "How many tokens will be sent?"
        case "newProposalThreshold":
          return "New proposal threshold"
        case "newMinVotingDelay":
          return "New minimum voting delay"
        case "appSharesCap_":
          return "App shares cap"
        default:
          return field.name
      }
    }
    return `${field.name} (${field.type})`
  }, [field.name, humanizeLabels])
  if (field.type === "address") {
    return (
      <FormControl isInvalid={!!error}>
        <FormLabel {...formLabelProps}>{label}</FormLabel>
        <Input
          type="text"
          placeholder="Insert value..."
          {...register(`actions.${actionIndex}.params.${index}.value`, {
            required: "Field is required",
            validate: value => AddressUtils.isValid(value) || "Invalid address",
          })}
          {...inputProps}
        />
        <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
      </FormControl>
    )
  }
  if (field.type === "uint256") {
    return (
      <FormControl isInvalid={!!error}>
        <FormLabel {...formLabelProps}>{label}</FormLabel>
        <Input
          type="number"
          placeholder="Insert value..."
          {...register(`actions.${actionIndex}.params.${index}.value`, {
            required: "Field is required",
            valueAsNumber: true,
          })}
          {...inputProps}
        />
        <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
      </FormControl>
    )
  }

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel {...formLabelProps}>{label}</FormLabel>
      <Input
        type="text"
        placeholder="Insert value..."
        {...register(`actions.${actionIndex}.params.${index}.value`, { required: "Field is required" })}
        {...inputProps}
      />
      <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
    </FormControl>
  )
}
