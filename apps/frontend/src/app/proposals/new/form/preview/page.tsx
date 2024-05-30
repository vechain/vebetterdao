"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Button, Card, CardBody, Divider, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { NewProposalForm } from "../functions/details/components/NewProposalForm"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/dapp-kit-react"

export default function NewProposalPage() {
  const { account } = useWallet()
  const router = useRouter()
  const { t } = useTranslation()
  const { actions, markdownDescription, title, shortDescription } = useProposalFormStore()

  //redirect the user to the beginning of the form if the required data is missing
  // this happens in case the user tries to access this page directly
  const isVisitAuthorized = useMemo(
    () => !!title && !!shortDescription && !!markdownDescription && !!account,
    [title, shortDescription, markdownDescription, account],
  )
  useLayoutEffect(() => {
    if (!isVisitAuthorized) {
      router.push("/proposals/new")
    }
  }, [isVisitAuthorized, router])

  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/round")
  }, [router])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal/preview")
  }, [])

  if (!isVisitAuthorized) return null

  return (
    <MotionVStack>
      <Card w="full">
        <CardBody py={8}>
          <VStack spacing={8} align="flex-start" divider={<Divider />}>
            <Heading size="lg">{t("Check your proposal before publishing")}</Heading>
            <MarkdownPreview
              source={markdownDescription}
              style={{
                padding: "1rem",
              }}
            />
            {!!actions.length && <NewProposalForm renderTitle={false} renderDescription={false} isDisabled={true} />}
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
    </MotionVStack>
  )
}
