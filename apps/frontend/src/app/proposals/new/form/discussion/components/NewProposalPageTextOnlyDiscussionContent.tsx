import { Card, CardBody, VStack, Heading, HStack, Button, CardFooter, Text } from "@chakra-ui/react"
import { FormData, NewProposalForm } from "../../functions/details/components/NewProposalForm"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useProposalFormStore } from "@/store"
import { useTranslation } from "react-i18next"
import { updateMarkdownTemplatePlaceholders } from "@/constants"
import { useWallet } from "@vechain/dapp-kit-react"

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
        account,
      })
      setData({
        title: data.title,
        shortDescription: data.description,
        markdownDescription,
        actions: [],
      })

      router.push("/proposals/new/form/content")
    },
    [setData, router, account],
  )

  return (
    <Card w="full" data-testid="new-proposal-textonly-page">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">{t("General proposal")}</Heading>
          <Text fontSize="md" color="gray.500">
            {t(
              "Choose a title a short description for your proposal. You will be able to provide more details in the next step.",
            )}
          </Text>

          <NewProposalForm
            formId="new-proposal-form"
            renderActions={false}
            renderMarkdownDescription={false}
            onSubmit={onSubmit}
          />
        </VStack>
      </CardBody>
      <CardFooter>
        <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
          <Button
            data-testid="go-back"
            rounded="full"
            variant={"primarySubtle"}
            colorScheme="primary"
            size="lg"
            onClick={goBack}>
            {t("Go back")}
          </Button>
          <Button
            data-testid="continue"
            rounded="full"
            colorScheme="primary"
            size="lg"
            type="submit"
            form="new-proposal-form">
            {t("Continue")}
          </Button>
        </HStack>
      </CardFooter>
    </Card>
  )
}
