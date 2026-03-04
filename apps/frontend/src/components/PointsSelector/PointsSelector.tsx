"use client"

import { Box, Button, HStack, IconButton, NumberInput, Text } from "@chakra-ui/react"
import { Minus, Plus } from "iconoir-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

type PointsSelectorProps = {
  value: string
  onChange: (value: string) => void
  max: number
  min?: number
}

export const PointsSelector = ({ value, onChange, max, min = 0 }: PointsSelectorProps) => {
  const { t } = useTranslation()

  const handleChange = useCallback(
    (details: { value: string; valueAsNumber: number }) => {
      onChange(details.value || "0")
    },
    [onChange],
  )

  const handleMax = useCallback(() => {
    onChange(String(max))
  }, [onChange, max])

  return (
    <NumberInput.Root value={value} onValueChange={handleChange} min={min} max={max} step={1} clampValueOnBlur>
      <HStack gap={3} py={2}>
        <HStack gap={0} flex={1} borderWidth="1px" borderColor="border" rounded="xl" overflow="hidden" bg="bg.panel">
          <NumberInput.DecrementTrigger asChild>
            <IconButton
              aria-label={t("Decrease points")}
              variant="ghost"
              rounded="none"
              minW="44px"
              h="44px"
              _hover={{ bg: "bg.muted" }}
              flexShrink={0}>
              <Minus strokeWidth={2} />
            </IconButton>
          </NumberInput.DecrementTrigger>
          <Box flex={2} position="relative" borderInlineWidth="1px" borderColor="border">
            <NumberInput.Input
              placeholder="0"
              textAlign="center"
              border="none"
              h="44px"
              bg="transparent"
              pl={3}
              pr={10}
              autoFocus={false}
              tabIndex={-1}
              _focus={{ outline: "none", boxShadow: "none" }}
            />
            <Box position="absolute" right={3} top="50%" transform="translateY(-50%)" pointerEvents="none">
              <Text color="fg.muted" textStyle="sm">
                {t("pts")}
              </Text>
            </Box>
          </Box>
          <NumberInput.IncrementTrigger asChild>
            <IconButton
              aria-label={t("Increase points")}
              variant="ghost"
              rounded="none"
              minW="44px"
              h="44px"
              _hover={{ bg: "bg.muted" }}
              flexShrink={0}>
              <Plus strokeWidth={2} />
            </IconButton>
          </NumberInput.IncrementTrigger>
        </HStack>
        <Button variant="ghost" rounded="xl" h="44px" px={4} onClick={handleMax} flexShrink={0}>
          {t("Max")}
        </Button>
      </HStack>
    </NumberInput.Root>
  )
}
