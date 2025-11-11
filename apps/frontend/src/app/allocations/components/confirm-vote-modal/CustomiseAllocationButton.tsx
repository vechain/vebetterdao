"use client"

import { Button } from "@chakra-ui/react"

interface CustomiseAllocationButtonProps {
  onClick: () => void
}

export const CustomiseAllocationButton = ({ onClick }: CustomiseAllocationButtonProps) => {
  return (
    <Button
      variant="ghost"
      colorPalette="blue"
      onClick={onClick}
      w="full"
      justifyContent="center"
      textStyle="md"
      fontWeight="semibold">
      {"Customise allocation"}
    </Button>
  )
}
