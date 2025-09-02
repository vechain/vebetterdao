import { CheckableCard } from "@/components"
import { GovernanceFeaturedFunction, notFoundImage, GovernanceFeaturedContractWithFunctions } from "@/constants"
import { Grid, GridItem, VStack, Heading, Separator, Card, HStack, Checkbox, Box, Text } from "@chakra-ui/react"

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
    const functionsNumber = contractsWithFunctionsToRender.reduce((acc, contract) => acc + contract.functions.length, 0)
    if (functionsNumber <= 3) {
      const gridSize = functionsNumberGridSizeMapping[functionsNumber as keyof typeof functionsNumberGridSizeMapping]

      return (
        <Grid templateColumns={["repeat(1, 1fr)", `repeat(${gridSize}, 1fr)`]} gap={[4, 4, 8]} w="full">
          {contractsWithFunctionsToRender.map(contract => {
            return contract.functions.map(func => {
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
                <GridItem colSpan={1} key={`contract-functions-${contract.name}-${func.name}`}>
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
  return contractsWithFunctionsToRender.map(contract => (
    <VStack key={contract.name} gap={4} align="flex-start" w="full">
      <Box>
        <Heading size="md">{contract.name}</Heading>
        <Text textStyle="sm" color={"gray.500"}>
          {contract.description}
        </Text>
      </Box>
      <VStack gap={4} align="flex-start" separator={<Separator />} w="full">
        {contract.functions.map(func => {
          const isSelectedIndex = actions?.findIndex(
            action => action.contractAddress === contract.contract.address && action.name === func.name,
          )
          const isSelected = isSelectedIndex !== -1
          return (
            <Card.Root
              data-testid={`function-card__${contract.name}_${func.name}`}
              borderRadius={"xl"}
              w="full"
              variant="baseWithBorder"
              key={`${contract.name}-${func.name}`}
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
              <Card.Body>
                <HStack w="full" justify={"space-between"}>
                  <VStack gap={0} align={"flex-start"}>
                    <Heading size="md" fontWeight="semibold">
                      {func.name}
                    </Heading>
                    <Text textStyle="sm">{func.description}</Text>
                  </VStack>
                  <Checkbox.Root pointerEvents={"none"} size="lg" colorPalette="primary" checked={isSelected}>
                    <Checkbox.Control />
                  </Checkbox.Root>
                </HStack>
              </Card.Body>
            </Card.Root>
          )
        })}
      </VStack>
    </VStack>
  ))
}
