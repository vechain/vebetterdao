import { Button, Card, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { FormData, NewProposalForm } from "./NewProposalForm"
import { abi } from "thor-devkit"
import { useProposalFormStore } from "@/store"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"

import {
  buttonClicked,
  buttonClickActions,
  ButtonClickProperties,
  updateMarkdownTemplatePlaceholders,
} from "@/constants"
import { AnalyticsUtils } from "@/utils"

export const NewProposalFormDetailsPageContent: React.FC = () => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const router = useRouter()
  const { setData } = useProposalFormStore()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onSubmit = useCallback(
    (data: FormData) => {
      const markdownDescription = updateMarkdownTemplatePlaceholders({
        title: data.title,
        shortDescription: data.description,
        actionsLength: data.actions.length,
        account: account?.address,
      })
      setData({
        title: data.title,
        shortDescription: data.description,
        markdownDescription,
        actions: data.actions.map(action => {
          const _abi = new abi.Function(action.abiDefinition)
          return {
            contractAddress: action.contractAddress,
            abiDefinition: action.abiDefinition,
            name: action.name,
            description: action.description,
            calldata: _abi.encode(
              ...action.params.map(param => {
                if (param.requiresEthParse) {
                  const value = ethers.parseEther(String(param.value))
                  return value.toString()
                } else return param.value
              }),
            ),
          }
        }),
      })

      router.push("/proposals/new/form/content")
      AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CONTINUE_CREATE_PROPOSAL_ABOUT))
    },
    [setData, router, account?.address],
  )

  return (
    <Card.Root w="full" data-testid="new-proposal-form" variant="baseWithBorder">
      <Card.Body py={8}>
        <VStack gap={[4, 8]} align="flex-start">
          <Heading size="lg">{t("What is your proposal about?")}</Heading>
          <Heading size="md">{t("Basic information")}</Heading>
          <NewProposalForm onSubmit={onSubmit} formId="new-proposal-form" />
          <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
            <Button data-testid="go-back" variant="primarySubtle" onClick={goBack}>
              {t("Go back")}
            </Button>
            <Button data-testid="continue" variant="primaryAction" type="submit" form="new-proposal-form">
              {t("Continue")}
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
