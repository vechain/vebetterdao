"use client"

import "./typing-indicator.css"

import { Box, Button, CloseButton, Dialog, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { CustomModalContent } from "@/components/CustomModalContent"

import { AssistantBubble, TypingIndicator, UserBubble } from "./ChatBubbles"
import { buildSteps } from "./steps"
import { primaryVariant, tertiaryVariant } from "./types"
import { useCreateChallengeFlow } from "./useCreateChallengeFlow"

interface CreateChallengeModalProps {
  defaultKind: number
  currentRound: number
  children: React.ReactNode
}

export const CreateChallengeModal = ({ defaultKind, currentRound, children }: CreateChallengeModalProps) => {
  const flow = useCreateChallengeFlow(defaultKind, currentRound)
  const { t } = useTranslation()

  const steps = useMemo(() => buildSteps(flow, t), [flow, t])

  const titleKey = flow.isSponsored ? "Create sponsored challenge" : "Create challenge"

  const currentStep = (steps.find(step => step.isRelevant && !step.isComplete) ?? steps[steps.length - 1])!
  const currentStepIndex = steps.findIndex(step => step.key === currentStep.key)
  const visibleSteps = steps.filter((step, index) => step.isRelevant && index <= currentStepIndex)
  const previousStep = [...steps.slice(0, currentStepIndex)].reverse().find(step => step.isRelevant)

  useEffect(() => {
    if (!flow.open) return
    const timeout = setTimeout(
      () => flow.messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
      60,
    )
    return () => clearTimeout(timeout)
  }, [currentStep.key, flow.open, flow.isTyping, flow.messagesEndRef])

  return (
    <Dialog.Root open={flow.open} onOpenChange={flow.handleOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <CustomModalContent maxW={{ base: "100%", md: "2xl" }} maxH="90vh">
        <Dialog.Header pb="5">
          <HStack gap="3" align="center">
            <Box boxSize="14" borderRadius="3xl" bg="bg.secondary" overflow="hidden" p="1.5">
              <Image src="/assets/images/B3MO_Rewards.png" alt="B3MO" boxSize="full" objectFit="contain" />
            </Box>
            <VStack align="start" gap="0">
              <Dialog.Title>{t(titleKey)}</Dialog.Title>
              <Text textStyle="xs" color="text.subtle">
                {"B3MO"}
              </Text>
            </VStack>
          </HStack>
        </Dialog.Header>

        <Dialog.Body overflowY="auto" pb="2">
          <VStack align="stretch" gap="4">
            <AssistantBubble>
              <Text textStyle="sm">{t("Hi, I'm B3MO. I'll guide you through your challenge setup.")}</Text>
            </AssistantBubble>

            {visibleSteps.map(step => {
              const isCurrent = step.key === currentStep.key
              return (
                <VStack key={step.key} align="stretch" gap="3">
                  <AssistantBubble>{step.prompt}</AssistantBubble>
                  {step.answer && (!isCurrent || flow.isTyping) && <UserBubble>{step.answer}</UserBubble>}
                  {isCurrent && !flow.isTyping && step.controls}
                </VStack>
              )
            })}

            {flow.isTyping && <TypingIndicator />}

            <Box ref={flow.messagesEndRef} />
          </VStack>
        </Dialog.Body>

        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="outline">{t("Cancel")}</Button>
          </Dialog.ActionTrigger>
          {!!previousStep && previousStep.key !== "review" && (
            <Button
              variant={tertiaryVariant}
              onClick={() => {
                if (previousStep.key !== "review") flow.resetFrom(previousStep.key)
              }}>
              {t("Back")}
            </Button>
          )}
          {currentStep.key === "review" && (
            <Button variant={primaryVariant} disabled={!flow.canSubmit} onClick={flow.handleSubmit}>
              {t("Create")}
            </Button>
          )}
        </Dialog.Footer>

        <Dialog.CloseTrigger asChild>
          <CloseButton size="sm" />
        </Dialog.CloseTrigger>
      </CustomModalContent>
    </Dialog.Root>
  )
}
