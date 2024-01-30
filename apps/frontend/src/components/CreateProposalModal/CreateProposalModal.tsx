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
  Icon,
  HStack,
  Heading,
  ModalFooter,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useFieldArray, useForm } from "react-hook-form"

import { getConfig } from "@repo/config"
import { useEffect, useMemo } from "react"
import { GenerateFunctionToCallParamsInput } from "./GenerateFunctionToCallParamsInput"
import { FaPlus } from "react-icons/fa6"
import { ProposalAction, useCreateProposal } from "@/hooks/useCreateProposal"

const config = getConfig()
const AvailableContracts = config.governanceAvailableContracts

type Props = {
  isOpen: boolean
  onClose: () => void
}
export type FunctionParamsField = { id: string; name: string; type: string; internalType: string; value: any }

export type FormData = {
  description?: string
  functionToCall?: string
} & Omit<ProposalAction, "contractAbi">

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
  const watchDescription = watch("description")

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

  /**
   * This is the selected abi for the function to call
   * We need to infer this because object cannot be used as a value in the input
   */
  const selectedAbi = useMemo(() => {
    if (!watchFunctionToCall) return undefined

    return selectedContractFunctions.find(contractFunction => contractFunction.name === watchFunctionToCall)
  }, [watchFunctionToCall])

  /**
   * This is the list of inputs for the selected function to call
   */
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

  const createProposal = useCreateProposal({})

  const onSubmit = (data: FormData) => {
    console.log({ data })
    createProposal.sendTransaction(data.description, [
      {
        contractAddress: data.contractAddress,
        contractAbi: selectedAbi,
        functionParams: data.functionParams,
      },
    ])
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FaPlus} />
              <Heading size="md">Create new proposal</Heading>
            </HStack>
          </ModalHeader>

          <ModalCloseButton />
          <ModalBody>
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
                    <option value={contract.address} key={contract.address}>
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
                  {selectedContractFunctions.map(contractAbi => (
                    <option value={contractAbi.name} key={contractAbi.name}>
                      {contractAbi.name}
                    </option>
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
                    key={field.id}
                    field={field}
                    index={index}
                    register={register}
                    error={errors.functionParams?.[index]?.value}
                  />
                )
              })}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" leftIcon={<Icon as={FaPlus} />}>
              Create proposal
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
