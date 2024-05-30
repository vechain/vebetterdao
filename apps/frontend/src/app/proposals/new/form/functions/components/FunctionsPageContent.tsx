import {
  Card,
  CardBody,
  VStack,
  Heading,
  HStack,
  Box,
  Text,
  Button,
  FormControl,
  Select,
  FormLabel,
  Stack,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { getEnvWhitelistedContractsWithFunctions } from "@/constants"
import { useRouter } from "next/navigation"

import { getConfig } from "@repo/config"
import { useTranslation } from "react-i18next"
import { EnvConfig, EnvConfigValues } from "@repo/config/contracts"
import { ContractsWithFunctions, SelectedFunction } from "./ContractsWithFunctions"

const env = getConfig().environment

const devEnvs: EnvConfig[] = ["local", "e2e", "solo-staging"]

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

          <ContractsWithFunctions
            contractsWithFunctionsToRender={contractsWithFunctionsToRender}
            actions={actions}
            handleAddFunction={handleAddFunction}
            handleRemoveFunction={handleRemoveFunction}
          />
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
