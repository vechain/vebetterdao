"use client"

import { Button, ButtonGroup, HStack } from "@chakra-ui/react"

import { useVotingButtonConfig } from "../hooks/useVotingButtonConfig"

interface VoteButtonsProps {
  /** Mobile uses full-width buttons, desktop uses minWidth */
  variant?: "mobile" | "desktop"
}

export const VoteButtons = ({ variant = "desktop" }: VoteButtonsProps) => {
  const buttonConfig = useVotingButtonConfig()
  const isMobile = variant === "mobile"

  if (!buttonConfig) return null

  if (buttonConfig.type === "editing") {
    const buttons = (
      <ButtonGroup w={{ base: "full", md: "unset" }}>
        <Button
          flex={isMobile ? 1 : undefined}
          minWidth="36"
          variant="secondary"
          onClick={buttonConfig.secondaryOnClick}>
          {buttonConfig.secondaryText}
        </Button>
        <Button
          flex={isMobile ? 1 : undefined}
          minWidth={isMobile ? undefined : "36"}
          variant="primary"
          disabled={buttonConfig.primaryDisabled}
          onClick={buttonConfig.primaryOnClick}>
          {buttonConfig.primaryText}
        </Button>
      </ButtonGroup>
    )

    // Mobile wraps in HStack, desktop returns fragment
    return isMobile ? (
      <HStack gap="3" w="full">
        {buttons}
      </HStack>
    ) : (
      buttons
    )
  }

  // Single button
  return (
    <Button
      w={isMobile ? "full" : undefined}
      minWidth={isMobile ? undefined : "36"}
      variant="primary"
      disabled={buttonConfig.primaryDisabled}
      onClick={buttonConfig.primaryOnClick}>
      {buttonConfig.primaryText}
    </Button>
  )
}
