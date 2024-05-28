"use client"

import { MotionVStack } from "@/components"
import { AnalyticsUtils } from "@/utils"
import { Button, Card, CardBody, Divider, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCallback, useEffect } from "react"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { NewProposalForm } from "../functions/details/components/NewProposalForm"
import { useRouter } from "next/navigation"

export default function NewProposalPage() {
  const { actions, markdownDescription } = useProposalFormStore()

  const router = useRouter()

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
    <MotionVStack>
      <Card w="full">
        <CardBody py={8}>
          <VStack spacing={8} align="flex-start" divider={<Divider />}>
            <Heading size="lg">Check your proposal before publishing</Heading>
            <MarkdownPreview
              source={markdownDescription}
              style={{
                padding: "1rem",
              }}
            />
            {!!actions.length && <NewProposalForm renderTitle={false} renderDescription={false} isDisabled={true} />}
            <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
              <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
                Go back
              </Button>
              <Button rounded="full" colorScheme="primary" size="lg" onClick={onContinue}>
                Continue
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </MotionVStack>
  )
}
