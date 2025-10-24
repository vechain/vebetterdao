import { Card, VStack, Heading, HStack, Box, Text, Button, Field, NativeSelect, Stack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { EnvConfig, EnvConfigValues, AppEnv } from "@repo/config/contracts"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { buttonClicked, buttonClickActions, ButtonClickProperties } from "../../../../../../constants/AnalyticsEvents"
import { getEnvWhitelistedContractsWithFunctions } from "../../../../../../constants/GovernanceFeaturedFunctions"
import { useProposalFormStore } from "../../../../../../store/useProposalFormStore"
import AnalyticsUtils from "../../../../../../utils/AnalyticsUtils/AnalyticsUtils"

import { ContractsWithFunctions, SelectedFunction } from "./ContractsWithFunctions"

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
    <Card.Root w="full" variant="primary">
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
            <Text textStyle="sm" color={"gray.500"} mt={4}>
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
            <Text color="red.500" textStyle="md" fontWeight="semibold">
              {submitError}
            </Text>
            <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
              <Button data-testid="go-back" variant="link" onClick={router.back}>
                {t("Go back")}
              </Button>
              <Button data-testid="continue" variant="primary" onClick={onContinue}>
                {t("Continue")}
              </Button>
            </HStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
