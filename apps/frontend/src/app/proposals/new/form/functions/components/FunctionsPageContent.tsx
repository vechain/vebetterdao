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
} from "@chakra-ui/react"
import { useCallback, useState } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { GovernanceFeaturedFunction, getEnvWhitelistedContractsWithFunctions } from "@/constants"
import { abi } from "thor-devkit"
import { useRouter } from "next/navigation"

import { getConfig } from "@repo/config"
import { useTranslation } from "react-i18next"
import { EnvConfig, EnvConfigValues } from "@repo/config/contracts"

const env = getConfig().environment

const devEnvs: EnvConfig[] = ["local", "e2e", "solo-staging"]

type SelectedFunction = GovernanceFeaturedFunction & {
  contractAddress: string
}
export const FunctionsPageContent = () => {
  const { t } = useTranslation()
  const { actions, setData } = useProposalFormStore()

  const [featuredFunctionsEnv, setFeaturedFunctionsEnv] = useState<EnvConfig>(env)

  const router = useRouter()

  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/functions/details")
  }, [router])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

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
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Box>
            <HStack w="full" justify={"space-between"}>
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
            </HStack>
            <Text fontSize="sm" fontWeight={400} color={"gray.500"} mt={4}>
              {t(
                "Proposals are based on smart contracts that will be executed. Select the action that you proposal will trigger if succeed in the voting session.",
              )}
            </Text>
          </Box>
          {getEnvWhitelistedContractsWithFunctions(featuredFunctionsEnv).map((contract, index) => (
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
          ))}
          <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
            <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinue}>
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
