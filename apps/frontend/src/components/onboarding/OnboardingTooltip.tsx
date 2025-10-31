import { Button, Flex, HStack, IconButton, Popover, Portal, Text } from "@chakra-ui/react"
import { type ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { LuChevronLeft } from "react-icons/lu"

import { OnboardingHighlight } from "./OnboardingHighlight"

export interface OnboardingTooltipProps {
  isOpen: boolean
  title: string
  description: string
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onPrev?: () => void
  showPrev?: boolean
  children: ReactElement
  placement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end"
}

export const OnboardingTooltip = ({
  isOpen,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  showPrev = true,
  children,
  placement = "bottom",
}: OnboardingTooltipProps) => {
  const { t } = useTranslation()

  return (
    <Popover.Root open={isOpen} positioning={{ placement, gutter: 16 }}>
      <OnboardingHighlight isActive={isOpen}>
        <Popover.Trigger>{children}</Popover.Trigger>
      </OnboardingHighlight>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="210px" zIndex="onboarding.tooltip" p="5">
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
            <Flex direction="column" gap={2}>
              <Text textStyle="sm" fontWeight="semibold" color="text.default">
                {title}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {description}
              </Text>
              <Flex justify="space-between" align="center">
                <Text textStyle="xs" color="text.subtle">
                  {currentStep}
                  {"/"}
                  {totalSteps}
                </Text>
                <HStack gap={2}>
                  {showPrev && (
                    <IconButton
                      size="xs"
                      variant="outline"
                      onClick={onPrev}
                      aria-label="Previous step"
                      borderRadius="full">
                      <LuChevronLeft />
                    </IconButton>
                  )}
                  <Button size="xs" onClick={onNext} borderRadius="full">
                    {t("Next")}
                  </Button>
                </HStack>
              </Flex>
            </Flex>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
}
