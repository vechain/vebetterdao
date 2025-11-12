"use client"

import { Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

interface CustomiseAllocationButtonProps {
  onClick: () => void
}

export const CustomiseAllocationButton = ({ onClick }: CustomiseAllocationButtonProps) => {
  const { t } = useTranslation()
  return (
    <Button
      variant="ghost"
      colorPalette="blue"
      onClick={onClick}
      w="full"
      justifyContent="center"
      textStyle="md"
      fontWeight="semibold">
      {t("Customise votes")}
    </Button>
  )
}
