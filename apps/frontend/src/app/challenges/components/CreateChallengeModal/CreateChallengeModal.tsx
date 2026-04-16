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
  const showFooter = (!!previousStep && previousStep.key !== "review") || currentStep.key === "review"

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
      <CustomModalContent
        w="full"
        maxW="40rem"
        h={{ base: "90dvh", md: "60dvh" }}
        maxHeight={{ base: "90dvh", md: "60dvh" }}
        overflow="hidden"
        display="flex"
        flexDirection="column">
        <Dialog.Header pb="4" borderBottomWidth="1px" borderColor="border.secondary">
          <HStack gap="3" align="center">
            <Box
              boxSize="12"
              borderRadius="full"
              bg="bg.secondary"
              overflow="hidden"
              p="1.5"
              border="1px solid"
              borderColor="border.secondary">
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

        <Dialog.Body
          flex="1"
          minH="0"
          overflowY="auto"
          px={{ base: "4", md: "6" }}
          py="5"
          bg="bg.secondary"
          pb="4"
          borderBottomRadius={showFooter ? undefined : "inherit"}>
          <VStack align="stretch" gap="5">
            {visibleSteps.map(step => {
              const isCurrent = step.key === currentStep.key
              const controlsMaxWidth = step.key === "review" ? "40rem" : "32rem"
              return (
                <VStack key={step.key} align="stretch" gap="3">
                  <AssistantBubble>{step.prompt}</AssistantBubble>
                  {step.answer && (!isCurrent || flow.isTyping) && <UserBubble>{step.answer}</UserBubble>}
                  {isCurrent && !flow.isTyping && (
                    <Box pl={{ base: "12", md: "13" }} w="full">
                      <Box maxW={controlsMaxWidth}>{step.controls}</Box>
                    </Box>
                  )}
                </VStack>
              )
            })}

            {flow.isTyping && <TypingIndicator />}

            <Box ref={flow.messagesEndRef} />
          </VStack>
        </Dialog.Body>

        {showFooter && (
          <Dialog.Footer pt="4" borderTopWidth="1px" borderColor="border.secondary">
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
        )}

        <Dialog.CloseTrigger asChild>
          <CloseButton size="sm" />
        </Dialog.CloseTrigger>
      </CustomModalContent>
    </Dialog.Root>
  )
}
