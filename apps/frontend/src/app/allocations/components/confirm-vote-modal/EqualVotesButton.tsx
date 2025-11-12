"use client"

import { Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

interface EqualVotesButtonProps {
  onClick: () => void
}

export const EqualVotesButton = ({ onClick }: EqualVotesButtonProps) => {
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
      {t("Equal votes")}
    </Button>
  )
}
