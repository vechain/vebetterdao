import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react"
import B3trContractJson from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import Vot3ContractJson from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import GovernorContractJson from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import TimelockContractJson from "@repo/contracts/artifacts/contracts/governance/Timelock.sol/Timelock.json"
import { register } from "module"
import { FieldError, FieldErrorsImpl, Merge, UseFormRegister } from "react-hook-form"
import { FormData, FunctionParamsField } from "../CreateProposalModal"
import { AddressUtils } from "@repo/utils"

type Props = {
  field: FunctionParamsField
  index: number
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
  register: UseFormRegister<FormData>
}

export const GenerateFunctionToCallParamsInput: React.FC<Props> = ({ field, index, error, register }) => {
  console.log({ field, error })
  if (field.type === "address") {
    return (
      <FormControl key={field.id} isInvalid={!!error}>
        <FormLabel>{field.name}</FormLabel>
        <Input
          type="text"
          placeholder={field.name}
          {...register(`functionParams.${index}.value`, {
            required: true,
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
        <FormLabel>{field.name}</FormLabel>
        <Input
          type="number"
          placeholder={field.name}
          {...register(`functionParams.${index}.value`, { required: true })}
        />
        <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
      </FormControl>
    )
  }

  return (
    <FormControl key={field.id} isInvalid={!!error}>
      <FormLabel>{field.name}</FormLabel>
      <Input type="text" placeholder={field.name} {...register(`functionParams.${index}.value`, { required: true })} />
      <FormErrorMessage>{error && error.message?.toString()}</FormErrorMessage>
    </FormControl>
  )
}
