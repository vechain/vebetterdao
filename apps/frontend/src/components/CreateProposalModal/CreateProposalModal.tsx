import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Select,
  VStack,
} from "@chakra-ui/react"
import { AddressUtils, FormattingUtils } from "@repo/utils"
import { type } from "os"
import { useFieldArray, useForm } from "react-hook-form"
import Vot3ContractJson from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import B3trContractJson from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import GovernorContractJson from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import TimelockContractJson from "@repo/contracts/artifacts/contracts/governance/Timelock.sol/Timelock.json"
import { getConfig } from "@repo/config"
import { useEffect, useMemo } from "react"
import { GenerateFunctionToCallParamsInput } from "./GenerateFunctionToCallParamsInput.tsx"
import { register } from "module"

const config = getConfig()
type ExecutorAvailableContracts = {
  abi: typeof B3trContractJson | typeof Vot3ContractJson | typeof GovernorContractJson | typeof TimelockContractJson
  address: string
}
const AvailableContracts: ExecutorAvailableContracts[] = [
  { abi: B3trContractJson, address: config.b3trContractAddress },
  { abi: Vot3ContractJson, address: config.vot3ContractAddress },
  { abi: GovernorContractJson, address: config.governorContractAddress },
  { abi: TimelockContractJson, address: config.timelockContractAddress },
]

type Props = {
  isOpen: boolean
  onClose: () => void
}
export type FunctionParamsField = { id: string; name: string; type: string; internalType: string; value: any }

export type FormData = {
  description?: string
  contractAddress?: string
  functionToCall?: string
  functionParams?: FunctionParamsField[]
}

export const CreateProposalModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    handleSubmit,
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>()

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "functionParams", // unique name for your Field Array
  })

  const watchContract = watch("contractAddress")

  const selectedExecutorContract = useMemo(() => {
    if (!watchContract) {
      return null
    }

    return AvailableContracts.find(contract => contract.address === watchContract)
  }, [watchContract])

  const selectedContractFunctions = useMemo(() => {
    if (!selectedExecutorContract) {
      return []
    }

    return selectedExecutorContract.abi.abi.filter(abi => abi.type === "function")
  }, [selectedExecutorContract])

  const watchFunctionToCall = watch("functionToCall")

  const selectedContractFunctionInputs = useMemo(() => {
    if (!watchFunctionToCall) {
      return []
    }

    return selectedContractFunctions.find(contractFunction => contractFunction.name === watchFunctionToCall)?.inputs
  }, [watchFunctionToCall])

  //Create the fields for the function params inputs
  useEffect(() => {
    setValue("functionParams", [])
    selectedContractFunctionInputs?.forEach(input => {
      append({ ...input, id: input.name, value: "" })
    })
  }, [selectedContractFunctionInputs])

  const onSubmit = (data: FormData) => console.log(data)

  useEffect(() => {
    console.log({ fields })
  }, [fields])

  useEffect(() => {
    console.log({ errors })
  }, [errors])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create new proposal</ModalHeader>

        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4} w="full">
              <FormControl isInvalid={!!errors.description}>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Input
                  id="description"
                  placeholder="Receiver address..."
                  {...register("description", {
                    required: "Description is required",
                  })}
                />
                {errors.description?.message ? (
                  <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
                ) : (
                  <FormHelperText>Provide a description for your proposal</FormHelperText>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.contractAddress}>
                <FormLabel htmlFor="contract">Contract</FormLabel>
                <Select
                  id="contractAddress"
                  placeholder="Select the contract..."
                  {...register("contractAddress", {
                    required: "contractAddress is required",
                  })}
                  variant="outline">
                  {AvailableContracts.map(contract => (
                    <option value={contract.address}>
                      {contract.abi.contractName} ({FormattingUtils.humanAddress(contract.address)})
                    </option>
                  ))}
                </Select>
                {errors.contractAddress?.message ? (
                  <FormErrorMessage>{errors.contractAddress?.message}</FormErrorMessage>
                ) : (
                  <FormHelperText>Select the contract you want to execute your proposal to</FormHelperText>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.functionToCall}>
                <FormLabel htmlFor="functionToCall">Function to call</FormLabel>
                <Select
                  id="functionToCall"
                  isDisabled={!watchContract}
                  placeholder="Select the contract..."
                  {...register("functionToCall", {
                    required: "functionToCall is required",
                  })}
                  variant="outline">
                  {selectedContractFunctions.map(contractFunction => (
                    <option value={contractFunction.name}>{contractFunction.name}</option>
                  ))}
                </Select>
                {errors.functionToCall?.message ? (
                  <FormErrorMessage>{errors.functionToCall?.message}</FormErrorMessage>
                ) : (
                  <FormHelperText>Select the function to call in the SC selected</FormHelperText>
                )}
              </FormControl>
              {fields?.map((field, index) => {
                return (
                  <GenerateFunctionToCallParamsInput
                    field={field}
                    index={index}
                    register={register}
                    error={errors.functionParams?.[index]?.value}
                  />
                )
              })}

              <Button type="submit">Create proposal</Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
