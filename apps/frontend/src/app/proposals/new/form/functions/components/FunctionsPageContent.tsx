import { Card, CardBody, VStack, Heading, HStack, Box, Divider, Text, Checkbox } from "@chakra-ui/react"
import { FaAngleRight } from "react-icons/fa6"
import { useCallback } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { GovernanceFeaturedContractsWithFunctions } from "@/constants"
import { abi } from "thor-devkit"

type SelectedFunction = {
  contractAddress: string
  abi: abi.Function
  functionName?: string
  functionDescription?: string
}
export const FunctionsPageContent = () => {
  const { actions, setData } = useProposalFormStore()
  const handleAddFunction = useCallback(
    (data: SelectedFunction) => () => {
      setData({
        actions: [...(actions ?? []), data],
      })
    },
    [actions, setData],
  )

  const handleRemoveFunction = useCallback(
    (indexToRemove: number) => () => {
      setData({
        actions: actions?.filter((_, index) => index !== indexToRemove) ?? [],
      })
    },
    [actions, setData],
  )

  return (
    <>
      <Card w="full">
        <CardBody py={8}>
          <VStack spacing={8} align="flex-start">
            <Box>
              <Heading size="lg">What is your proposal about?</Heading>
              <Text fontSize="sm" fontWeight={400} color={"gray.500"} mt={4}>
                Proposals are based on smart contracts that will be executed. Select the action that you proposal will
                trigger if succeed in the voting session.
              </Text>
            </Box>
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
                    const isSelectedIndex = actions?.findIndex(
                      action =>
                        action.contractAddress === contract.contract.address && action.functionName === func.name,
                    )
                    const isSelected = isSelectedIndex !== -1
                    return (
                      <Card
                        borderRadius={"xl"}
                        w="full"
                        variant="baseWithBorder"
                        key={index}
                        _hover={{
                          borderColor: "primary.200",
                          transition: "all 0.2s",
                          cursor: "pointer",
                        }}
                        onClick={
                          isSelected
                            ? handleRemoveFunction(isSelectedIndex)
                            : handleAddFunction({
                                abi: abiFunction,
                                contractAddress: contract.contract.address,
                                functionName: func.name,
                                functionDescription: func.description,
                              })
                        }>
                        <CardBody>
                          <HStack w="full" justify={"space-between"}>
                            <VStack spacing={0} align={"flex-start"}>
                              <Heading size="sm" fontWeight={600}>
                                {func.name}
                              </Heading>
                              <Text fontSize="sm" fontWeight={400}>
                                {func.description}
                              </Text>
                            </VStack>
                            <Checkbox size="lg" colorScheme="primary" isChecked={isSelected} />
                          </HStack>
                        </CardBody>
                      </Card>
                    )
                  })}
                </VStack>
              </VStack>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </>
  )
}
