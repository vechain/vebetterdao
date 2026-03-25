import { Field, FieldLabelProps, Input, NativeSelect, InputProps } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useMemo } from "react"
import { Control, Controller, FieldError, FieldErrorsImpl, Merge, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { FormData as ProposalFunctionFormData } from "@/app/proposals/new/form/functions/details/components/NewProposalForm"

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
  selectProps?: NativeSelect.RootProps
  formLabelProps?: FieldLabelProps
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
      <Field.Root invalid={!!error}>
        <Field.Label {...formLabelProps}>{label}</Field.Label>
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
        <Field.ErrorText>
          <span data-testid={`generated-function-to-call-${index}-error`}>{error?.message?.toString()}</span>
        </Field.ErrorText>
      </Field.Root>
    )
  }

  if (field.type === "bytes32") {
    return (
      <Field.Root invalid={!!error}>
        <Field.Label {...formLabelProps}>{label}</Field.Label>
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
        <Field.ErrorText>
          <span data-testid={`generated-function-to-call-${index}-error`}>{error?.message?.toString()}</span>
        </Field.ErrorText>
      </Field.Root>
    )
  }
  if (field.type === "uint256") {
    return (
      <Field.Root invalid={!!error}>
        <Field.Label {...formLabelProps}>{label}</Field.Label>
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
        <Field.ErrorText>
          <span data-testid={`generated-function-to-call-${index}-error`}>{error?.message?.toString()}</span>
        </Field.ErrorText>
      </Field.Root>
    )
  }
  if (field.type === "bool") {
    return (
      <Field.Root invalid={!!error}>
        <Field.Label {...formLabelProps}>{label}</Field.Label>
        <Controller
          name={`actions.${actionIndex}.params.${index}.value`}
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <NativeSelect.Root {...selectProps}>
              <NativeSelect.Indicator />
              <NativeSelect.Field
                placeholder="Select value..."
                value={field.value === true || field.value === 1 || field.value === "true" ? "true" : "false"}
                onChange={e => field.onChange(e.target.value === "true")}>
                <option value="true">{t("True")}</option>
                <option value="false">{t("False")}</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          )}
        />
        <Field.ErrorText>
          <span data-testid={`generated-function-to-call-${index}-error`}>{error?.message?.toString()}</span>
        </Field.ErrorText>
      </Field.Root>
    )
  }

  return (
    <Field.Root invalid={!!error}>
      <Field.Label {...formLabelProps}>{label}</Field.Label>
      <Input
        data-testid={`generated-function-to-call-${index}`}
        type="text"
        placeholder="Insert value..."
        {...register(`actions.${actionIndex}.params.${index}.value`, { required: "Field is required" })}
        {...inputProps}
      />
      <Field.ErrorText>
        <span data-testid={`generated-function-to-call-${index}-error`}>{error?.message?.toString()}</span>
      </Field.ErrorText>
    </Field.Root>
  )
}
