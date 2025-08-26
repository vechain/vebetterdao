import { Card, VStack, Heading, HStack, Box, Text, Button, Field, NativeSelect, Stack } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useProposalFormStore } from "@/store"
import { useRouter } from "next/navigation"

import { getConfig } from "@repo/config"
import { useTranslation } from "react-i18next"
import { EnvConfig, EnvConfigValues, AppEnv } from "@repo/config/contracts"
import { ContractsWithFunctions, SelectedFunction } from "./ContractsWithFunctions"

import {
  buttonClicked,
  buttonClickActions,
  ButtonClickProperties,
  getEnvWhitelistedContractsWithFunctions,
} from "@/constants"
import { AnalyticsUtils } from "@/utils"

const devEnvs: EnvConfig[] = [AppEnv.LOCAL, AppEnv.E2E, AppEnv.TESTNET_STAGING, AppEnv.GALACTICA_TEST]

export const FunctionsPageContent = () => {
  const env = getConfig().environment
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
    AnalyticsUtils.trackEvent(
      buttonClicked,
      buttonClickActions(ButtonClickProperties.CONTINUE_CREATE_PROPOSAL_FUNCTIONS),
    )
  }, [router, actions, t])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const handleAddFunction = useCallback(
    (data: SelectedFunction) => () => {
      setSubmitError(null)
      setData({
        actions: [...actions, data],
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
    <Card.Root w="full" variant="baseWithBorder">
      <Card.Body py={8}>
        <VStack gap={8} align="flex-start">
          <Box>
            <Stack direction={["column", "row"]} w="full" justify={"space-between"}>
              <Heading size="3xl">{t("What is your proposal about?")}</Heading>
              {devEnvs.includes(env) && (
                <Field.Root w="auto" data-testid="dev__select_env">
                  <Field.Label>{t("Dev: Choose an environment")}</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Indicator />
                    <NativeSelect.Field
                      placeholder={t("Select an environment")}
                      value={featuredFunctionsEnv}
                      onChange={e => setFeaturedFunctionsEnv(e.target.value as EnvConfig)}>
                      {EnvConfigValues.map(env => (
                        <option key={env} value={env}>
                          {env}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
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
            <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
              <Button data-testid="go-back" variant="primarySubtle" onClick={goBack}>
                {t("Go back")}
              </Button>
              <Button data-testid="continue" variant="primaryAction" onClick={onContinue}>
                {t("Continue")}
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
