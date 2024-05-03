import { FunctionParamsField, MotionVStack } from "@/components"
import { GenerateFunctionToCallParamsInput } from "@/components/GenerateFunctionToCallParamsInput"
import { CustomModalContent } from "@/components/CustomModalContent"
import { GovernanceFeaturedContractsWithFunctions } from "@/constants"
import {
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  Heading,
  VStack,
  Box,
  Text,
  Divider,
  Button,
  HStack,
  Icon,
  IconButton,
} from "@chakra-ui/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"
import { abi } from "thor-devkit"

type Props = {
  isOpen: boolean
  onClose: () => void
  handleAddFunction: (data: { selectedFunction: OnFunctionClickProps; calldata: string }) => void
}

export type OnFunctionClickProps = {
  abiFunction: abi.Function
  contractAddress: string
  functionName: string
  functionDescription: string
}
export const SearchFeaturedFunctionsModal: React.FC<Props> = ({ isOpen, onClose, handleAddFunction }) => {
  const [selectedFunction, setSelectedFunction] = useState<OnFunctionClickProps | null>(null)
  const onFunctionClick = useCallback(
    (data: OnFunctionClickProps) => () => {
      const hasInputs = data.abiFunction.definition.inputs.length > 0
      if (hasInputs) {
        setSelectedFunction(data)
      }
    },
    [onClose],
  )

  const handleOnClose = useCallback(() => {
    setSelectedFunction(null)
    onClose()
  }, [onClose])

  const onAddFunction = useCallback(
    (data: { selectedFunction: OnFunctionClickProps; calldata: string }) => {
      handleAddFunction(data)
      handleOnClose()
    },
    [handleAddFunction, handleOnClose],
  )

  const header = useMemo(
    () =>
      selectedFunction ? (
        <HStack spacing={2}>
          <IconButton
            variant="ghost"
            aria-label="Back"
            icon={<Icon as={FaAngleLeft} />}
            onClick={() => setSelectedFunction(null)}
          />
          <Heading size="md">Function parameters</Heading>
        </HStack>
      ) : (
        <Heading size="md">Search Featured Functions</Heading>
      ),
    [selectedFunction],
  )

  const body = useMemo(
    () =>
      selectedFunction ? (
        <SelectedFunctionModalBody selectedFunction={selectedFunction} onAddFunction={onAddFunction} />
      ) : (
        <SearchFeaturedFunctionsForm onFunctionClick={onFunctionClick} />
      ),
    [selectedFunction, onAddFunction, onFunctionClick],
  )

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose} isCentered={true} size="3xl" scrollBehavior="inside">
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalHeader>{header}</ModalHeader>
        <ModalBody mb={8}>
          <MotionVStack align="flex-start" w="full" renderInnerStack={false}>
            {body}
          </MotionVStack>
        </ModalBody>
      </CustomModalContent>
    </Modal>
  )
}

type SearchFeaturedFunctionsFormProps = {
  onFunctionClick: (data: OnFunctionClickProps) => () => void
}
const SearchFeaturedFunctionsForm: React.FC<SearchFeaturedFunctionsFormProps> = ({ onFunctionClick }) => {
  const [searchValue, setSearchValue] = useState("")

  return (
    <VStack spacing={8} w="full">
      {GovernanceFeaturedContractsWithFunctions.map((contract, index) => (
        <VStack key={index} spacing={4} align="flex-start" w="full">
          <Box>
            <Heading size="sm">{contract.name}</Heading>
            <Text fontSize="sm" fontWeight={400} color={"gray.500"}>
              {contract.description}
            </Text>
          </Box>
          <VStack spacing={4} align="flex-start" divider={<Divider />} w="full">
            {contract.functions.map((func, index) => {
              const functionFragment = contract.contract.abi.abi.find(abi => abi.name === func.functionName)
              if (!functionFragment) return null
              const abiFunction = new abi.Function(functionFragment as abi.Function.Definition)
              return (
                <Button
                  key={index}
                  py={8}
                  w="full"
                  onClick={onFunctionClick({
                    abiFunction,
                    contractAddress: contract.contract.address,
                    functionName: func.name,
                    functionDescription: func.description,
                  })}>
                  <HStack w="full" justify={"space-between"}>
                    <VStack spacing={0} align={"flex-start"}>
                      <Text as="samp" fontSize="sm" fontWeight={500} color={"primary.500"}>
                        {func.name}
                      </Text>
                      <Text fontSize="sm" fontWeight={400} color={"gray.500"}>
                        {func.description}
                      </Text>
                    </VStack>
                    <Icon as={FaAngleRight} color="primary.500" />
                  </HStack>
                </Button>
              )
            })}
          </VStack>
        </VStack>
      ))}
    </VStack>
  )
}

type SelectedFunctionModalBodyProps = {
  selectedFunction: OnFunctionClickProps
  onAddFunction: (data: { selectedFunction: OnFunctionClickProps; calldata: string }) => void
}
const SelectedFunctionModalBody: React.FC<SelectedFunctionModalBodyProps> = ({
  selectedFunction: { abiFunction, contractAddress, functionName, functionDescription },
  onAddFunction,
}) => {
  const { handleSubmit, register, control, formState } = useForm<{ functionParams: FunctionParamsField[] }>()

  const { errors } = formState
  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "functionParams", // unique name for your Field Array
  })

  //Create the fields for the function params inputs
  useEffect(() => {
    remove()
    abiFunction.definition.inputs?.forEach(input => {
      append({ ...input, id: input.name, value: "" })
    })
  }, [abiFunction, remove, append])

  // encode the function call data and pass it to the parent component
  const onSubmit = useCallback(
    (data: { functionParams: FunctionParamsField[] }) => {
      const values = data.functionParams.map(param => param.value)
      const encodedCallData = abiFunction.encode(...values)
      onAddFunction({
        selectedFunction: { abiFunction, contractAddress, functionName, functionDescription },
        calldata: encodedCallData,
      })
    },
    [onAddFunction],
  )

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--chakra-space-8)",
      }}>
      <Box>
        <Heading size="md">{functionName}</Heading>
        <Text fontSize="sm" fontWeight={400} color={"gray.500"}>
          {functionDescription}
        </Text>
      </Box>
      <VStack spacing={4} align="flex-start" w="full">
        <Heading size="sm">Inputs</Heading>
        <VStack spacing={8} align="flex-start" w="full">
          {fields.map((field, index) => (
            <GenerateFunctionToCallParamsInput
              key={field.id}
              field={field}
              register={register}
              index={index}
              error={errors.functionParams?.[index]?.value}
            />
          ))}
        </VStack>
      </VStack>
      <Button type="submit" colorScheme="primary" size="md" alignSelf={"flex-end"}>
        Use function
      </Button>
    </form>
  )
}
