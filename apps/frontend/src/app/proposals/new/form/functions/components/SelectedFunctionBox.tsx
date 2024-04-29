import { GovernanceFeaturedContractsWithFunctions } from "@/constants"
import { Card, CardBody, Divider, HStack, Heading, IconButton, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { FaX } from "react-icons/fa6"
import { abi } from "thor-devkit"

type Props = {
  functionData: {
    contractAddress: string
    calldata: string
    abi: abi.Function
  }
  index: number
  onRemove: () => void
}

export const SelectedFunctionBox = ({ functionData, index, onRemove }: Props) => {
  const featuredContract = GovernanceFeaturedContractsWithFunctions.find(
    contract => contract.contract.address === functionData.contractAddress,
  )?.functions.find(func => func.functionName === functionData.abi.definition.name)

  const decodedCalldata = useMemo(() => {
    return abi.decodeParameters(functionData.abi.definition.inputs, `0x${functionData.calldata.slice(10)}`)
  }, [functionData.calldata, functionData.abi])

  console.log(decodedCalldata, "decoded")

  console.log(functionData.abi.definition.inputs, "inputs")

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody px={0} py={4}>
        <VStack spacing={4} align="flex-start" divider={<Divider />}>
          <HStack w="full" justify={"space-between"} px={4}>
            <Heading size="sm">Function {index + 1}:</Heading>
            <IconButton aria-label="Remove function" icon={<FaX />} onClick={onRemove} variant={"ghost"} />
          </HStack>
          <VStack spacing={0} align="flex-start">
            <Text px={4} fontSize="sm" as="samp">
              {featuredContract
                ? `${featuredContract.name} - ${featuredContract.functionName}(${functionData.abi.definition.inputs.map(
                    input => `${decodedCalldata[input.name]}`,
                  )})`
                : functionData.abi.definition.name}
            </Text>
            <Text px={4} fontSize="sm" fontWeight={400} color={"gray.500"} as="samp">
              {featuredContract?.description ?? functionData.abi.definition.name}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
