import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  FormLabelProps,
  Input,
  InputProps,
  Select,
  SelectProps,
} from "@chakra-ui/react"
import { Control, Controller, FieldError, FieldErrorsImpl, Merge, UseFormRegister } from "react-hook-form"
import { AddressUtils } from "@repo/utils"
import { useMemo } from "react"
import { FormData as ProposalFunctionFormData } from "@/app/proposals/new/form/functions/details/components/NewProposalForm"
import { useTranslation } from "react-i18next"

/**
 * Represent a single parameter of the function to call in the smart contract
 * This is used to typing the inputs of the abi definition
 */
export type FunctionParamsField = {
  id: string
  name: string
  type: string
  internalType?: string
  value: any
  requiresEthParse?: boolean
}

type Props = {
  actionIndex: number
  field: Omit<FunctionParamsField, "id">
  index: number
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
  register: UseFormRegister<ProposalFunctionFormData>
  inputProps?: InputProps
  selectProps?: SelectProps
  formLabelProps?: FormLabelProps
  humanizeLabels?: boolean
  control: Control<ProposalFunctionFormData, any>
}

export const GenerateFunctionToCallParamsInput: React.FC<Props> = ({
  actionIndex,
  field,
  index,
  error,
  register,
  inputProps = {},
  selectProps = {},
  formLabelProps = {},
  humanizeLabels = true,
  control,
}) => {
  const { t } = useTranslation()
  const label = useMemo(() => {
    //TODO: handle this with humanName field in the featured fucntion param itself
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
  }, [field.name, field.type, humanizeLabels])
  if (field.type === "address") {
    return (
      <FormControl isInvalid={!!error}>
        <FormLabel {...formLabelProps}>{label}</FormLabel>
        <Input
          data-testid={`generated-function-to-call-${index}`}
          type="text"
          placeholder="Insert value..."
          {...register(`actions.${actionIndex}.params.${index}.value`, {
            required: "Field is required",
            validate: value => AddressUtils.isValid(value) || "Invalid address",
          })}
          {...inputProps}
        />
        <FormErrorMessage data-testid={`generated-function-to-call-${index}-error`}>
          {error?.message?.toString()}
        </FormErrorMessage>
      </FormControl>
    )
  }

  if (field.type === "bytes32") {
    return (
      <FormControl isInvalid={!!error}>
        <FormLabel {...formLabelProps}>{label}</FormLabel>
        <Input
          data-testid={`generated-function-to-call-${index}`}
          type="text"
          placeholder="Insert value..."
          {...register(`actions.${actionIndex}.params.${index}.value`, {
            required: "Field is required",
            validate: value => value.length === 66 || "Invalid bytes32",
          })}
          {...inputProps}
        />
        <FormErrorMessage data-testid={`generated-function-to-call-${index}-error`}>
          {error?.message?.toString()}
        </FormErrorMessage>
      </FormControl>
    )
  }
  if (field.type === "uint256") {
    return (
      <FormControl isInvalid={!!error}>
        <FormLabel {...formLabelProps}>{label}</FormLabel>
        <Input
          data-testid={`generated-function-to-call-${index}`}
          type="text"
          placeholder="Insert value..."
          {...register(`actions.${actionIndex}.params.${index}.value`, {
            required: "Field is required",
            valueAsNumber: true,
            validate: value => {
              const isValidNumber = !isNaN(value)
              if (!isValidNumber) return "Invalid number"
              return value >= 0 || "Value must be greater than or equal to 0"
            },
          })}
          {...inputProps}
        />
        <FormErrorMessage data-testid={`generated-function-to-call-${index}-error`}>
          {error?.message?.toString()}
        </FormErrorMessage>
      </FormControl>
    )
  }
  if (field.type === "bool") {
    return (
      <FormControl isInvalid={!!error}>
        <FormLabel {...formLabelProps}>{label}</FormLabel>
        <Controller
          name={`actions.${actionIndex}.params.${index}.value`}
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <Select
              placeholder="Select value..."
              value={field.value}
              onChange={e => field.onChange(e.target.value === "true" ? 1 : 0)}
              {...selectProps}>
              <option value="true">{t("True")}</option>
              <option value="false">{t("False")}</option>
            </Select>
          )}
        />
        <FormErrorMessage data-testid={`generated-function-to-call-${index}-error`}>
          {error?.message?.toString()}
        </FormErrorMessage>
      </FormControl>
    )
  }

  return (
    <FormControl isInvalid={!!error}>
      <FormLabel {...formLabelProps}>{label}</FormLabel>
      <Input
        data-testid={`generated-function-to-call-${index}`}
        type="text"
        placeholder="Insert value..."
        {...register(`actions.${actionIndex}.params.${index}.value`, { required: "Field is required" })}
        {...inputProps}
      />
      <FormErrorMessage data-testid={`generated-function-to-call-${index}-error`}>
        {error?.message?.toString()}
      </FormErrorMessage>
    </FormControl>
  )
}
