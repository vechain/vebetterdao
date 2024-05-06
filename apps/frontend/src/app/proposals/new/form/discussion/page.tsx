"use client"

import { MotionVStack } from "@/components"
import { useProposalFormStore } from "@/store/useProposalFormStore"
import { AnalyticsUtils } from "@/utils"
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import MDEditor, { ContextStore } from "@uiw/react-md-editor"
import dynamic from "next/dynamic"
import router from "next/router"
import { ChangeEvent, useCallback, useEffect } from "react"
import rehypeSanitize from "rehype-sanitize"

export default function NewProposalDiscPage() {
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

  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", "light")
    return () => {
      document.documentElement.removeAttribute("data-color-mode")
    }
  }, [])

  useEffect(() => {
    AnalyticsUtils.trackPage("NewProposal")
  }, [])

  return (
    <MotionVStack>
      <Card>
        <CardBody py={8}>
          <VStack spacing={8} align="flex-start">
            <Heading size="lg">Text only proposal</Heading>

            <FormControl>
              <FormLabel></FormLabel>
            </FormControl>
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
    </MotionVStack>
  )
}
