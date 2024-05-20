import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

import { Box, Button, Card, CardBody, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { ChangeEvent, useCallback } from "react"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import dynamic from "next/dynamic"

import { ContextStore } from "@uiw/react-md-editor"
import rehypeSanitize from "rehype-sanitize"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export const NewProposalPageDiscussionContent = () => {
  const router = useRouter()

  const { markdownDescription, setData } = useProposalFormStore()

  const onChange = useCallback(
    (value?: string, _event?: ChangeEvent<HTMLTextAreaElement>, _state?: ContextStore) => {
      setData({ markdownDescription: value })
    },
    [setData],
  )
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
          <Heading size="lg">Share more about your idea</Heading>
          <Text fontSize="md" color="gray.500">
            Providing more information will help the community understand the purpose of your proposal and make informed
            voting decisions. Include details such as motivation, a detailed description, or any other relevant
            information.
          </Text>

          <Box w="full" h={500}>
            <MDEditor
              value={markdownDescription}
              onChange={onChange}
              height={"100%"}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
            />
          </Box>

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
  )
}
