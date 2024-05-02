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
  Box,
  useDisclosure,
  Text,
} from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useFieldArray, useForm } from "react-hook-form"

import { useEffect, useMemo } from "react"
import { GenerateFunctionToCallParamsInput } from "./GenerateFunctionToCallParamsInput"
import { FaPlus } from "react-icons/fa6"
import { ProposalAction, useCreateProposal } from "@/hooks/useCreateProposal"
import {
  useCanProposalStartInNextRound,
  useCurrentAllocationsRoundId,
  useGetVotes,
  useDepositThreshold,
  useVot3Balance,
} from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { useDelegateVot3 } from "@/hooks/useDelegateVot3"
import { governanceAvailableContracts } from "@/constants"
import { TransactionModal } from "../TransactionModal"

const AvailableContracts = governanceAvailableContracts

type Props = {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}
export type FunctionParamsField = { id: string; name: string; type: string; internalType: string; value: any }

export type FormData = {
  description?: string
  functionToCall?: string
} & Omit<ProposalAction, "contractAbi">

export const CreateProposalModal: React.FC<Props> = ({ isOpen, onClose, onOpen }) => {
  const { isOpen: isConfirmationOpen, onOpen: onConfirmationOpen, onClose: onConfirmationClose } = useDisclosure()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: canProposalStartInNextRound } = useCanProposalStartInNextRound()
  const createProposalMutation = useCreateProposal({})

  const onSubmit = (description: string, actions: ProposalAction[]) => {
    if (!currentRoundId) throw new Error("Current round id is not available")
    const startRoundId = Number(currentRoundId) + (canProposalStartInNextRound ? 1 : 2)
    onConfirmationOpen()
    createProposalMutation.sendTransaction({ description, actions, startRoundId })
  }

  const onTryAgain = () => {
    onConfirmationClose()
    onOpen()
  }
  if (createProposalMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isConfirmationOpen}
        onClose={onConfirmationClose}
        confirmationTitle="Create new proposal"
        successTitle="Proposal created!"
        status={createProposalMutation.error ? "error" : createProposalMutation.status}
        errorDescription={createProposalMutation.error?.reason}
        errorTitle={createProposalMutation.error ? "Error creating proposal" : undefined}
        showTryAgainButton={true}
        onTryAgain={onTryAgain}
        pendingTitle="Creating proposal..."
        txId={createProposalMutation.txReceipt?.meta.txID}
        showExplorerButton
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <ModalContent>
        <CreateProposalModalForm onSubmit={onSubmit} />
      </ModalContent>
    </Modal>
  )
}

type CreateProposalModalFormProps = {
  onSubmit: (description: string, actions: ProposalAction[]) => void
}

export const CreateProposalModalForm: React.FC<CreateProposalModalFormProps> = ({ onSubmit }) => {
  const { account } = useWallet()

  const { data: depositThreshold } = useDepositThreshold()

  const { sendTransaction: delegate } = useDelegateVot3({ address: account ?? undefined })
  const { data: votesObject, isLoading: votesLoading } = useGetVotes(account ?? undefined)
  const votes = votesObject?.scaled

  const { data: vot3Balance } = useVot3Balance(account ?? undefined)
  const { data: canProposalStartInNextRound } = useCanProposalStartInNextRound()

  const {
    handleSubmit,
    register,
    watch,
    control,
    setValue,
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
    setValue("functionToCall", undefined)
  }, [watchContract])

  //Create the fields for the function params inputs
  useEffect(() => {
    remove()
    selectedContractFunctionInputs?.forEach(input => {
      append({ ...input, id: input.name, value: "" })
    })
  }, [selectedContractFunctionInputs, remove, append])

  const handleOnSubmit = (data: FormData) => {
    onSubmit(data.description ?? "", [
      {
        contractAddress: data.contractAddress,
        contractAbi: selectedAbi,
        functionParams: data.functionParams,
      },
    ])
  }

  const delegationMessage = useMemo(() => {
    if (!votes || !vot3Balance || !depositThreshold) return null

    if (Number(votes) < Number(depositThreshold)) {
      if (Number(vot3Balance) > Number(depositThreshold)) {
        return (
          <Heading size="xs" color="orange">
            Your address is not self-delegated to VOT3. Click
            <Button variant="link" onClick={() => delegate(undefined)}>
              here
            </Button>
            to do so
          </Heading>
        )
      } else {
        return (
          <Heading size="xs" color="orange">
            You have not enough balance or delegated VOT3. You need to have at least {depositThreshold} VOT3 to create
            a proposal
          </Heading>
        )
      }
    }

    return <></>
  }, [votes, vot3Balance, depositThreshold])

  const canCreateProposal = useMemo(() => {
    if (!votes || !vot3Balance || !depositThreshold) return false

    if (Number(votes) < Number(depositThreshold)) return false
    return true
  }, [votes, vot3Balance, depositThreshold])

  return (
    <form onSubmit={handleSubmit(handleOnSubmit)}>
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
              placeholder="Insert the proposal description..."
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
                key={`${field.id} - ${index}`}
                field={field}
                index={index}
                register={register}
                error={errors.functionParams?.[index]?.value}
              />
            )
          })}
          <Box alignSelf={"flex-start"} mt={2}>
            {delegationMessage}
          </Box>
          <Text alignSelf={"flex-start"} mt={2} fontSize={"xs"}>
            {canProposalStartInNextRound
              ? "Proposal is going to be votable in the next round"
              : "Not enough time before the next round. Proposal is going to be votable in the round after the next one"}
          </Text>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" leftIcon={<Icon as={FaPlus} />} isDisabled={!canCreateProposal}>
          Create proposal
        </Button>
      </ModalFooter>
    </form>
  )
}
