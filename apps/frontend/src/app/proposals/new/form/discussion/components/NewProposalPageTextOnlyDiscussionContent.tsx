import { Card, CardBody, VStack, Heading, HStack, Button, CardFooter } from "@chakra-ui/react"
import { NewProposalForm } from "../../functions/details/components/NewProposalForm"
import { useCallback } from "react"
import { useRouter } from "next/navigation"

export const NewProposalPageTextOnlyDiscussionContent: React.FC = () => {
  const router = useRouter()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onContinue = useCallback(() => {
    router.push("/proposals/new/form/preview")
  }, [router])

  return (
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">Text only proposal</Heading>

          <NewProposalForm
            onSubmit={onContinue}
            formId="new-proposal-form"
            renderActions={false}
            renderMarkdownDescription={true}
          />
        </VStack>
      </CardBody>
      <CardFooter>
        <HStack alignSelf={"flex-end"} justify={"flex-end"} spacing={4} flex={1}>
          <Button rounded="full" variant={"primarySubtle"} colorScheme="primary" size="lg" onClick={goBack}>
            Go back
          </Button>
          <Button rounded="full" colorScheme="primary" size="lg" type="submit" form="new-proposal-form">
            Continue
          </Button>
        </HStack>
      </CardFooter>
    </Card>
  )
}
