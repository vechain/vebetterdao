import { Button, Card, CardBody, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { NewProposalForm } from "./NewProposalForm"

export const NewProposalFormDetailsPageContent: React.FC = () => {
  const router = useRouter()

  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/content")
  }, [router])

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">What is your proposal about?</Heading>
          <Heading size="md">Basic information</Heading>
          <NewProposalForm onSubmit={onContinue} formId="new-proposal-form" />
          <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
            <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
              Go back
            </Button>
            <Button rounded="full" colorScheme="primary" size="lg" type="submit" form="new-proposal-form">
              Continue
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
