"use client"

import { Box, Button, HStack, IconButton, NumberInput, Text } from "@chakra-ui/react"
import { Minus, Plus } from "iconoir-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

type PointsSelectorProps = {
  value: string
  onChange: (value: string) => void
  max: number
}

export const PointsSelector = ({ value, onChange, max }: PointsSelectorProps) => {
  const { t } = useTranslation()

  const handleChange = useCallback(
    (details: { value: string; valueAsNumber: number }) => {
      onChange(details.value || "0")
    },
    [onChange],
  )

  const handleMax = useCallback(() => {
    onChange(max.toString())
  }, [onChange, max])

  return (
    <NumberInput.Root value={value} onValueChange={handleChange} min={0} max={max} step={1} clampValueOnBlur>
      <HStack gap={3}>
        <NumberInput.DecrementTrigger asChild>
          <IconButton
            aria-label={t("Decrease points")}
            rounded="full"
            color="actions.secondary.text"
            bg="actions.secondary.default"
            _hover={{ bg: "actions.secondary.hover" }}
            size="xs"
            boxSize={9}
            p={1}
            flexShrink={0}>
            <Minus strokeWidth={2} />
          </IconButton>
        </NumberInput.DecrementTrigger>
        <Box flex={12} position="relative">
          <NumberInput.Input
            placeholder="0"
            textAlign="center"
            borderRadius="xl"
            h={9}
            bg="bg.primary"
            borderColor="border.primary"
            borderWidth="1px"
            pl={3}
            pr={10}
          />
          <Box position="absolute" right={2.5} top="50%" transform="translateY(-50%)" pointerEvents="none">
            <Text color="text.default" textStyle="md">
              {t("pts")}
            </Text>
          </Box>
        </Box>
        <NumberInput.IncrementTrigger asChild>
          <IconButton
            aria-label={t("Increase points")}
            rounded="full"
            bg="actions.secondary.default"
            _hover={{ bg: "actions.secondary.hover" }}
            size="xs"
            boxSize={9}
            p={1}
            flexShrink={0}>
            <Plus strokeWidth={2} />
          </IconButton>
        </NumberInput.IncrementTrigger>
        <Button
          color="actions.secondary.text"
          bg="actions.secondary.default"
          _hover={{ bg: "actions.secondary.hover" }}
          boxSize={9}
          p={1}
          onClick={handleMax}
          mx="auto">
          {t("Max")}
        </Button>
      </HStack>
    </NumberInput.Root>
  )
}
