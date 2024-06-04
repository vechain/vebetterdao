"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Button, Card, CardBody, Divider, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCallback, useEffect } from "react"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useProposalFormStore } from "@/store"
import { NewProposalForm } from "../functions/details/components/NewProposalForm"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export default function NewProposalPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { actions, markdownDescription } = useProposalFormStore()

  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/round")
  }, [router])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/preview")
  }, [])

  return (
    <MotionVStack data-testid="new-proposal-preview-page">
      <Card w="full">
        <CardBody py={8}>
          <VStack spacing={8} align="flex-start" divider={<Divider />}>
            <Heading size="lg">{t("Check your proposal before publishing")}</Heading>
            <MarkdownPreview
              data-testid="proposal-markdown-description-preview"
              source={markdownDescription}
              style={{
                padding: "1rem",
              }}
            />
            {!!actions.length && (
              <NewProposalForm
                renderTitle={false}
                renderDescription={false}
                isDisabled={true}
                canAddAnotherTransaction={false}
              />
            )}
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
              <Button data-testid="continue" rounded="full" colorScheme="primary" size="lg" onClick={onContinue}>
                {t("Continue")}
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </MotionVStack>
  )
}
