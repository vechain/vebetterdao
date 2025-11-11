"use client"

import { Button } from "@chakra-ui/react"

interface EqualVotesButtonProps {
  onClick: () => void
}

export const EqualVotesButton = ({ onClick }: EqualVotesButtonProps) => {
  return (
    <Button
      variant="ghost"
      colorPalette="blue"
      onClick={onClick}
      w="full"
      justifyContent="center"
      textStyle="md"
      fontWeight="semibold">
      {"Equal votes"}
    </Button>
  )
}
