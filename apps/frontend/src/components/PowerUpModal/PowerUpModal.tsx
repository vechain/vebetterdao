"use client"

import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Flash } from "iconoir-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { PowerDownContent } from "./PowerDownContent"
import { PowerUpContent } from "./PowerUpContent"

type Mode = "power-up" | "power-down"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const PowerUpModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const [mode, setMode] = useState<Mode>("power-up")

  const handleClose = () => {
    onClose()
    setMode("power-up")
  }

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      modalProps={{ closeOnInteractOutside: true }}
      modalContentProps={{ maxW: "500px" }}>
      <VStack gap={10} w="full">
        <Box w="full" bg="card.default" rounded="full" p="1" position="relative">
          <Box
            position="absolute"
            top="1"
            bottom="1"
            left={mode === "power-up" ? "1" : "50%"}
            w="calc(50% - 4px)"
            bg="actions.primary.default"
            rounded="full"
            transition="left 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          />
          <HStack w="full" position="relative">
            <HStack
              as="button"
              flex={1}
              justify="center"
              gap="1.5"
              py="1.5"
              rounded="full"
              cursor="pointer"
              onClick={() => setMode("power-up")}>
              <Icon
                as={Flash}
                boxSize="4"
                color={mode === "power-up" ? "white" : "text.subtle"}
                transition="color 0.2s"
              />
              <Text
                textStyle="sm"
                fontWeight="semibold"
                color={mode === "power-up" ? "white" : "text.subtle"}
                transition="color 0.2s">
                {t("Power up")}
              </Text>
            </HStack>
            <HStack
              as="button"
              flex={1}
              justify="center"
              gap="1.5"
              py="1.5"
              rounded="full"
              cursor="pointer"
              onClick={() => setMode("power-down")}>
              <Text
                textStyle="sm"
                fontWeight="semibold"
                color={mode === "power-down" ? "white" : "text.subtle"}
                transition="color 0.2s">
                {t("Redeem")}
              </Text>
            </HStack>
          </HStack>
        </Box>

        <Box>
          {mode === "power-up" ? <PowerUpContent onClose={handleClose} /> : <PowerDownContent onClose={handleClose} />}
        </Box>
      </VStack>
    </BaseModal>
  )
}
