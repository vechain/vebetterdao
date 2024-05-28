import {
  Card,
  CardBody,
  VStack,
  Heading,
  HStack,
  Box,
  Divider,
  Text,
  Checkbox,
  Button,
  FormControl,
  Select,
  FormLabel,
  Stack,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { GovernanceFeaturedFunction, getEnvWhitelistedContractsWithFunctions, notFoundImage } from "@/constants"
import { useRouter } from "next/navigation"

import { getConfig } from "@repo/config"
import { useTranslation } from "react-i18next"
import { EnvConfig, EnvConfigValues } from "@repo/config/contracts"
import { CheckableCard } from "@/components"

const env = getConfig().environment

const devEnvs: EnvConfig[] = ["local", "e2e", "solo-staging"]

type SelectedFunction = GovernanceFeaturedFunction & {
  contractAddress: string
}
export const FunctionsPageContent = () => {
  const { t } = useTranslation()
  const { actions, setData } = useProposalFormStore()

  const [featuredFunctionsEnv, setFeaturedFunctionsEnv] = useState<EnvConfig>(env)

  const [submitError, setSubmitError] = useState<string | null>(null)
  const contractsWithFunctionsToRender = useMemo(
    () => getEnvWhitelistedContractsWithFunctions(featuredFunctionsEnv),
    [featuredFunctionsEnv],
  )

  const router = useRouter()

  const onContinue = useCallback(() => {
    if (actions?.length === 0) {
      setSubmitError(t("Please select at least one function"))
      return
    }
    router.push("/proposals/new/form/functions/details")
  }, [router, actions, t])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const handleAddFunction = useCallback(
    (data: SelectedFunction) => () => {
      setSubmitError(null)
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

  const renderContractsWithFunctions = useMemo(() => {
    if (contractsWithFunctionsToRender.length === 1) {
      const functions = contractsWithFunctionsToRender[0]!.functions
      if (functions.length <= 3) {
        let gridSize = 1
        switch (functions.length) {
          case 1:
            gridSize = 2
            break
          case 2:
            gridSize = 2
            break
          case 3:
            gridSize = 3
            break
          default:
            gridSize = 3
        }
        return (
          <Grid templateColumns={["repeat(1, 1fr)", `repeat(${gridSize}, 1fr)`]} gap={[4, 4, 8]} w="full">
            {contractsWithFunctionsToRender.map((contract, index) => {
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
                      cardProps={{
                        flex: 1,
                      }}
                      key={index}
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
  }, [contractsWithFunctionsToRender, actions, handleAddFunction, handleRemoveFunction])

  return (
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Box>
            <Stack direction={["column", "row"]} w="full" justify={"space-between"}>
              <Heading size="lg">{t("What is your proposal about?")}</Heading>
              {devEnvs.includes(env) && (
                <FormControl w="auto">
                  <FormLabel>{t("Dev: Choose an environment")}</FormLabel>
                  <Select
                    placeholder={t("Select an environment")}
                    value={featuredFunctionsEnv}
                    onChange={e => setFeaturedFunctionsEnv(e.target.value as EnvConfig)}>
                    {EnvConfigValues.map((env, index) => (
                      <option key={index} value={env}>
                        {env}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
            <Text fontSize="sm" fontWeight={400} color={"gray.500"} mt={4}>
              {t(
                "Proposals are based on smart contracts that will be executed. Select the action that you proposal will trigger if succeed in the voting session.",
              )}
            </Text>
          </Box>

          {renderContractsWithFunctions}
          <HStack w="full" justify={"space-between"}>
            <Text color="red.500" fontSize="md" fontWeight={600}>
              {submitError}
            </Text>
            <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
              <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                {t("Go back")}
              </Button>
              <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinue}>
                {t("Continue")}
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
