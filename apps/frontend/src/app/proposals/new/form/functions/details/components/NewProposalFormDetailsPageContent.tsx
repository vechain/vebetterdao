import { Button, Card, CardBody, HStack, Heading, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { FormData, NewProposalForm } from "./NewProposalForm"
import { abi } from "thor-devkit"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import ethers from "ethers"

export const NewProposalFormDetailsPageContent: React.FC = () => {
  const router = useRouter()
  const { setData, title, shortDescription, actions, markdownDescription } = useProposalFormStore()

  const goBack = useCallback(() => {
    router.back()
  }, [router])

  const onSubmit = useCallback(
    (data: FormData) => {
      setData({
        title: data.title,
        shortDescription: data.description,
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
    },
    [setData, router],
  )

  return (
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">What is your proposal about?</Heading>
          <Heading size="md">Basic information</Heading>
          <NewProposalForm
            onSubmit={onSubmit}
            formId="new-proposal-form"
            title={title}
            description={shortDescription}
            actions={actions}
            markdownDescription={markdownDescription}
          />
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
