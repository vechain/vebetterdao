import { FormControl, FormErrorMessage, FormLabel, Input, Stack } from "@chakra-ui/react"
import { FieldError, FieldErrorsImpl, Merge, UseFormRegister } from "react-hook-form"
import { FormData, FunctionParamsField } from "../CreateProposalModal"
import { AddressUtils } from "@repo/utils"

type Props = {
  field: FunctionParamsField
  index: number
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
  register: UseFormRegister<{ functionParams: FunctionParamsField[] }>
}

export const GenerateFunctionToCallParamsInput: React.FC<Props> = ({ field, index, error, register }) => {
  if (field.type === "address") {
    return (
      <FormControl key={field.id} isInvalid={!!error}>
        <FormLabel as="samp" fontSize="sm" fontWeight={400} color={"gray.500"}>
          {field.name} ({field.type})
        </FormLabel>
        <Input
          type="text"
          placeholder="Insert value..."
          {...register(`functionParams.${index}.value`, {
            required: "Field is required",
            validate: value => AddressUtils.isValid(value) || "Invalid address",
          })}
        />
        <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
      </FormControl>
    )
  }
  if (field.type === "uint256") {
    return (
      <FormControl key={field.id} isInvalid={!!error}>
        <FormLabel as="samp" fontSize="sm" fontWeight={400} color={"gray.500"}>
          {field.name} ({field.type})
        </FormLabel>
        <Input
          type="number"
          placeholder="Insert value..."
          {...register(`functionParams.${index}.value`, { required: "Field is required" })}
        />
        <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
      </FormControl>
    )
  }

  return (
    <FormControl key={field.id} isInvalid={!!error}>
      <FormLabel as="samp" fontSize="sm" fontWeight={400} color={"gray.500"}>
        {field.name} ({field.type})
      </FormLabel>
      <Input
        type="text"
        placeholder="Insert value..."
        {...register(`functionParams.${index}.value`, { required: "Field is required" })}
      />
      <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
    </FormControl>
  )
}
