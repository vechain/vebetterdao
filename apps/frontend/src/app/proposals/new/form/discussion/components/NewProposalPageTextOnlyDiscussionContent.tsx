import { Card, CardBody, VStack, Heading, HStack, Button, CardFooter } from "@chakra-ui/react"
import { FormData, NewProposalForm } from "../../functions/details/components/NewProposalForm"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useProposalFormStore } from "@/store/useProposalFormStore"

export const NewProposalPageTextOnlyDiscussionContent: React.FC = () => {
  const router = useRouter()

  const { title, shortDescription, markdownDescription, setData } = useProposalFormStore()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onSubmit = useCallback(
    (data: FormData) => {
      setData({
        title: data.title,
        shortDescription: data.description,
        markdownDescription: data.markdownDescription,
        actions: [],
      })
      router.push("/proposals/new/form/preview")
    },
    [setData, router],
  )

  return (
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">Text only proposal</Heading>

          <NewProposalForm
            formId="new-proposal-form"
            renderActions={false}
            renderMarkdownDescription={true}
            title={title}
            description={shortDescription}
            markdownDescription={markdownDescription}
            onSubmit={onSubmit}
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
