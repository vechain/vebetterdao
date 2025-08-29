import { Card, VStack, Heading, HStack, Button, Text } from "@chakra-ui/react"
import { FormData, NewProposalForm } from "../../functions/details/components/NewProposalForm"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useProposalFormStore } from "@/store"
import { useTranslation } from "react-i18next"
import {
  buttonClickActions,
  buttonClicked,
  ButtonClickProperties,
  updateMarkdownTemplatePlaceholders,
} from "@/constants"
import { useWallet } from "@vechain/vechain-kit"
import { AnalyticsUtils } from "@/utils"

export const NewProposalPageTextOnlyDiscussionContent: React.FC = () => {
  const { account } = useWallet()
  const router = useRouter()

  const { t } = useTranslation()
  const { setData } = useProposalFormStore()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onSubmit = useCallback(
    (data: FormData) => {
      const markdownDescription = updateMarkdownTemplatePlaceholders({
        title: data.title,
        shortDescription: data.description,
        account: account?.address,
      })
      setData({
        title: data.title,
        shortDescription: data.description,
        markdownDescription,
        actions: [],
      })

      router.push("/proposals/new/form/content")
      AnalyticsUtils.trackEvent(
        buttonClicked,
        buttonClickActions(ButtonClickProperties.CONTINUE_CREATE_PROPOSAL_DISCUSSION),
      )
    },
    [setData, router, account],
  )

  return (
    <Card.Root w="full" data-testid="new-proposal-textonly-page">
      <Card.Body py={8}>
        <VStack gap={[6, 8]} alignItems="flex-start">
          <VStack gap={[4, 6]} alignItems="flex-start">
            <Heading size={["xl", "2xl"]}>{t("General proposal")}</Heading>
            <Text textStyle={["sm", "md"]} color="gray.500">
              {t(
                "Choose a title a short description for your proposal. You will be able to provide more details in the next step.",
              )}
            </Text>
          </VStack>

          <NewProposalForm
            formId="new-proposal-form"
            renderActions={false}
            renderMarkdownDescription={false}
            onSubmit={onSubmit}
          />
        </VStack>
      </Card.Body>
      <Card.Footer>
        <HStack alignSelf={"flex-end"} justify={"flex-end"} gap={4} flex={1}>
          <Button data-testid="go-back" variant="primarySubtle" onClick={goBack}>
            {t("Go back")}
          </Button>
          <Button data-testid="continue" variant="primaryAction" type="submit" form="new-proposal-form">
            {t("Continue")}
          </Button>
        </HStack>
      </Card.Footer>
    </Card.Root>
  )
}
