import { useProposalFormStore } from "@/store/useProposalFormStore"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useCallback } from "react"
import { ExecutableFunctionCard } from "./ExecutableFunctionCard"

export const NewProposalFormDetailsPageContent: React.FC = () => {
  const { actions, title, shortDescription, setData } = useProposalFormStore()

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setData({ title: e.target.value })
    },
    [setData],
  )

  const onShortDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setData({ shortDescription: e.target.value })
    },
    [setData],
  )

  return (
    <Card w="full">
      <CardBody py={8}>
        <VStack spacing={8} align="flex-start">
          <Heading size="lg">What is your proposal about?</Heading>
          <Heading size="md">Basic information</Heading>
          <FormControl>
            <FormLabel>Proposal title</FormLabel>
            <Input placeholder="Enter proposal title" value={title} onChange={onTitleChange} />
          </FormControl>
          <FormControl>
            <FormLabel>Proposal description</FormLabel>
            <Textarea
              placeholder="Enter proposal description"
              value={shortDescription}
              onChange={onShortDescriptionChange}
            />
          </FormControl>
          <VStack spacing={4} align="flex-start" w="full" mt={4}>
            <Heading size="md">Executable functions</Heading>
            {actions?.map((action, index) => <ExecutableFunctionCard key={index} action={action} index={index} />)}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
