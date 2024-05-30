import { CheckableCard } from "@/components"
import { GovernanceFeaturedFunction, notFoundImage, GovernanceFeaturedContractWithFunctions } from "@/constants"
import { Grid, GridItem, VStack, Heading, Divider, Card, CardBody, HStack, Checkbox, Box, Text } from "@chakra-ui/react"

/**
 * Map the number of functions to the grid size
 */
const functionsNumberGridSizeMapping = {
  1: 2,
  2: 2,
  3: 3,
}

export type SelectedFunction = GovernanceFeaturedFunction & {
  contractAddress: string
}

type Props = {
  contractsWithFunctionsToRender: GovernanceFeaturedContractWithFunctions[]
  actions: SelectedFunction[]
  handleAddFunction: (func: SelectedFunction) => () => void
  handleRemoveFunction: (index: number) => () => void
}
export const ContractsWithFunctions: React.FC<Props> = ({
  contractsWithFunctionsToRender,
  actions,
  handleAddFunction,
  handleRemoveFunction,
}) => {
  if (contractsWithFunctionsToRender.length === 1) {
    const functions = contractsWithFunctionsToRender[0]!.functions
    if (functions.length <= 3) {
      const gridSize = functionsNumberGridSizeMapping[functions.length as keyof typeof functionsNumberGridSizeMapping]

      return (
        <Grid templateColumns={["repeat(1, 1fr)", `repeat(${gridSize}, 1fr)`]} gap={[4, 4, 8]} w="full">
          {contractsWithFunctionsToRender.map(contract => {
            return contract.functions.map((func, index) => {
              const isSelectedIndex = actions?.findIndex(
                action => action.contractAddress === contract.contract.address && action.name === func.name,
              )
              const isSelected = isSelectedIndex !== -1

              const step = {
                title: func.name,
                description: func.description,
                imageSrc: func.icon ?? notFoundImage,
                onChange: isSelected
                  ? handleRemoveFunction(isSelectedIndex)
                  : handleAddFunction({
                      abiDefinition: func.abiDefinition,
                      contractAddress: contract.contract.address,
                      name: func.name,
                      description: func.description,
                    }),
                checked: isSelected,
              }
              return (
                <GridItem colSpan={1} key={index}>
                  <CheckableCard
                    {...step}
                    inputType="checkbox"
                    cardProps={{
                      flex: 1,
                    }}
                  />
                </GridItem>
              )
            })
          })}
        </Grid>
      )
    }
  }
  return contractsWithFunctionsToRender.map((contract, index) => (
    <VStack key={index} spacing={4} align="flex-start" w="full">
      <Box>
        <Heading size="sm">{contract.name}</Heading>
        <Text fontSize="sm" fontWeight={400} color={"gray.500"}>
          {contract.description}
        </Text>
      </Box>
      <VStack spacing={4} align="flex-start" divider={<Divider />} w="full">
        {contract.functions.map((func, index) => {
          const isSelectedIndex = actions?.findIndex(
            action => action.contractAddress === contract.contract.address && action.name === func.name,
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
                      abiDefinition: func.abiDefinition,
                      contractAddress: contract.contract.address,
                      name: func.name,
                      description: func.description,
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
                  <Checkbox pointerEvents={"none"} size="lg" colorScheme="primary" isChecked={isSelected} />
                </HStack>
              </CardBody>
            </Card>
          )
        })}
      </VStack>
    </VStack>
  ))
}
